import type { Transform, JSCodeshift, Collection } from 'jscodeshift';

/**
 * Transforms subscription hooks from positional arguments to object options pattern.
 *
 * Before:
 *   useSubscription(client, 'channel', { event: '*', schema: 'public', table: 't' }, ['id'], { callback: fn })
 *
 * After:
 *   useSubscription({ client, channel: 'channel', event: '*', schema: 'public', table: 't', primaryKeys: ['id'], callback: fn })
 */
const transform: Transform = (file, api) => {
  const j: JSCodeshift = api.jscodeshift;
  const root: Collection = j(file.source);

  let hasChanges = false;

  // Transform useSubscription
  root
    .find(j.CallExpression, {
      callee: { name: 'useSubscription' },
    })
    .forEach((path) => {
      const args = path.node.arguments;

      // Skip if already transformed (single object argument with 'client' property)
      if (args.length === 1 && args[0].type === 'ObjectExpression') {
        const obj = args[0];
        if (
          obj.properties.some(
            (p) =>
              p.type === 'ObjectProperty' &&
              p.key.type === 'Identifier' &&
              p.key.name === 'client',
          )
        ) {
          return;
        }
      }

      // Need at least client, channel, filter, and primaryKeys
      if (args.length < 4) return;

      const clientArg = args[0];
      const channelArg = args[1];
      const filterArg = args[2];
      const primaryKeysArg = args[3];
      const configArg = args.length > 4 ? args[4] : null;

      // Build the new object properties
      const properties: any[] = [
        j.objectProperty(j.identifier('client'), clientArg as any),
        j.objectProperty(j.identifier('channel'), channelArg as any),
      ];

      // Flatten the filter object properties
      if (filterArg.type === 'ObjectExpression') {
        filterArg.properties.forEach((prop) => {
          if (prop.type === 'ObjectProperty') {
            properties.push(prop);
          } else if (prop.type === 'SpreadElement') {
            properties.push(prop);
          }
        });
      } else {
        // If filter is a variable, spread it
        properties.push(j.spreadElement(filterArg as any));
      }

      properties.push(
        j.objectProperty(j.identifier('primaryKeys'), primaryKeysArg as any),
      );

      // Spread the config if it exists
      if (configArg) {
        if (configArg.type === 'ObjectExpression') {
          properties.push(...configArg.properties);
        } else {
          properties.push(j.spreadElement(configArg as any));
        }
      }

      // Replace with single object argument
      path.node.arguments = [j.objectExpression(properties)];
      hasChanges = true;
    });

  // Transform useSubscriptionQuery
  root
    .find(j.CallExpression, {
      callee: { name: 'useSubscriptionQuery' },
    })
    .forEach((path) => {
      const args = path.node.arguments;

      // Skip if already transformed
      if (args.length === 1 && args[0].type === 'ObjectExpression') {
        const obj = args[0];
        if (
          obj.properties.some(
            (p) =>
              p.type === 'ObjectProperty' &&
              p.key.type === 'Identifier' &&
              p.key.name === 'client',
          )
        ) {
          return;
        }
      }

      // Need at least client, channel, filter, and primaryKeys
      if (args.length < 4) return;

      const clientArg = args[0];
      const channelArg = args[1];
      const filterArg = args[2];
      const primaryKeysArg = args[3];
      const returningArg = args.length > 4 ? args[4] : null;
      const configArg = args.length > 5 ? args[5] : null;

      // Build the new object properties
      const properties: any[] = [
        j.objectProperty(j.identifier('client'), clientArg as any),
        j.objectProperty(j.identifier('channel'), channelArg as any),
      ];

      // Flatten the filter object properties
      if (filterArg.type === 'ObjectExpression') {
        filterArg.properties.forEach((prop) => {
          if (prop.type === 'ObjectProperty') {
            properties.push(prop);
          } else if (prop.type === 'SpreadElement') {
            properties.push(prop);
          }
        });
      } else {
        properties.push(j.spreadElement(filterArg as any));
      }

      properties.push(
        j.objectProperty(j.identifier('primaryKeys'), primaryKeysArg as any),
      );

      // Add returning if present
      if (returningArg) {
        properties.push(
          j.objectProperty(j.identifier('returning'), returningArg as any),
        );
      }

      // Spread the config if it exists
      if (configArg) {
        if (configArg.type === 'ObjectExpression') {
          properties.push(...configArg.properties);
        } else {
          properties.push(j.spreadElement(configArg as any));
        }
      }

      // Replace with single object argument
      path.node.arguments = [j.objectExpression(properties)];
      hasChanges = true;
    });

  return hasChanges ? root.toSource() : null;
};

export default transform;
