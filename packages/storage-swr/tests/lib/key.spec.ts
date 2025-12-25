import { assertStorageKeyInput } from '../../src/lib';
import { describe, expect, it } from 'vitest';

describe('key', () => {
  describe('assertStorageKeyInput', () => {
    it('should throw for invalid key', () => {
      expect(() => assertStorageKeyInput('some unrelated key')).toThrow(
        'Invalid key',
      );
    });
  });
});
