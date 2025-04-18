export type MaybeLikeQueryBuilder<Result> = unknown;

export type LikeQueryBuilder<Result> = {
  url: URL;
};

export const isLikeQueryBuilder = <Result>(
  v: MaybeLikeQueryBuilder<Result>,
): v is LikeQueryBuilder<Result> => {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as LikeQueryBuilder<Result>;

  return typeof obj['url'] === 'object';
};
