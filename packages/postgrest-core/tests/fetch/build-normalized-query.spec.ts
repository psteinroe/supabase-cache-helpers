import { buildNormalizedQuery } from '../../src/fetch/build-normalized-query';
import { PostgrestParser } from '../../src/postgrest-parser';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const c = createClient('https://localhost', 'any');

describe('buildNormalizedQuery', () => {
  it('should work without user query', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    // Only filter paths are added, not select paths
    expect(
      buildNormalizedQuery({
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual('test,another_test');
  });

  it('should work', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    // User query + filter paths only
    expect(
      buildNormalizedQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual('something,the,user,queries,test,another_test');
  });

  it('should ignore count agg', () => {
    const q1 = c
      .from('contact')
      .select('some,value,relation(count)')
      .eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    expect(
      buildNormalizedQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual('something,the,user,queries,test,another_test');
  });

  it('should not dedupe with hints when no conflict', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value,some_relation!hint1(test)')
      .eq('another_test', 'value');

    // Since we only add filter paths now (not select paths from cached queries),
    // there's no conflict between user query's some_relation!hint2 and cached query's some_relation!hint1
    expect(
      buildNormalizedQuery({
        query: 'something,the,user,queries,alias:some_relation!hint2(test)',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual(
      'something,the,user,queries,some_relation!hint2(test),test,another_test',
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
      buildNormalizedQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual('something,the,user,queries,test,another_test,some,value,other');
  });

  it('should add deduplication alias', () => {
    const q = c.from('contact').select('some,value').eq('test', 'value');

    expect(
      buildNormalizedQuery({
        query: 'something,the,user,queries,note_id,note:note_id(test)',
        queriesForTable: () => [new PostgrestParser(q)],
      })?.selectQuery,
    ).toEqual(
      'something,the,user,queries,note_id,d_0_note_id:note_id(test),test',
    );
  });

  it('should work with wildcard', () => {
    const q = c.from('contact').select('some,value').eq('test', 'value');

    expect(
      buildNormalizedQuery({
        query: 'something,the,user,queries,*',
        queriesForTable: () => [new PostgrestParser(q)],
      })?.selectQuery,
    ).toEqual('something,the,user,queries,*,test');
  });

  it('should add deduplication alias to nested alias', () => {
    const q = c.from('contact').select('some,value').eq('test', 'value');

    expect(
      buildNormalizedQuery({
        query:
          'something,the,user,queries,note_id(test,relation_id,rel:relation_id(test))',
        queriesForTable: () => [new PostgrestParser(q)],
      })?.selectQuery,
    ).toEqual(
      'something,the,user,queries,note_id(test,relation_id,d_0_relation_id:relation_id(test)),test',
    );
  });

  it('should work with complex master detail example', () => {
    const q1 = c
      .from('conversation')
      .select(
        'id,status,session_time,is_spam,subject,channel_type,created_at,recipient_list,unread,recipient:recipient_id(id,contact_id,full_name,handle),tags:tag(id,name,color),channel:channel_id(id,active,name,provider_id),inbox:inbox_id(id,name),assignee:assignee_id(id,display_name)',
      )
      .eq('id', '3a991789-5117-452c-ac14-e5fc3a8bc467');
    const q2 = c
      .from('conversation')
      .select(
        'id,created_at,recipient_id,organisation_id,inbox_id,channel_type,display_date,recipient_list,unread,status,subject,latest_message_attachment_count,is_spam,inbox_id,session_time,blurb,assignee:assignee_id(id,display_name),tags:tag(id,name,color),inbox:inbox_id(id,name),channel:channel_id(provider_id,name,active,id)',
      )
      .eq('is_spam', false)
      .eq('organisation_id', 'f79fecf8-fde8-4cff-9b15-93d50e32577d')
      .eq('status', 'open')
      .neq('status', 'archived');

    // Only user query + filter paths (id, is_spam, organisation_id, status)
    expect(
      buildNormalizedQuery({
        query:
          'id,assignee:assignee_id(id,test_name:display_name),tags:tag(id,tag_name:name)',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual(
      'id,assignee_id(id,display_name),tag(id,name),is_spam,organisation_id,status',
    );
  });

  it('should work with multiple fkeys to the same table', () => {
    const q1 = c
      .from('campaign')
      .select(
        'created_by:employee!created_by_employee_id(display_name),updated_by:employee!updated_by_employee_id(display_name)',
      )
      .eq('id', 'some-id');

    // Only the filter path (id) is added
    expect(
      buildNormalizedQuery({
        queriesForTable: () => [new PostgrestParser(q1)],
      })?.selectQuery,
    ).toEqual('id');
  });

  it('should dedupe with hints and alias and filter', () => {
    const q1 = c
      .from('contact')
      .select(
        'recipients:recipient!recipient_conversation_id_fkey!inner(contact_id)',
      )
      .eq('recipients.contact_id', 'some-contact-id');

    expect(
      buildNormalizedQuery({
        queriesForTable: () => [new PostgrestParser(q1)],
      })?.selectQuery,
    ).toEqual('recipient!recipient_conversation_id_fkey!inner(contact_id)');
  });

  it('should dedupe nested path when there is a non-nested path', () => {
    const q1 = c
      .from('contact')
      .select('conversation_id,tag_id,tag:tag_id(name)')
      .eq('conversation_id', 'some-conversation-id');

    // Only filter path (conversation_id) is added
    expect(
      buildNormalizedQuery({
        queriesForTable: () => [new PostgrestParser(q1)],
      })?.selectQuery,
    ).toEqual('conversation_id');
  });

  it('should respect hints and inner joins', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select(
        'some,other,alias:value,alias:relation!hint!inner(relation_value)',
      )
      .eq('another_test', 'value');

    expect(
      buildNormalizedQuery({
        query: 'something,the,user,queries',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery,
    ).toEqual('something,the,user,queries,test,another_test');
  });
});
