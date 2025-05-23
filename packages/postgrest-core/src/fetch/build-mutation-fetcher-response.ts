import { flatten } from 'flat';

import { get } from '../lib/get';
import { type NestedPath, isNestedPath } from '../lib/group-paths-recursive';
import { isPlainObject } from '../lib/is-plain-object';
import type { Path } from '../lib/query-types';
import type { BuildNormalizedQueryReturn } from './build-normalized-query';

/**
 * The parsed response of the mutation fetcher
 **/
export type MutationFetcherResponse<R> = {
  /**
   * Normalized response. A flat json object with a depth of 1, where the keys are the full json paths.
   **/
  normalizedData: R;
  /**
   * Result of the query passed by the user
   **/
  userQueryData?: R;
};

export const buildMutationFetcherResponse = <R>(
  /**
   * response of the select query built by `buildNormalizedQuery`. contains dedupe aliases.
   **/
  input: R,
  {
    groupedPaths,
    groupedUserQueryPaths,
  }: Pick<BuildNormalizedQueryReturn, 'groupedPaths' | 'groupedUserQueryPaths'>,
): MutationFetcherResponse<R> => {
  return {
    normalizedData: normalizeResponse<R>(groupedPaths, input),
    userQueryData: groupedUserQueryPaths
      ? buildUserQueryData<R>(groupedUserQueryPaths, groupedPaths, input)
      : undefined,
  };
};

/**
 * Normalize the response by removing the dedupe alias and flattening it
 **/
export const normalizeResponse = <R>(
  groups: (Path | NestedPath)[],
  obj: R,
): R => {
  if (groups.some((p) => p.path === '*')) {
    // if wildcard, add every non nested value
    // for every nested value, check if groups contains a nested path for it. if not, also add it.
    // reason is that the wildcard does not select relations

    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === 'object' || Array.isArray(v)) {
        if (!groups.some((g) => isNestedPath(g) && g.path === k)) {
          groups.push({
            path: k,
            declaration: k,
          });
        }
      } else if (!groups.some((g) => g.path === k)) {
        groups.push({
          path: k,
          declaration: k,
        });
      }
    });
  }

  return groups.reduce<R>((prev, curr) => {
    // prefer alias over path because of dedupe alias
    const value = get(obj, curr.alias || curr.path);

    if (typeof value === 'undefined') return prev;
    if (value === null) {
      return {
        ...prev,
        // add hint to path if it has dedupe alias
        // can happen if the same relation is queried multiple times via different fkeys
        [`${curr.path}${
          curr.alias?.startsWith('d_') && curr.declaration.split('!').length > 1
            ? `!${curr.declaration.split('!')[1]}`
            : ''
        }`]: value,
      };
    }
    if (!isNestedPath(curr)) {
      return {
        ...prev,
        ...flatten({
          [curr.path]:
            value !== null &&
            (isPlainObject(value) || (Array.isArray(value) && value.length > 0))
              ? flatten(value)
              : value,
        }),
      };
    }
    if (Array.isArray(value)) {
      return {
        ...prev,
        ...(flatten({
          [curr.path]: value.map((v) => normalizeResponse(curr.paths, v)),
        }) as R),
      };
    }
    return {
      ...prev,
      ...flatten({
        // add hint to path if it has dedupe alias
        // can happen if the same relation is queried multiple times via different fkeys
        [`${curr.path}${
          curr.alias?.startsWith('d_') && curr.declaration.split('!').length > 1
            ? `!${curr.declaration.split('!')[1]}`
            : ''
        }`]: normalizeResponse(curr.paths, value as Record<string, unknown>),
      }),
    };
  }, {} as R);
};

/**
 * Build userQueryData from response
 *
 * note that `paths` is reflecting `obj`, not `userQueryPaths`.
 * iterate over `userQueryPaths` and find the corresponding path in `paths`.
 * Then, get value using the found alias and path from `obj`.
 **/
const buildUserQueryData = <R>(
  userQueryGroups: (Path | NestedPath)[],
  pathGroups: (Path | NestedPath)[],
  obj: R,
): R => {
  if (pathGroups.some((p) => p.path === '*')) {
    // if wildcard, add every non nested value
    // for every nested value, check if pathGroups contains a nested path for it. if not, also add it.
    // reason is that the wildcard does not select relations

    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === 'object' || Array.isArray(v)) {
        if (!pathGroups.some((g) => isNestedPath(g) && g.path === k)) {
          pathGroups.push({
            path: k,
            declaration: k,
          });
        }
      } else if (!pathGroups.some((g) => g.path === k)) {
        pathGroups.push({
          path: k,
          declaration: k,
        });
      }
    });
  }

  if (userQueryGroups.some((p) => p.path === '*')) {
    // if wildcard, add every non nested value
    // for every nested value, check if pathGroups contains a nested path for it. if not, also add it.
    // reason is that the wildcard does not select relations

    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === 'object' || Array.isArray(v)) {
        if (!pathGroups.some((g) => isNestedPath(g) && g.path === k)) {
          userQueryGroups.push({
            path: k,
            declaration: k,
          });
        }
      } else if (!userQueryGroups.some((g) => g.path === k)) {
        userQueryGroups.push({
          path: k,
          declaration: k,
        });
      }
    });
  }

  return userQueryGroups.reduce<R>((prev, curr) => {
    if (curr.path === '*') return prev;
    // paths is reflecting the obj
    const inputPath = pathGroups.find(
      (p) => p.path === curr.path && isNestedPath(p) === isNestedPath(curr),
    );
    if (!inputPath) {
      // should never happen though since userQueryPaths is a subset of paths
      throw new Error(`Path ${curr.path} not found in response paths`);
    }
    const value = get(obj, inputPath.alias || inputPath.path);

    if (typeof value === 'undefined') return prev;
    if (value === null || !isNestedPath(curr) || !isNestedPath(inputPath)) {
      (prev as Record<string, unknown>)[curr.alias ? curr.alias : curr.path] =
        value;
    } else if (Array.isArray(value)) {
      (prev as Record<string, unknown>)[curr.alias ? curr.alias : curr.path] =
        value.map((v) => buildUserQueryData(curr.paths, inputPath.paths, v));
    } else {
      (prev as Record<string, unknown>)[curr.alias ? curr.alias : curr.path] =
        buildUserQueryData(
          curr.paths,
          inputPath.paths,
          value as Record<string, unknown>,
        );
    }
    return prev;
  }, {} as R);
};
