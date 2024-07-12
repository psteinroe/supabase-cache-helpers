import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';

import { extractPathsFromFilters } from '../../src/lib/extract-paths-from-filter';
import { PostgrestParser } from '../../src/postgrest-parser';

describe('extractPathsFromFilters', () => {
  let c: SupabaseClient;

  beforeAll(() => {
    c = createClient('https://localhost', '1234');
  });

  it('should add declarations from path to matching filter path', () => {
    const parser = new PostgrestParser(
      c
        .from('conversation')
        .select('inbox:inbox_id!inner(id,name,emoji)')
        .eq('inbox_id.id', 'inbox-id'),
    );
    expect(extractPathsFromFilters(parser.filters, parser.paths)).toEqual([
      {
        alias: 'inbox.id',
        declaration: 'inbox:inbox_id!inner.id',
        path: 'inbox_id.id',
      },
    ]);
  });
});
