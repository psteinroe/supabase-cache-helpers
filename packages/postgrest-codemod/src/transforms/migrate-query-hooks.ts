import type { Transform, JSCodeshift, Collection } from 'jscodeshift';

/**
 * Transforms query hooks from positional arguments to object options pattern.
 *
 * Before:
 *   useQuery(client.from('x').select('*'), { revalidateOnFocus: false })
 *
 * After:
 *   useQuery({ query: client.from('x').select('*'), revalidateOnFocus: false })
 */
const transform: Transform = (file, api) => {
  const j: JSCodeshift = api.jscodeshift;
  const root: Collection = j(file.source);

  const queryHooks = [
    'useQuery',
    'useOffsetInfiniteQuery',
    'useCursorInfiniteScrollQuery',
    'useOffsetInfiniteScrollQuery',
    'useInfiniteOffsetPaginationQuery',
  ];

  let hasChanges = false;

  queryHooks.forEach((hookName) => {
    root
      .find(j.CallExpression, {
        callee: { name: hookName },
      })
      .forEach((path) => {
        const args = path.node.arguments;

        // Skip if already transformed (single object argument with 'query' property)
        if (args.length === 1 && args[0].type === 'ObjectExpression') {
          const obj = args[0];
          if (
            obj.properties.some(
              (p) =>
                p.type === 'ObjectProperty' &&
                p.key.type === 'Identifier' &&
                p.key.name === 'query',
            )
          ) {
            return;
          }
        }

        // Need at least the query argument
        if (args.length === 0) return;

        const queryArg = args[0];
        const configArg = args.length > 1 ? args[1] : null;

        // Build the new object properties
        const properties: any[] = [
          j.objectProperty(j.identifier('query'), queryArg as any),
        ];

        // Spread the config if it exists
        if (configArg) {
          if (configArg.type === 'ObjectExpression') {
            // If config is an object literal, spread its properties
            properties.push(...configArg.properties);
          } else {
            // If config is a variable, use spread operator
            properties.push(j.spreadElement(configArg as any));
          }
        }

        // Replace with single object argument
        path.node.arguments = [j.objectExpression(properties)];
        hasChanges = true;
      });
  });

  return hasChanges ? root.toSource() : null;
};

export default transform;
