export const get = (obj: any, path: string, defaultValue: any = undefined) => {
  const split = String.prototype.split.call(path, /((?:\.|,|\[|\]|->>|->)+)/g);
  let result: any = undefined;
  for (let i = -1; i < split.length; i += 2) {
    const separator = split[i];
    let key: string | number = split[i + 1];
    if (!key) {
      continue;
    }
    if (separator?.endsWith('->') || separator?.endsWith('->>')) {
      if (/^\d+$/.test(key)) {
        key = parseInt(key, 10);
      }
    }
    if (separator?.endsWith('->>')) {
      result = `${result ? result[key] : obj[key]}`;
    } else {
      result = result ? result[key] : obj[key];
    }
  }
  return result === undefined || result === obj ? defaultValue : result;
};
