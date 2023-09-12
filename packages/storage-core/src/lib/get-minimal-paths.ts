export const getMinimalPaths = (paths: string[]) =>
  paths.reduce<string[]>((paths, path) => {
    const matchingPaths = paths.filter((p) => p.startsWith(path));
    return [...paths.filter((p) => !matchingPaths.includes(p)), path];
  }, []);
