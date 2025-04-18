import { denormalize } from './filter/denormalize';
import { extractPathsFromFilters } from './lib/extract-paths-from-filter';
import { filterFilterDefinitionsByPaths } from './lib/filter-filter-definitions-by-paths';
import { get } from './lib/get';
import { isObject } from './lib/is-object';
import {
  MaybeLikePostgrestBuilder,
  isLikePostgrestBuilder,
} from './lib/like-postgrest-builder';
import { OPERATOR_MAP } from './lib/operators';
import { parseValue } from './lib/parse-value';
import type {
  FilterDefinition,
  FilterDefinitions,
  FilterFn,
  OperatorFn,
  Path,
  ValueType,
} from './lib/query-types';
import {
  PostgrestQueryParser,
  type PostgrestQueryParserOptions,
} from './postgrest-query-parser';

export class PostgrestFilter<Result extends Record<string, unknown>> {
  private _fn: FilterFn<Result> | undefined;
  private _selectFn: FilterFn<Result> | undefined;
  private _filtersFn: FilterFn<Result> | undefined;
  private _filterPaths: Path[];
  public hasWildcardPath: boolean | undefined;
  public hasAggregatePath: boolean | undefined;

  constructor(
    public readonly params: { filters: FilterDefinitions; paths: Path[] },
  ) {
    this._filterPaths = extractPathsFromFilters(
      this.params.filters,
      this.params.paths,
    );
    this.hasWildcardPath = this.params.paths.some((p) =>
      p.declaration.endsWith('*'),
    );
    this.hasAggregatePath = this.params.paths.some((p) => Boolean(p.aggregate));
  }

  public static fromQuery(query: string, opts?: PostgrestQueryParserOptions) {
    const parser = new PostgrestQueryParser(query, opts);
    return new PostgrestFilter({
      filters: parser.filters,
      paths: parser.paths,
    });
  }

  public static fromBuilder<
    Result extends Record<string, unknown> = Record<string, unknown>,
  >(
    fb: MaybeLikePostgrestBuilder<Result>,
    opts?: PostgrestQueryParserOptions,
  ): PostgrestFilter<Result> {
    if (!isLikePostgrestBuilder(fb)) {
      throw new Error('Invalid PostgrestBuilder');
    }

    const parser = new PostgrestQueryParser(
      fb['url'].searchParams.toString(),
      opts,
    );
    return new PostgrestFilter<Result>({
      filters: parser.filters,
      paths: parser.paths,
    });
  }

  denormalize<Type extends Record<string, unknown>>(obj: Type): Type {
    return denormalize([...this.params.paths, ...this._filterPaths], obj);
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
      paths,
    ).map((d) => this.buildFilterFn(d));
    const filtersFn = (obj: unknown): obj is Result =>
      filterFns.every((fn) => isObject(obj) && fn(obj));
    return filtersFn(obj);
  }

  hasPaths(obj: unknown): obj is Result {
    if (!this._selectFn) {
      this._selectFn = (obj): obj is Result =>
        this.params.paths.every((p) =>
          this.hasPathRecursive(obj, p.alias ?? p.path),
        );
    }
    return this._selectFn(obj);
  }

  private hasPathRecursive(obj: unknown, path: string): boolean {
    // obj is valid if v is null, because the foreign key relation can be null
    if (obj === null) return true;

    // normalise json operators "->" and "->>" to "."
    const pathElements = path.replace(/->>|->/g, '.').split('.');

    // we are at the deepest level
    if (pathElements.length === 1) {
      // else check if the path exists
      return typeof get(obj, pathElements[0]) !== 'undefined';
    }

    // go deeper
    const currentPathElement = pathElements.shift();
    const v = get(obj, currentPathElement!);

    // undefined means the path does not exist
    if (typeof v === 'undefined') return false;

    // if we have an array, check if all elements have the path
    if (Array.isArray(v)) {
      return v.every((i) => this.hasPathRecursive(i, pathElements.join('.')));
    }

    // if we dont have an array, continue recursively
    return this.hasPathRecursive(v, pathElements.join('.'));
  }

  private applyFilterFn(
    obj: object | any[],
    path: string,
    {
      filterFn,
      value,
      negate,
    }: { filterFn: OperatorFn; value: ValueType; negate: boolean },
  ): boolean {
    // parse json operators "->" and "->>" to "."
    const pathElements = path.replace(/->>|->/g, '.').split('.');

    const v = get(obj, pathElements[0]);

    if (typeof v === 'undefined') {
      // if obj is an array, we should apply the filter to all elements of the array
      if (Array.isArray(obj)) {
        return obj.every((o) =>
          this.applyFilterFn(o, path, { filterFn, value, negate }),
        );
      }
      return false;
    }

    if (pathElements.length > 1) {
      // recursively resolve json path
      return this.applyFilterFn(
        v as Record<string, unknown>,
        pathElements.slice(1).join('.'),
        {
          filterFn,
          value,
          negate,
        },
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
      | { and: FilterDefinitions },
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
          def,
        )}. Operator ${operator} is not supported.`,
      );

    return (obj: object) =>
      this.applyFilterFn(obj, alias ?? path, { filterFn, value, negate });
  }
}
