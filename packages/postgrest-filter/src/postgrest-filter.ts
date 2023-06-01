import { PostgrestBuilder } from '@supabase/postgrest-js';

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
  extractPathsFromFilters,
  transformRecursive,
  filterFilterDefinitionsByPaths,
} from './lib';
import { get } from './lib/utils';
import {
  PostgrestQueryParser,
  PostgrestQueryParserOptions,
} from './postgrest-query-parser';

export class PostgrestFilter<Result extends Record<string, unknown>> {
  private _fn: FilterFn<Result> | undefined;
  private _selectFn: FilterFn<Result> | undefined;
  private _filtersFn: FilterFn<Result> | undefined;
  private _filterPaths: Path[];

  constructor(
    public readonly params: { filters: FilterDefinitions; paths: Path[] }
  ) {
    this._filterPaths = extractPathsFromFilters(this.params.filters);
  }

  public static fromQuery(query: string, opts?: PostgrestQueryParserOptions) {
    const parser = new PostgrestQueryParser(query, opts);
    return new PostgrestFilter({
      filters: parser.filters,
      paths: parser.paths,
    });
  }

  public static fromBuilder<
    Result extends Record<string, unknown> = Record<string, unknown>
  >(
    fb: PostgrestBuilder<Result>,
    opts?: PostgrestQueryParserOptions
  ): PostgrestFilter<Result> {
    const parser = new PostgrestQueryParser(
      fb['url'].searchParams.toString(),
      opts
    );
    return new PostgrestFilter<Result>({
      filters: parser.filters,
      paths: parser.paths,
    });
  }

  transform(obj: Record<string, unknown>): Record<string, unknown> {
    return transformRecursive(
      [...this.params.paths, ...this._filterPaths],
      obj,
      'alias'
    );
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

  hasFiltersOnPaths(paths: string[]): boolean {
    return (
      filterFilterDefinitionsByPaths(this.params.filters, paths).length > 0
    );
  }

  applyFiltersOnPaths(obj: unknown, paths: string[]): obj is Result {
    const filterFns = filterFilterDefinitionsByPaths(
      this.params.filters,
      paths
    ).map((d) => this.buildFilterFn(d));
    const filtersFn = (obj: unknown): obj is Result =>
      filterFns.every((fn) => isObject(obj) && fn(obj));
    return filtersFn(obj);
  }

  hasPaths(obj: unknown): obj is Result {
    if (!this._selectFn) {
      this._selectFn = (obj): obj is Result =>
        this.params.paths.every((p) =>
          this.hasPathRecursive(obj, p.alias ?? p.path)
        );
    }
    return this._selectFn(obj);
  }

  private hasPathRecursive(
    obj: unknown,
    basePath: string,
    objectPath?: string
  ): boolean {
    const v = get(obj, basePath);

    // Return early if we are not searching for a nested value and the path is valid
    if (!objectPath && typeof v !== 'undefined') return true;

    // If we are looking for a nested value and we found an array, validate that all array elements have a value for the required path
    if (objectPath && Array.isArray(v)) {
      return v.every((i) => typeof get(i, objectPath) !== 'undefined');
    }

    const pathElements = basePath.replace(/->>|->/g, '.').split('.');
    const currentPathElement = pathElements.pop();

    // Return if arrived at root level
    // obj is valid if v is null, because the foreign key relation can be null
    if (pathElements.length === 0) return v === null;
    // If there are levels to go up to, add current path element to object path and go up
    return this.hasPathRecursive(
      obj,
      pathElements.join('.'),
      [currentPathElement, objectPath].filter(Boolean).join('.')
    );
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
    const pathElements = path.replace(/->>|->/g, '.').split('.');
    const v = get(obj, pathElements[0]);

    if (typeof v === 'undefined') return false;

    if (pathElements.length > 1) {
      // recursively resolve json path
      return this.applyFilterFn(
        v as Record<string, unknown>,
        pathElements.slice(1).join('.'),
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
    if ('or' in def) {
      return (obj: object) => def.or.some((d) => this.buildFilterFn(d)(obj));
    }
    if ('and' in def) {
      return (obj: object) => def.and.every((d) => this.buildFilterFn(d)(obj));
    }
    const { operator, path, value, negate, alias } = def;
    const filterFn = OPERATOR_MAP[operator];
    if (!filterFn)
      throw new Error(
        `Unable to build filter function for ${JSON.stringify(
          def
        )}. Operator ${operator} is not supported.`
      );

    return (obj: object) =>
      this.applyFilterFn(obj, alias ?? path, { filterFn, value, negate });
  }
}
