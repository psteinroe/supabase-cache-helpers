export type MaybeLikePostgrestBuilder<Result> = unknown;

export type LikePostgrestBuilder<Result> = {
  url: URL;
  method: 'GET' | 'HEAD' | 'POST' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  schema?: string;
  body?: unknown;
};

export const isLikePostgrestBuilder = <Result>(
  v: MaybeLikePostgrestBuilder<Result>,
): v is LikePostgrestBuilder<Result> => {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as LikePostgrestBuilder<Result>;
  
  return (
    typeof obj['url'] === 'object' &&
    typeof obj['method'] === 'string' &&
    typeof obj['headers'] === 'object'
  );
};
