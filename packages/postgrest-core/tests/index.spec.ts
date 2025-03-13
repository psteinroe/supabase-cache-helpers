import { describe, expect, it } from 'vitest';
import * as Import from '../src';

describe('index exports', () => {
  it('should export', () => {
    expect(Object.keys(Import)).toHaveLength(41);
  });
});
