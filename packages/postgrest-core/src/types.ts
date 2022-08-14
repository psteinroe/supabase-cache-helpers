export type PostgrestQuery = {
  schema: string;
  table: string;
  query: string;
  count: null | string;
  isHead: boolean;
};

export type PostgrestKey = PostgrestQuery & {
  isInfinite: boolean;
};
