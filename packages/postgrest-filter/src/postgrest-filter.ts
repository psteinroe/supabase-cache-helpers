import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import get from "lodash/get";
import {
  FilterDefinition,
  FilterDefinitions,
  FilterFn,
  OperatorFn,
  OPERATOR_MAP,
  parseValue,
  Path,
  ValueType,
} from "./lib";
import { PostgrestParser, PostgrestParserOptions } from "./postgrest-parser";

export class PostgrestFilter<Type extends object> {
  private _fn: FilterFn<Type> | undefined;
  private _selectFn: FilterFn<Type> | undefined;
  private _filtersFn: FilterFn<Type> | undefined;

  constructor(
    public readonly params: { filters: FilterDefinitions; paths: Path[] }
  ) {}

  public static from<Type extends object>(
    fb: PostgrestFilterBuilder<Type>,
    opts?: PostgrestParserOptions
  ): PostgrestFilter<Type> {
    const parser = new PostgrestParser(fb, opts);
    return new PostgrestFilter({
      filters: parser.filters,
      paths: parser.paths,
    });
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
      const filterFns = this.params.filters.map((d) => this.buildFilterFn(d));
      this._filtersFn = (obj): obj is Type => filterFns.every((fn) => fn(obj));
    }
    return this._filtersFn(obj);
  }

  hasPaths(obj: object): obj is Type {
    if (!this._selectFn) {
      this._selectFn = (obj): obj is Type =>
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
    const { operator, path, value, negate, alias } = def;
    const filterFn = OPERATOR_MAP[operator];
    if (!filterFn) throw new Error(`Operator ${operator} is not supported`);

    return (obj: object) =>
      this.applyFilterFn(obj, alias ?? path, { filterFn, value, negate });
  }
}
