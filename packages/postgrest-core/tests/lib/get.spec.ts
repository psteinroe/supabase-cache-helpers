import { describe, expect, it } from 'vitest';
import { get } from '../../src/lib/get';

describe('get', () => {
  it.each([
    [{ a: 1 }, 'a', undefined, 1], // simple case
    [{ a: 1 }, 'b', 2, 2], // default case
    [{ a: 1 }, '', undefined, undefined], // empty case
    [{ a: { b: 1 } }, 'a.b', undefined, 1], // dot syntax
    [{ a: { b: 1 } }, 'a,b', undefined, 1], // comma syntax
    [{ a: { b: 1 } }, 'a[b]', undefined, 1], // bracket syntax
    [{ a: { b: { c: { d: 1 } } } }, 'a.b,c.[d]', undefined, 1], // combination syntax
    [{ a: { b: 1 } }, 'a->b', undefined, 1], // json value syntax
    [{ a: { b: 1 } }, 'a->>b', undefined, '1'], // json string syntax
    [{ a: [1, 2] }, 'a->0', undefined, 1], // json array value syntax
    [{ a: [1, 2] }, 'a->>0', undefined, '1'], // json array string syntax
    [{ a: { b: { c: 1 } } }, 'a->b->c', undefined, 1], // nested json syntax
    [{ a: { b: { c: 1 } } }, 'a->b->>c', undefined, '1'],
    [{ a: { b: [1, 2] } }, 'a.b->0', undefined, 1],
    [{ a: { b: [1, 2] } }, 'a.b->>0', undefined, '1'],
    [{ a: { b: 1 } }, 'a->0', undefined, undefined], // not an array
    [{ a: [1, 2] }, 'a->2', undefined, undefined], // missing array value
  ])('get(%j, "%s", %s) should be %s', (obj, path, defaultValue, expected) => {
    expect(get(obj, path, defaultValue)).toEqual(expected);
  });
});
