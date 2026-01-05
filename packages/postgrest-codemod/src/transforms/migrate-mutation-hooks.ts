import type { Transform, JSCodeshift, Collection } from 'jscodeshift';

/**
 * Transforms mutation hooks from positional arguments to object options pattern.
 *
 * Before:
 *   useInsertMutation(client.from('x'), ['id'], 'id,name', { onSuccess: fn })
 *
 * After:
 *   useInsertMutation({ query: client.from('x'), primaryKeys: ['id'], returning: 'id,name', onSuccess: fn })
 */
const transform: Transform = (file, api) => {
  const j: JSCodeshift = api.jscodeshift;
  const root: Collection = j(file.source);

  const mutationHooks = [
    'useInsertMutation',
    'useUpdateMutation',
    'useUpsertMutation',
    'useDeleteMutation',
    'useDeleteManyMutation',
  ];

  let hasChanges = false;

  mutationHooks.forEach((hookName) => {
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

        // Need at least query and primaryKeys arguments
        if (args.length < 2) return;

        const queryArg = args[0]; // qb -> query
        const primaryKeysArg = args[1]; // primaryKeys stays the same
        const returningArg = args.length > 2 ? args[2] : null; // query -> returning
        const configArg = args.length > 3 ? args[3] : null;

        // Build the new object properties
        const properties: any[] = [
          j.objectProperty(j.identifier('query'), queryArg as any),
          j.objectProperty(j.identifier('primaryKeys'), primaryKeysArg as any),
        ];

        // Add returning if present
        if (returningArg) {
          properties.push(
            j.objectProperty(j.identifier('returning'), returningArg as any),
          );
        }

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
