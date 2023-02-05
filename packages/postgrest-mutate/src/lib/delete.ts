export const deleteItem = <Type extends Record<string, unknown>>(
  input: Type,
  currentData: Type[],
  primaryKeys: (keyof Type)[]
) => {
  return currentData.filter((i) =>
    primaryKeys.some((pk) => i[pk] !== input[pk])
  );
};
