import { Path } from '../lib/query-types';

export const DEDUPE_ALIAS_PREFIX = 'd';

/**
 * add dedupe alias to path
 **/
export const buildDedupePath = (idx: number, p: Path) => {
  return {
    path: p.path,
    declaration: p.declaration
      .split('.')
      .map((el, i, a) => {
        const withoutAlias = el.split(':').pop() as string;
        if (i === a.length - 1) {
          return `${[DEDUPE_ALIAS_PREFIX, idx, withoutAlias].join(
            '_'
          )}:${withoutAlias}`;
        }
        return withoutAlias;
      })
      .join('.'),
    alias: p.path
      .split('.')
      .map((el, i, a) =>
        i === a.length - 1 ? [DEDUPE_ALIAS_PREFIX, idx, el].join('_') : el
      )
      .join('.'),
  };
};
