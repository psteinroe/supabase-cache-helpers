export type FilterFn<Type extends object> = (obj: object) => obj is Type;

export type ValueType = number | string | boolean | null | Date | object;

export type OperatorFn = (columnValue: any, filterValue: any) => boolean;

export type FilterOperator =
  | "or"
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is"
  | "in"
  | "cs"
  | "cd"
  | "fts"
  | "plfts";

export type FilterDefinition = {
  path: string;
  operator: FilterOperator;
  negate: boolean;
  value: ValueType;
};

export type FilterDefinitions = (
  | { or: FilterDefinitions }
  | { and: FilterDefinitions }
  | FilterDefinition
)[];
