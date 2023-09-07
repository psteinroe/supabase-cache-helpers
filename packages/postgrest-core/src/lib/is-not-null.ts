/**
 *
 * @param i Ahhh gotta love typescript
 * @returns
 */
export const isNotNull = <I>(i: I | null): i is I => i !== null;
