import { createClient } from '@supabase/supabase-js';

import { loadQuery } from '../../../src/fetch/lib/load-query';
import { PostgrestParser } from '../../../src/parse/postgrest-parser';

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

  it('should return user query if disabled', () => {
    const q1 = c.from('contact').select('some,value').eq('test', 'value');
    const q2 = c
      .from('contact')
      .select('some,other,value')
      .eq('another_test', 'value');

    expect(
      loadQuery({
        query: 'something,the,user,queries',
        disabled: true,
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toEqual({
      paths: [
        { alias: undefined, declaration: 'something', path: 'something' },
        { alias: undefined, declaration: 'the', path: 'the' },
        { alias: undefined, declaration: 'user', path: 'user' },
        { alias: undefined, declaration: 'queries', path: 'queries' },
      ],
      selectQuery: 'something,the,user,queries',
      userQueryPaths: [
        { alias: undefined, declaration: 'something', path: 'something' },
        { alias: undefined, declaration: 'the', path: 'the' },
        { alias: undefined, declaration: 'user', path: 'user' },
        { alias: undefined, declaration: 'queries', path: 'queries' },
      ],
    });
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
      .select('some,other,value,some_relation!hint1(test)')
      .eq('another_test', 'value');

    expect(
      loadQuery({
        query: 'something,the,user,queries,alias:some_relation!hint2(test)',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })?.selectQuery
    ).toEqual(
      'something,the,user,queries,some_relation!hint2(test),test,some,value,another_test,other,some_relation!hint1(test)'
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

  it('should work with complex master detail example', () => {
    const q1 = c
      .from('conversation')
      .select(
        'id,status,session_time,is_spam,subject,channel_type,created_at,recipient_list,unread,recipient:recipient_id(id,contact_id,full_name,handle),tags:tag(id,name,color),channel:channel_id(id,active,name,provider_id),inbox:inbox_id(id,name),assignee:assignee_id(id,display_name)'
      )
      .eq('id', '3a991789-5117-452c-ac14-e5fc3a8bc467');
    const q2 = c
      .from('conversation')
      .select(
        'id,created_at,recipient_id,organisation_id,inbox_id,channel_type,display_date,recipient_list,unread,status,subject,latest_message_attachment_count,is_spam,inbox_id,session_time,blurb,assignee:assignee_id(id,display_name),tags:tag(id,name,color),inbox:inbox_id(id,name),channel:channel_id(provider_id,name,active,id)'
      )
      .eq('is_spam', false)
      .eq('organisation_id', 'f79fecf8-fde8-4cff-9b15-93d50e32577d')
      .eq('status', 'open')
      .neq('status', 'archived');

    expect(
      loadQuery({
        query:
          'id,assignee:assignee_id(id,test_name:display_name),tags:tag(id,tag_name:name)',
        queriesForTable: () => [
          new PostgrestParser(q1),
          new PostgrestParser(q2),
        ],
      })
    ).toMatchObject({
      selectQuery:
        'id,assignee_id(id,display_name),tag(id,name,color),status,session_time,is_spam,subject,channel_type,created_at,recipient_list,unread,recipient_id(id,contact_id,full_name,handle),channel_id(id,active,name,provider_id),inbox_id(id,name),organisation_id,recipient_id,inbox_id,display_date,latest_message_attachment_count,blurb',
      paths: expect.arrayContaining([
        {
          alias: undefined,
          declaration: 'id',
          path: 'id',
        },
        {
          alias: undefined,
          declaration: 'assignee_id.id',
          path: 'assignee_id.id',
        },
        {
          alias: undefined,
          declaration: 'assignee_id.display_name',
          path: 'assignee_id.display_name',
        },
        {
          alias: undefined,
          declaration: 'tag.id',
          path: 'tag.id',
        },
        {
          alias: undefined,
          declaration: 'tag.name',
          path: 'tag.name',
        },
        {
          alias: undefined,
          declaration: 'tag.color',
          path: 'tag.color',
        },
        {
          alias: undefined,
          declaration: 'status',
          path: 'status',
        },
        {
          alias: undefined,
          declaration: 'session_time',
          path: 'session_time',
        },
        {
          alias: undefined,
          declaration: 'is_spam',
          path: 'is_spam',
        },
        {
          alias: undefined,
          declaration: 'subject',
          path: 'subject',
        },
        {
          alias: undefined,
          declaration: 'channel_type',
          path: 'channel_type',
        },
        {
          alias: undefined,
          declaration: 'created_at',
          path: 'created_at',
        },
        {
          alias: undefined,
          declaration: 'recipient_list',
          path: 'recipient_list',
        },
        {
          alias: undefined,
          declaration: 'unread',
          path: 'unread',
        },
        {
          alias: undefined,
          declaration: 'recipient_id.id',
          path: 'recipient_id.id',
        },
        {
          alias: undefined,
          declaration: 'recipient_id.contact_id',
          path: 'recipient_id.contact_id',
        },
        {
          alias: undefined,
          declaration: 'recipient_id.full_name',
          path: 'recipient_id.full_name',
        },
        {
          alias: undefined,
          declaration: 'recipient_id.handle',
          path: 'recipient_id.handle',
        },
        {
          alias: undefined,
          declaration: 'channel_id.id',
          path: 'channel_id.id',
        },
        {
          alias: undefined,
          declaration: 'channel_id.active',
          path: 'channel_id.active',
        },
        {
          alias: undefined,
          declaration: 'channel_id.name',
          path: 'channel_id.name',
        },
        {
          alias: undefined,
          declaration: 'channel_id.provider_id',
          path: 'channel_id.provider_id',
        },
        {
          alias: undefined,
          declaration: 'inbox_id.id',
          path: 'inbox_id.id',
        },
        {
          alias: undefined,
          declaration: 'inbox_id.name',
          path: 'inbox_id.name',
        },
        {
          alias: undefined,
          declaration: 'recipient_id',
          path: 'recipient_id',
        },
        {
          alias: undefined,
          declaration: 'organisation_id',
          path: 'organisation_id',
        },
        {
          alias: undefined,
          declaration: 'inbox_id',
          path: 'inbox_id',
        },
        {
          alias: undefined,
          declaration: 'display_date',
          path: 'display_date',
        },
        {
          alias: undefined,
          declaration: 'latest_message_attachment_count',
          path: 'latest_message_attachment_count',
        },
        {
          alias: undefined,
          declaration: 'blurb',
          path: 'blurb',
        },
      ]),
      userQueryPaths: expect.arrayContaining([
        {
          alias: undefined,
          declaration: 'id',
          path: 'id',
        },
        {
          alias: 'assignee.id',
          declaration: 'assignee:assignee_id.id',
          path: 'assignee_id.id',
        },
        {
          alias: 'assignee.test_name',
          declaration: 'assignee:assignee_id.test_name:display_name',
          path: 'assignee_id.display_name',
        },
        {
          alias: 'tags.id',
          declaration: 'tags:tag.id',
          path: 'tag.id',
        },
        {
          alias: 'tags.tag_name',
          declaration: 'tags:tag.tag_name:name',
          path: 'tag.name',
        },
      ]),
    });
  });

  it('should dedupe with hints and alias and filter', () => {
    const q1 = c
      .from('contact')
      .select(
        'recipients:recipient!recipient_conversation_id_fkey!inner(contact_id)'
      )
      .eq('recipients.contact_id', 'some-contact-id');

    expect(
      loadQuery({
        queriesForTable: () => [new PostgrestParser(q1)],
      })?.selectQuery
    ).toEqual('recipient!recipient_conversation_id_fkey!inner(contact_id)');
  });

  it('should respect hints and inner joins', () => {
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
});
