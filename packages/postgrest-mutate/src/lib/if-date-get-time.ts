export const ifDateGetTime = (v: unknown) =>
  v instanceof Date ? v.getTime() : v;
