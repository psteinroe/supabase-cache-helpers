import { isISODateString } from "./is-iso-date-string";
import type { ValueType } from "./query-types";

/**
 * Safely parse any value to a ValueType
 * @param v Any value
 * @returns a ValueType
 */
export const parseValue = (v: any): ValueType => {
  if (isISODateString(v)) return new Date(v);
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};
