import XRegExp from "xregexp";
import {
  FilterDefinition,
  FilterDefinitions,
  parseValue,
  FilterOperator,
  isNotNull,
  SUPPORTED_OPERATORS,
  Path,
} from "./lib";

export type PostgrestQueryParserOptions = {
  /**
   * If defined, will use only filters that apply to the given paths
   */
  exclusivePaths?: string[];
};

export class PostgrestQueryParser {
  private readonly _params: URLSearchParams;

  private _filters: FilterDefinitions | undefined;
  private _paths: Path[] | undefined;

  constructor(
    query: string,
    public readonly opts?: PostgrestQueryParserOptions
  ) {
    this._params = new URLSearchParams(query);
  }

  /**
   * Getter that returns the paths and their aliases that the query selects. Will do the computation only once.
   *
   * ```js
   * const p = new PostgrestParser(
   * supabaseClient.from("test")
   *    .select(
   *      `name,
   *       city:cities (
   *        test:name
   *      ),
   *      countries (
   *        capital,
   *        population,
   *        some_ref (
   *          test:first,
   *          second
   *        )
   *      )`
   *    );
   * console.log(p.paths);
   * //  [
   * //    { alias: undefined, path: "name" },
   * //    { alias: "city.test", path: "cities.name" },
   * //    { alias: undefined, path: "countries.capital" },
   * //    { alias: undefined, path: "countries.population" },
   * //    {
   * //      alias: "countries.some_ref.test",
   * //      path: "countries.some_ref.first",
   * //    },
   * //    { alias: undefined, path: "countries.some_ref.second" },
   * //  ];
   * ```
   *
   * @returns an array of paths that the query selects, containing the columns and aliases
   */
  get paths(): Path[] {
    if (!this._paths) {
      const select = this._params.get("select");
      this._paths = select ? this.parseSelectParam(select) : [];
    }
    return this._paths;
  }

  /**
   * Getter that returns the filters that this query applies in a json object.
   *
   * ```js
   * const p = new PostgrestParser(
   * supabaseClient.from("test").select('*')
   *  .or("full_name.eq.20,test.neq.true,and(full_name.eq.Test Name,email.eq.test@mail.com)")
   *  .eq("id", "123")
   *  .contains("id", "456")
   * );
   *
   * console.log(p.filters);
   *
   * // [
   * //   {
   * //     or: [
   * //       {
   * //         path: "full_name",
   * //         negate: false,
   * //         operator: "eq",
   * //         value: 20,
   * //       },
   * //       {
   * //         path: "test",
   * //         negate: false,
   * //         operator: "neq",
   * //         value: true,
   * //       },
   * //       {
   * //         and: [
   * //           {
   * //             path: "full_name",
   * //             negate: false,
   * //             operator: "eq",
   * //             value: "Test Name",
   * //           },
   * //           {
   * //             path: "email",
   * //             negate: false,
   * //             operator: "eq",
   * //             value: "test@mail.com",
   * //           },
   * //         ],
   * //       },
   * //     ],
   * //   },
   * //   {
   * //     path: "id",
   * //     negate: false,
   * //     operator: "eq",
   * //     value: 123,
   * //   },
   * //   {
   * //     path: "id",
   * //     negate: false,
   * //     operator: "cs",
   * //     value: 456,
   * //   },
   * // ];
   * ```
   *
   * @returns a FilterDefinitions object
   */
  get filters(): FilterDefinitions {
    if (!this._filters) {
      const filters: FilterDefinitions = [];
      this._params.forEach((value, key) => {
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
