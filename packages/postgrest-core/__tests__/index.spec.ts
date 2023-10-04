import * as Import from '../src';

describe('index exports', () => {
  it('should export', () => {
    expect(Object.keys(Import)).toHaveLength(32);
  });
});
