export const setFilterValue = (
  searchParams: URLSearchParams,
  path: string,
  op: string,
  value: string,
) => {
  const filters = searchParams.getAll(path);
  // delete all
  searchParams.delete(path);

  // re-create
  for (const f of filters) {
    if (f.startsWith(`${op}.`)) {
      continue;
    }
    searchParams.append(path, f);
  }

  searchParams.append(path, `${op}.${value}`);
};
