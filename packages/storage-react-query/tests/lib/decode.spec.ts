import { decode } from '../../src';
import { describe, expect, it } from 'vitest';

describe('decode', () => {
  it('should return null for invalid key', () => {
    expect(decode(['some', 'unrelated', 'key'])).toEqual(null);
  });
});
