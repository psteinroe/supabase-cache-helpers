import { getTable } from '../../src/lib/get-table';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const c = createClient('http://localhost:3000', 'test');

describe('getTable', () => {
  it('should return table name', () => {
    expect(getTable(c.from('test').select('id').eq('id', 1))).toEqual('test');
  });

  it('should throw if not a query', () => {
    expect(() => getTable({})).toThrow();
  });
});
