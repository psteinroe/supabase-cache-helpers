export const isMap = (v: unknown): v is Map<unknown, unknown> =>
  typeof (v as Map<unknown, unknown>).keys === "function";
