export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}
