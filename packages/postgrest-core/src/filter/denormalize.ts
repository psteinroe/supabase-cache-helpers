import {
  groupPathsRecursive,
  isNestedPath,
} from '../lib/group-paths-recursive';
import { Path } from '../lib/query-types';

/**
 * Denormalize a normalized response object using the paths of the target query
 * **/
export const denormalize = <R extends Record<string, unknown>>(
  // the paths into which we need to transform
  paths: Path[],
  // the normalized response data
  obj: R
): R => {
  const groups = groupPathsRecursive(paths);

  return groups.reduce<R>((prev, curr) => {
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
        return prev;
      }
      return {
        ...prev,
        [curr.alias || curr.path]: value,
      };
    }

    let isArray = false;
    const flatNestedObjectOrArray = Object.entries(obj).reduce<
      Record<string, Record<string, unknown>> | Record<string, unknown>
    >((prev, [k, v]) => {
      const isNested = k.startsWith(`${curr.path}.`);
      if (!isNested) return prev;
      // either set to key, or to idx.key
      const flatKey = k.slice(curr.path.length + 1);
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
          (v) => denormalize(curr.paths, v)
        ),
      };
    }
    return {
      ...prev,
      [curr.alias || curr.path]: denormalize(
        curr.paths,
        flatNestedObjectOrArray
      ),
    };
  }, {} as R);
};

// just to make ts happy
const isFlatNestedArray = (
  obj: Record<string, Record<string, unknown>> | Record<string, unknown>
): obj is Record<string, Record<string, unknown>> => true;
