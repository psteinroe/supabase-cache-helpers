import { describe, expect, it } from 'vitest';
import { decode } from '../../src';

describe('decode', () => {
  it('should return null for invalid key', () => {
    expect(decode('some unrelated key')).toEqual(null);
  });
});
