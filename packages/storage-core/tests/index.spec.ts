import * as Import from '../src';
import { describe, expect, it } from 'vitest';

describe('index exports', () => {
  it('should export', () => {
    expect(Object.keys(Import)).toHaveLength(7);
  });
});
