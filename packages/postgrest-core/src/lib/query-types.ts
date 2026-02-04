/**
 * A function that validates whether the given input is an object of type Type
 * @returns true if obj is of type Type, false if not
 */
export type FilterFn<Type extends Record<string, unknown>> = (
  obj: unknown,
) => obj is Type;

/**
 * The supported value types
 */
export type ValueType = number | string | boolean | null | Date | object;

/**
 * A function implementing a FilterOperators
 * @param columnValue the value of the input object to test the filter against
 * @param filterValue the value of the filter, e.g. in .eq('colname', 'filterValue'), 'filterValue' would be the filterValue
 * @returns true if the filter applies, false if not
 */
export type OperatorFn = (columnValue: any, filterValue: any) => boolean;

/**
 * All supported operators of PostgREST
 */
export type FilterOperator =
  | 'or'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'cs'
  | 'cd'
  | 'ov'
  | 'fts'
  | 'plfts';

/**
 * An object describing a selected path of a query
 *
 */
export type Path = {
  /**
   * The aliased path if a column or relation name mapping is used within the path
   */
  alias?: string;
  /**
   * The "real" path of a column
   */
  path: string;
  /**
   * The full declaration of a column that includes alias, hints and inner joins
   */
  declaration: string;
  /**
   * The aggregate function applied to the path
   */
  aggregate?: string;
};

/**
 * A decomposed filter applied to a query
 */
export type FilterDefinition = {
  /**
   * The path to which the filter is applied
   */
  path: string;
  /**
   * The aliased path if a column or relation name mapping is used
   */
  alias?: string;
  /**
   * The operator that is applied
   */
  operator: FilterOperator;
  /**
   * Whether or not to negate the results of the filter, e.g. when .not('name', 'eq', 'Paris') is applied
   */
  negate: boolean;
  /**
   * The value of the filter
   */
  value: ValueType;
};

/**
 * A json representation of PostgREST filters that are applied to a query
 */
export type FilterDefinitions = (
  | { or: FilterDefinitions }
  | { and: FilterDefinitions }
  | FilterDefinition
)[];

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export const isAndFilter = (
  f: ArrayElement<FilterDefinitions>,
): f is { and: FilterDefinitions } =>
  Array.isArray((f as { and: FilterDefinitions }).and);

export const isOrFilter = (
  f: ArrayElement<FilterDefinitions>,
): f is { or: FilterDefinitions } =>
  Array.isArray((f as { or: FilterDefinitions }).or);

export const isFilterDefinition = (
  f: ArrayElement<FilterDefinitions>,
): f is FilterDefinition => !isAndFilter(f) && !isOrFilter(f);

export type OrderDefinition = {
  column: string;
  ascending: boolean;
  nullsFirst: boolean;
  foreignTable?: string;
};
