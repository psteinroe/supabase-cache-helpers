import XRegExp from 'xregexp';

import type { Path } from './query-types';

export const parseSelectParam = (s: string, currentPath?: Path): Path[] => {
  s = s.replace(/\s/g, '');

  let result;
  try {
    result = XRegExp.matchRecursive(`,${s}`, '([^,\\(]+)\\(', '\\)', 'g', {
      valueNames: {
        '0': null,
        '1': 'tableName',
        '2': 'selectedColumns',
        '3': null,
      },
    }).map(item => {
      if (item.name === 'tableName' && item.value && !item.value.startsWith(',')) {
        item.value = ',' + item.value;
      }
      return item;
    });
  } catch (e) {
    const path = currentPath?.path
      ? `${currentPath?.declaration} with alias ${currentPath?.alias} at path ${currentPath?.path}`
      : 'root';
    throw new Error(`Unable to parse ${s} at ${path}`, {
      cause: e,
    });
  }

  const foreignTables = result.reduce((prev, curr, idx, matches) => {
    if (curr.name === 'selectedColumns') {
      const name = matches[idx - 1].value.slice(1, -1);
      prev = { ...prev, [name]: curr.value };
    }
    return prev;
  }, {});

  const columns = s
    .replace(
      new RegExp(
        `${Object.entries(foreignTables)
          .map(([table, selectedColumns]) =>
            `${table}(${selectedColumns})`
              .replace(/\(/g, '\\(')
              .replace(/\)/g, '\\)'),
          )
          .join('|')}`,
        'g',
      ),
      '',
    )
    .replace(/(,)\1+/g, ',')
    .split(',')
    .filter((c) => c.length > 0)
    .map((c) => {
      const split = c.split(':');
      const hasAlias = split.length > 1;
      return {
        declaration: [currentPath?.declaration, c].filter(Boolean).join('.'),
        alias:
          hasAlias || currentPath?.alias
            ? [currentPath?.alias ?? currentPath?.path, split[0]]
                .filter(Boolean)
                .join('.')
            : undefined,
        path: [currentPath?.path, split[hasAlias ? 1 : 0]]
          .filter(Boolean)
          .join('.'),
      };
    });

  if (columns.find((c) => c.path.includes('*')))
    throw new Error('Wildcard selector is not supported');

  return [
    ...columns,
    ...Object.entries(foreignTables).flatMap(
      ([currentDeclaration, selectedColumns]) => {
        // example for declaration
        // alias:organisation!contact_organisation_id_fkey!inner
        const aliasSplit = currentDeclaration.split(':');

        const currentAliasElem =
          aliasSplit.length > 1 ? aliasSplit[0] : undefined;

        const currentPathDeclaration = aliasSplit[aliasSplit.length - 1];
        const currentPathElem = currentPathDeclaration.split('!')[0];

        const path = [currentPath?.path, currentPathElem]
          .filter(Boolean)
          .join('.');

        const alias = [
          currentPath?.alias ?? currentPath?.path,
          currentAliasElem ?? currentPathElem,
        ]
          .filter(Boolean)
          .join('.');

        const declaration = [currentPath?.declaration, currentDeclaration]
          .filter(Boolean)
          .join('.');

        return parseSelectParam(`${selectedColumns}`, {
          path,
          alias: currentPath?.alias || currentAliasElem ? alias : undefined,
          declaration,
        });
      },
    ),
  ];
};
