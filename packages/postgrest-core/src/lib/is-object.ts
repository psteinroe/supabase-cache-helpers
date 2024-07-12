export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && !Array.isArray(v) && v !== null;
