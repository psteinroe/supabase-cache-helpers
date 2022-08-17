import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import XRegExp from "xregexp";
import get from "lodash/get";
import {
  FilterDefinition,
  FilterDefinitions,
  parseValue,
  FilterOperator,
  isNotNull,
  SUPPORTED_OPERATORS,
  sortSearchParams,
  Path,
  getAllPaths,
} from "./lib";

export type PostgrestParserOptions = {
  /**
   * If defined, will use only filters that apply to the given paths
   */
  exclusivePaths?: string[];
};

export class PostgrestParser<Type> {
  private readonly _url: URL;
  private readonly _headers: { [key: string]: string };
  private readonly _body: object | undefined;
  private readonly _method: "GET" | "HEAD" | "POST" | "PATCH" | "DELETE";

  public readonly queryKey: string;
  public readonly bodyKey: string | undefined;
  public readonly count: string | null;
  public readonly schema: string | undefined;
  public readonly table: string;
  public readonly isHead: boolean | undefined;

  private _filters: FilterDefinitions | undefined;
  private _paths: Path[] | undefined;

  constructor(
    fb: PostgrestFilterBuilder<Type>,
    public readonly opts?: PostgrestParserOptions
  ) {
    this._url = new URL(fb["url"]);
    this._headers = { ...fb["headers"] };
    this._body = fb["body"] ? { ...fb["body"] } : undefined;
    this._method = fb["method"];

    this.queryKey = sortSearchParams(this._url.searchParams).toString();

    this.table = this._url
      .toString()
      .split("/rest/v1/")
      .pop()
      ?.split("?")
      .shift() as string;

    if (this._body) {
      // Get a sorted list of all paths
      const paths = getAllPaths(this._body as Record<string, unknown>).sort();
      const bodyParams = new URLSearchParams();
      paths.forEach((key) => {
        const value = get(this._body, key);
        bodyParams.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value)
        );
      });
      this.bodyKey = sortSearchParams(bodyParams).toString();
    }

    // 'Prefer': return=minimal|representation,count=exact|planned|estimated
    const preferHeaders: Record<string, string> = (
      this._headers["Prefer"] ?? ""
    )
      .split(",")
      .reduce<Record<string, string>>((prev, curr) => {
        const s = curr.split("=");
        return {
          ...prev,
          [s[0]]: s[1],
        };
      }, {});
    this.count = preferHeaders["count"] ?? null;

    this.schema =
      this._headers["Accept-Profile"] ??
      this._headers["Content-Profile"] ??
      undefined;

    this.isHead = this._method === "HEAD";
  }

  get paths(): Path[] {
    if (!this._paths) {
      const select = this._url.searchParams.get("select");
      this._paths = select ? this.parseSelectParam(select) : [];
    }
    return this._paths;
  }

  get filters(): FilterDefinitions {
    if (!this._filters) {
      const filters: FilterDefinitions = [];
      this._url.searchParams.forEach((value, key) => {
        if (
          SUPPORTED_OPERATORS.some(
            (f) => key === f || value.split(".").includes(f)
          )
        ) {
          const filter = this.parseFilterString(`${key}.${value}`, undefined);
          if (filter !== null) filters.push(filter);
        }
      });
      this._filters = filters;
    }
    return this._filters;
  }

  private parseSelectParam(s: string, currentPath?: Path): Path[] {
    const foreignTables = XRegExp.matchRecursive(
      `,${s}`,
      ",[^,]*\\(",
      "\\)",
      "g",
      {
        valueNames: {
          "0": null,
          "1": "tableName",
          "2": "selectedColumns",
          "3": null,
        },
      }
    ).reduce((prev, curr, idx, matches) => {
      if (curr.name === "selectedColumns") {
        const name = matches[idx - 1].value.slice(1, -1);
        prev = { ...prev, [name]: curr.value };
      }
      return prev;
    }, {});

    const columns = s
      .replace(
        new RegExp(
          `${Object.entries(foreignTables)
            .map(([table, selectedColumns]) =>
              `${table}(${selectedColumns})`
                .replace(/\(/g, "\\(")
                .replace(/\)/g, "\\)")
            )
            .join("|")}`,
          "g"
        ),
        ""
      )
      .replace(/(,)\1+/g, ",")
      .split(",")
      .filter((c) => c.length > 0)
      .map((c) => {
        const split = c.split(":");
        const hasAlias = split.length > 1;
        return {
          alias: hasAlias
            ? [currentPath?.alias, split.length > 1 ? split[0] : undefined]
                .filter(Boolean)
                .join(".")
            : undefined,
          path: [currentPath?.path, split[hasAlias ? 1 : 0]]
            .filter(Boolean)
            .join("."),
        };
      });

    if (columns.find((c) => c.path.includes("*")))
      throw new Error("Wildcard selector is not supported");

    return [
      ...columns,
      ...Object.entries(foreignTables).flatMap(([table, selectedColumns]) =>
        this.parseSelectParam(`${selectedColumns}`, {
          path: [currentPath?.path, table.split(":").pop()?.split("!").shift()]
            .filter(Boolean)
            .join("."),
          alias: [
            currentPath?.alias,
            table.split(":").shift()?.split("!").shift(),
          ]
            .filter(Boolean)
            .join("."),
        })
      ),
    ];
  }

  private parseFilterString(
    filter: string,
    prefix?: string
  ):
    | FilterDefinition
    | { or: FilterDefinitions }
    | { and: FilterDefinitions }
    | null {
    if (filter.startsWith("and(") && filter.endsWith(")")) {
      // nested and
      const andFilters = filter
        .slice(4, -1)
        .split(",")
        .map((s) => this.parseFilterString(s, prefix))
        .filter(isNotNull);
      if (andFilters.length === 0) return null;
      else return { and: andFilters };
    }

    const split = filter.split(".");

    // or
    if ([split[0], split[1]].includes("or")) {
      let foreignTable: string | undefined;
      if (split[1] === "or") {
        // with foreign table
        foreignTable = split[0];
      }

      const orFilters = filter
        .slice(4 + (foreignTable ? foreignTable.length + 1 : 0), -1)
        .split(",")
        .reduce<string[]>((prev, curr, idx, filters) => {
          if (curr.startsWith("and(")) {
            // nested and
            prev = [...prev, [curr, filters[idx + 1]].join()];
          } else if (!curr.endsWith(")")) {
            prev = [...prev, curr];
          }
          return prev;
        }, [])
        .map((s) => this.parseFilterString(s, foreignTable))
        .filter(isNotNull);
      if (orFilters.length === 0) return null;
      else return { or: orFilters };
    }

    const path = [prefix, split[0]]
      .filter(Boolean)
      .join(".")
      .replace(/\s/g, "");

    // Check if the current path has an alias
    const alias = this.paths.find((p) => p.path === path)?.alias;

    if (
      Array.isArray(this.opts?.exclusivePaths) &&
      !this.opts?.exclusivePaths.includes(path)
    ) {
      return null;
    }

    const negate = split[1] === "not";
    const operator = (negate ? split[2] : split[1]) as FilterOperator;
    const value = (negate ? split.slice(3) : split.slice(2)).join(".");
    return {
      path,
      alias,
      negate,
      operator,
      value: parseValue(value),
    };
  }
}
