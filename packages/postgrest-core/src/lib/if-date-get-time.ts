export const ifDateGetTime = (v: unknown) => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'string') {
    const t = new Date(v).getTime();
    if (!isNaN(t)) return t;
  }
  return v;
};
