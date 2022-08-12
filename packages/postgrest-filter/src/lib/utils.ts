import { ValueType } from "./types";

/**
 * Check if a value is a valid ISO DateTime string
 * @param v
 * @returns
 */
export const isISODateString = (v: unknown): boolean =>
  typeof v === "string" &&
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/.test(
    v
  );

/**
 * Safely parse any value to a ValueType
 * @param v
 * @returns
 */
export const parseValue = (v: any): ValueType => {
  if (isISODateString(v)) return new Date(v);
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

/**
 *
 * @param i Ahhh gotta love typescript
 * @returns
 */
export const isNotNull = <I>(i: I | null): i is I => i !== null;

export const isURLSearchParams = (v: unknown): v is URLSearchParams =>
  Boolean((v as URLSearchParams).append);
