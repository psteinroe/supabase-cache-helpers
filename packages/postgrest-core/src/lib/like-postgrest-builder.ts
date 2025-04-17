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
  console.log('isLikePostgrestBuilder', obj);

  console.log(typeof obj['url'], typeof obj['method'], typeof obj['headers']);
  console.log(obj['schema'], obj['body']);

  return (
    typeof obj['url'] === 'object' &&
    typeof obj['method'] === 'string' &&
    typeof obj['headers'] === 'object' &&
    (obj['schema'] === undefined || typeof obj['schema'] === 'string') &&
    (obj['body'] === undefined || typeof obj['body'] === 'object')
  );
};
