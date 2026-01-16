import type { Transform, JSCodeshift, Collection } from 'jscodeshift';

/**
 * Migrates useDeleteManyMutation to useDeleteMutation.
 * The new useDeleteMutation accepts both single items and arrays,
 * so no additional options are needed.
 *
 * Before:
 *   useDeleteManyMutation({ query: client.from('x'), primaryKeys: ['id'], ... })
 *
 * After:
 *   useDeleteMutation({ query: client.from('x'), primaryKeys: ['id'], ... })
 *
 * Also updates imports.
 */
const transform: Transform = (file, api) => {
  const j: JSCodeshift = api.jscodeshift;
  const root: Collection = j(file.source);

  let hasChanges = false;

  // Update imports: useDeleteManyMutation -> useDeleteMutation
  root
    .find(j.ImportDeclaration)
    .filter((path) => {
      const source = path.node.source.value;
      return (
        typeof source === 'string' &&
        (source.includes('@supabase-cache-helpers/postgrest-react-query') ||
          source.includes('@supabase-cache-helpers/postgrest-swr'))
      );
    })
    .forEach((path) => {
      const specifiers = path.node.specifiers;
      if (!specifiers) return;

      let hasDeleteMany = false;
      let hasDeleteSingle = false;

      // Check what's imported
      specifiers.forEach((spec) => {
        if (
          spec.type === 'ImportSpecifier' &&
          spec.imported.type === 'Identifier'
        ) {
          if (spec.imported.name === 'useDeleteManyMutation') {
            hasDeleteMany = true;
          }
          if (spec.imported.name === 'useDeleteMutation') {
            hasDeleteSingle = true;
          }
        }
      });

      if (hasDeleteMany) {
        // Remove useDeleteManyMutation from imports
        const newSpecifiers = specifiers.filter((spec) => {
          if (
            spec.type === 'ImportSpecifier' &&
            spec.imported.type === 'Identifier'
          ) {
            return spec.imported.name !== 'useDeleteManyMutation';
          }
          return true;
        });

        // Add useDeleteMutation if not already imported
        if (!hasDeleteSingle) {
          newSpecifiers.push(
            j.importSpecifier(j.identifier('useDeleteMutation')),
          );
        }

        path.node.specifiers = newSpecifiers;
        hasChanges = true;
      }
    });

  // Transform useDeleteManyMutation calls to useDeleteMutation
  root
    .find(j.CallExpression, {
      callee: { name: 'useDeleteManyMutation' },
    })
    .forEach((path) => {
      // Rename the function
      if (path.node.callee.type === 'Identifier') {
        path.node.callee.name = 'useDeleteMutation';
      }
      hasChanges = true;
    });

  return hasChanges ? root.toSource() : null;
};

export default transform;
