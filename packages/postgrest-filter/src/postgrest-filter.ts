import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { get } from "lodash";
import {
  FilterDefinition,
  FilterDefinitions,
  FilterFn,
  isObject,
  OperatorFn,
  OPERATOR_MAP,
  parseValue,
  Path,
  ValueType,
} from "./lib";
import {
  PostgrestQueryParser,
  PostgrestQueryParserOptions,
} from "./postgrest-query-parser";

export class PostgrestFilter<Result extends Record<string, unknown>> {
  private _fn: FilterFn<Result> | undefined;
  private _selectFn: FilterFn<Result> | undefined;
  private _filtersFn: FilterFn<Result> | undefined;

  constructor(
    public readonly params: { filters: FilterDefinitions; paths: Path[] }
  ) {}

  public static fromQuery(query: string, opts?: PostgrestQueryParserOptions) {
    const parser = new PostgrestQueryParser(query, opts);
    return new PostgrestFilter({
      filters: parser.filters,
      paths: parser.paths,
    });
  }

  public static fromFilterBuilder<
    Table extends Record<string, unknown>,
    Result extends Record<string, unknown>
  >(
    fb: PostgrestFilterBuilder<Table, Result>,
    opts?: PostgrestQueryParserOptions
  ): PostgrestFilter<Result> {
    const parser = new PostgrestQueryParser(
      fb["url"].searchParams.toString(),
      opts
    );
    return new PostgrestFilter<Result>({
      filters: parser.filters,
      paths: parser.paths,
    });
  }

  apply(obj: unknown): obj is Result {
    if (!this._fn) {
      this._fn = (obj): obj is Result =>
        this.applyFilters(obj) && this.hasPaths(obj);
    }
    return this._fn(obj);
  }

  applyFilters(obj: unknown): obj is Result {
    if (!this._filtersFn) {
      const filterFns = this.params.filters.map((d) => this.buildFilterFn(d));
      this._filtersFn = (obj): obj is Result =>
        filterFns.every((fn) => isObject(obj) && fn(obj));
    }
    return this._filtersFn(obj);
  }

  hasPaths(obj: unknown): obj is Result {
    if (!this._selectFn) {
      this._selectFn = (obj): obj is Result =>
        this.params.paths.every(
          (p) => typeof get(obj, p.alias ?? p.path) !== "undefined"
        );
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
    // parse json operators "->" and "->>" to "."
    const pathElements = path.replace(/->>|->/g, ".").split(".");
    const v = get(obj, pathElements[0]);

    if (typeof v === "undefined") return false;

    if (pathElements.length > 1) {
      // recursively resolve json path
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
    const { operator, path, value, negate, alias } = def;
    const filterFn = OPERATOR_MAP[operator];
    if (!filterFn) throw new Error(`Operator ${operator} is not supported`);

    return (obj: object) =>
      this.applyFilterFn(obj, alias ?? path, { filterFn, value, negate });
  }
}
