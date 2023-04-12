import { decode } from './decode';

export const getMutableKeys = (keys: string[]) => {
  return keys.filter((k) => {
    const decoded = decode(k);
    return decoded && (decoded.isInfinite || !decoded.isInfiniteKey);
  });
};
