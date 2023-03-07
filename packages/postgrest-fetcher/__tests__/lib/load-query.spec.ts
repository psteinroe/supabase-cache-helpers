import { PostgrestParser } from '@supabase-cache-helpers/postgrest-filter';
import { createClient } from '@supabase/supabase-js';

import { loadQuery } from '../../src/lib/load-query';

const c = createClient('https://localhost', 'any');

describe('loadQuery', () => {
  it('should work without user query', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    expect(
      loadQuery({
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual('test,some,value,another_test,other');
  });

  it('should work', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    expect(
      loadQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual('something,the,user,queries,test,some,value,another_test,other');
  });

  it('should not dedupe with hints', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value,alias:some_relation!inner(test)')
      .eq('another_test', 'value');

    expect(
      loadQuery({
        query: 'something,the,user,queries,alias:some_relation(test)',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual(
      'something,the,user,queries,alias:some_relation(test),test,some,value,another_test,other,some_relation!inner(test)'
    );
  });

  it('should repect alias from user query', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    expect(
      loadQuery({
        query: 'something,the,user,queries,alias:value',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual(
      'something,the,user,queries,alias:value,test,some,another_test,other'
    );
  });

  it('should respect hints and inner joinv+ps', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select(
        'some,other,alias:value,alias:relation!hint!inner(relation_value)'
      )
      .eq('another_test', 'value');

    expect(
      loadQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual(
      'something,the,user,queries,test,some,value,another_test,other,relation!hint!inner(relation_value)'
    );
  });

  it('should work with and or', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value')
      .or('some.eq.123,and(value.eq.342,other.gt.4)');

    expect(
      loadQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual('something,the,user,queries,test,some,value,another_test,other');
  });
});
