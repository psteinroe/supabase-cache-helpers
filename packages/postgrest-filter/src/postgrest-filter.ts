import get from "lodash/get";
import XRegExp from "xregexp";
import {
  FilterDefinition,
  FilterDefinitions,
  FilterFn,
  OperatorFn,
  OPERATOR_MAP,
  parseValue,
  FilterOperator,
  isNotNull,
  ValueType,
  SUPPORTED_OPERATORS,
  isURLSearchParams,
} from "./lib";

export type PostgrestFilterOptions = {
  /**
   * If defined, will use only filters that apply to the given paths
   */
  exclusivePaths?: string[];
};

export class PostgrestFilter<Type extends object> {
  private _filters: FilterDefinitions | undefined;
  private _paths: string[] | undefined;
  private _fn: FilterFn<Type> | undefined;
  private _selectFn: FilterFn<Type> | undefined;
  private _filtersFn: FilterFn<Type> | undefined;

  constructor(
    public readonly params:
      | URLSearchParams
      | { filters: FilterDefinitions; paths: string[] },
    public readonly opts?: PostgrestFilterOptions
  ) {
    if (!isURLSearchParams(params)) {
      this._filters = params.filters;
      this._paths = params.paths;
    }
  }

  get paths(): string[] {
    if (!this._paths) {
      const select = (this.params as URLSearchParams).get("select");
      this._paths = select ? this.parseSelectParam(select) : [];
    }
    return this._paths;
  }

  get filters(): FilterDefinitions {
    if (!this._filters) {
      const filters: FilterDefinitions = [];
      (this.params as URLSearchParams).forEach((value, key) => {
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

  apply(obj: object): obj is Type {
    if (!this._fn) {
      this._fn = (obj): obj is Type =>
        this.applyFilters(obj) && this.hasPaths(obj);
    }
    return this._fn(obj);
  }

  applyFilters(obj: object): obj is Type {
    if (!this._filtersFn) {
      const filterFns = this.filters.map((d) => this.buildFilterFn(d));
      this._filtersFn = (obj): obj is Type => filterFns.every((fn) => fn(obj));
    }
    return this._filtersFn(obj);
  }

  hasPaths(obj: object): obj is Type {
    if (!this._selectFn) {
      this._selectFn = (obj): obj is Type =>
        this.paths.every((p) => typeof get(obj, p) !== "undefined");
    }
    return this._selectFn(obj);
  }

  private applyFilterFn(
    obj: object,
    path: string,
    {
      filterFn,
      value,
      negate,
    }: { filterFn: OperatorFn; value: ValueType; negate: boolean }
  ): boolean {
    const pathElements = path.split(".");
    const v = get(obj, pathElements[0]);

    if (typeof v === "undefined") return false;

    if (pathElements.length > 1) {
      // recursively resolve json path
      if (Array.isArray(v)) {
        return v.some((val) =>
          this.applyFilterFn(val, pathElements.slice(1).join("."), {
            filterFn,
            value,
            negate,
          })
        );
      }
      return this.applyFilterFn(
        v as Record<string, unknown>,
        pathElements.slice(1).join("."),
        {
          filterFn,
          value,
          negate,
        }
      );
    }

    const res = filterFn(parseValue(v), value);
    if (negate) return !res;
    return res;
  }

  private buildFilterFn(
    def:
      | FilterDefinition
      | { or: FilterDefinitions }
      | { and: FilterDefinitions }
  ): (obj: object) => boolean {
    if ("or" in def) {
      return (obj: object) => def.or.some((d) => this.buildFilterFn(d)(obj));
    }
    if ("and" in def) {
      return (obj: object) => def.and.every((d) => this.buildFilterFn(d)(obj));
    }
    const { operator, path, value, negate } = def;
    const filterFn = OPERATOR_MAP[operator];
    if (!filterFn) throw new Error(`Operator ${operator} is not supported`);

    return (obj: object) =>
      this.applyFilterFn(obj, path, { filterFn, value, negate });
  }

  private parseSelectParam(s: string, currentPath?: string): string[] {
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
      .map((c) => c.split(":").shift());

    if (columns.includes("*"))
      throw new Error("Wildcard selector is not supported");

    return [
      ...columns.map((c) =>
        [currentPath, c && c.split(":").shift()].filter(Boolean).join(".")
      ),
      ...Object.entries(foreignTables).flatMap(([table, selectedColumns]) =>
        this.parseSelectParam(
          `${selectedColumns}`,
          [currentPath, table.split(":").shift()?.split("!").shift()]
            .filter(Boolean)
            .join(".")
        )
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
      .replace(/\s/g, "")
      .replace(/->>|->/g, ".");

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
      negate,
      operator,
      value: parseValue(value),
    };
  }
}
