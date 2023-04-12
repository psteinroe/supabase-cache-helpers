// removes alias from every level of declaration
export const removeAliasFromDeclaration = (d: string) =>
  d
    .split('.')
    .map((el) => el.split(':').pop() as string)
    .join('.');
