import { unflatten } from 'flat';

import {
  groupPathsRecursive,
  isNestedPath,
} from '../lib/group-paths-recursive';
import type { Path } from '../lib/query-types';

/**
 * Denormalize a normalized response object using the paths of the target query
 **/
export const denormalize = <R extends Record<string, unknown>>(
  // the paths into which we need to transform
  paths: Path[],
  // the normalized response data
  obj: R,
): R => {
  const groups = groupPathsRecursive(paths);

  if (groups.some((g) => g.path === '*')) {
    // if a wildcard path is present, we expand the groups with all values from the object that are not part of a nested path from `paths`.
    // This will include also unwanted values, e.g. from a join on another relation because its impossible for us to distinguish between json columns and joins.
    Object.keys(obj).forEach((k) => {
      const keyParts = k.split('.');
      if (
        keyParts.length > 1 &&
        groups.some((g) => isNestedPath(g) && g.path === keyParts[0])
      ) {
        // skip if key is actually part of a nested path from the groups
        return;
      }
      if (groups.some((g) => g.path === keyParts[0])) {
        // skip if key is already part of the groups
        return;
      }

      groups.push({
        declaration: keyParts[0],
        path: keyParts[0],
      });
    });
  }

  return groups.reduce<R>((prev, curr) => {
    // skip the wildcard since we already handled it above
    if (curr.path === '*') return prev;
    let value = obj[curr.path];

    if (!isNestedPath(curr)) {
      if (typeof value === 'undefined') {
        // if simple array, e.g. ['a', 'b', 'c'], unflatten
        const array = Object.entries(obj).reduce<any[]>((prev, [k, v]) => {
          // test if key is curr_path.0, curr_path.1 etc.
          if (new RegExp(`^${curr.path}.\\d+$`).test(k)) {
            prev.push(v);
          }
          return prev;
        }, []);
        if (array.length > 0) {
          value = array;
        }
      }
      if (typeof value === 'undefined') {
        // if json(b) column, unflatten
        let isArray = false;
        const jsonValue = Object.entries(obj).reduce<Record<string, unknown>>(
          (prev, [k, v]) => {
            if (k.startsWith(`${curr.path}.`)) {
              const key = k.slice(curr.path.length + 1);
              const maybeIdx = key.match(/^\b\d+\b/);
              if (maybeIdx && isFlatNestedArray(prev)) {
                isArray = true;
                prev = {
                  ...prev,
                  [maybeIdx[0]]: {
                    ...(prev[maybeIdx[0]] ? prev[maybeIdx[0]] : {}),
                    [key.slice(maybeIdx[0].length + 1)]: v,
                  },
                };
              } else {
                prev[maybeIdx ? maybeIdx[0] : key] = v;
              }
            }
            return prev;
          },
          {},
        );
        if (Object.keys(jsonValue).length > 0) {
          if (isArray) {
            value = Object.values(jsonValue).map((v) => unflatten(v));
          } else {
            value = unflatten(jsonValue);
          }
        }
      }
      if (typeof value === 'undefined') {
        return prev;
      }
      return {
        ...prev,
        [curr.alias || curr.path]: value,
      };
    }

    // if value is null or an empty array, the relation is not set and we can return the "empty" value
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      return {
        ...prev,
        [curr.alias || curr.path]: value,
      };
    }

    let isArray = false;
    const flatNestedObjectOrArray = Object.entries(obj).reduce<
      Record<string, Record<string, unknown>> | Record<string, unknown>
    >((prev, [k, v]) => {
      const isNested =
        k.startsWith(`${curr.path}.`) ||
        (k.includes('!') &&
          k.startsWith(`${removeFirstAlias(curr.declaration)}.`));

      if (!isNested) return prev;
      // either set to key, or to idx.key
      // is either path.key or path!hint.key
      const flatKey = k.slice(
        (k.includes('!') ? removeFirstAlias(curr.declaration) : curr.path)
          .length + 1,
      );
      const maybeIdx = flatKey.match(/^\b\d+\b/);
      if (maybeIdx && isFlatNestedArray(prev)) {
        isArray = true;
        const key = flatKey.slice(maybeIdx[0].length + 1);
        return {
          ...prev,
          [maybeIdx[0]]: {
            ...(prev[maybeIdx[0]] ? prev[maybeIdx[0]] : {}),
            [key]: v,
          },
        };
      }
      return {
        ...prev,
        [flatKey]: v,
      };
    }, {});

    if (Object.keys(flatNestedObjectOrArray).length === 0) return prev;
    if (isArray && isFlatNestedArray(flatNestedObjectOrArray)) {
      return {
        ...prev,
        [curr.alias || curr.path]: Object.values(flatNestedObjectOrArray).map(
          (v) => denormalize(curr.paths, v),
        ),
      };
    }
    return {
      ...prev,
      [curr.alias || curr.path]: denormalize(
        curr.paths,
        flatNestedObjectOrArray,
      ),
    };
  }, {} as R);
};

// just to make ts happy
const isFlatNestedArray = (
  obj: Record<string, Record<string, unknown>> | Record<string, unknown>,
): obj is Record<string, Record<string, unknown>> => true;

const removeFirstAlias = (key: string): string => {
  const split = key.split(':');
  if (split.length === 1) return key;
  split.shift();
  return split.join(':');
};
