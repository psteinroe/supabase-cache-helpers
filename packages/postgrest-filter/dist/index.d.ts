declare type FilterFn<Type> = (obj: Partial<Type>) => obj is Type;
declare type ValueType = number | string | boolean | null | Date | object;
declare type OperatorFn = (columnValue: any, filterValue: any) => boolean;
declare type FilterOperator = 'or' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'cs' | 'cd' | 'fts' | 'plfts';
declare type FilterDefinition = {
    path: string;
    operator: FilterOperator;
    negate: boolean;
    value: ValueType;
};
declare type FilterDefinitions = ({
    or: FilterDefinitions;
} | {
    and: FilterDefinitions;
} | FilterDefinition)[];

declare const OPERATOR_MAP: {
    [Key in FilterOperator]?: OperatorFn;
};
declare const SUPPORTED_OPERATORS: string[];

/**
 * Check if a value is a valid ISO DateTime string
 * @param v
 * @returns
 */
declare const isISODateString: (v: unknown) => boolean;
/**
 * Safely parse any value to a ValueType
 * @param v
 * @returns
 */
declare const parseValue: (v: any) => ValueType;
/**
 *
 * @param i Ahhh gotta love typescript
 * @returns
 */
declare const isNotNull: <I>(i: I | null) => i is I;

declare class PostgrestFilterFnBuilder<Type> {
    readonly query: {
        paths: string[];
        filters: FilterDefinitions;
    };
    private _fn;
    private _selectFn;
    private _filtersFn;
    constructor(query: {
        paths: string[];
        filters: FilterDefinitions;
    });
    get fn(): FilterFn<Type>;
    get filtersFn(): FilterFn<Type>;
    get selectFn(): FilterFn<Type>;
    private applyFilterFn;
    private buildFilterFn;
}

declare type PostgrestQueryParserOptions = {
    /**
     * If defined, will use only filters that apply to the given paths
     */
    exclusivePaths?: string[];
};
declare class PostgrestQueryParser {
    readonly params: URLSearchParams;
    readonly opts?: PostgrestQueryParserOptions | undefined;
    private _filters;
    private _paths;
    constructor(params: URLSearchParams, opts?: PostgrestQueryParserOptions | undefined);
    get builder(): PostgrestFilterFnBuilder<unknown>;
    get paths(): string[];
    get filters(): FilterDefinitions;
    private parseSelectParam;
    private parseFilterString;
}

export { FilterDefinition, FilterDefinitions, FilterFn, FilterOperator, OPERATOR_MAP, OperatorFn, PostgrestFilterFnBuilder, PostgrestQueryParser, PostgrestQueryParserOptions, SUPPORTED_OPERATORS, ValueType, isISODateString, isNotNull, parseValue };
