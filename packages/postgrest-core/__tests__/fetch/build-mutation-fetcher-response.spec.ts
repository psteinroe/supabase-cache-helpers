import { createClient } from '@supabase/supabase-js';

import { buildMutationFetcherResponse } from '../../src/fetch/build-mutation-fetcher-response';
import { buildNormalizedQuery } from '../../src/fetch/build-normalized-query';
import { PostgrestParser } from '../../src/postgrest-parser';

const c = createClient('https://localhost', 'any');

describe('buildMutationFetcherResponse', () => {
  it('should work with dedupe alias on the same relation', () => {
    const q = c
      .from('campaign')
      .select(
        'created_by:employee!created_by_employee_id(display_name),updated_by:employee!updated_by_employee_id(display_name)',
      )
      .eq('id', 'some-id');

    const query = buildNormalizedQuery({
      queriesForTable: () => [new PostgrestParser(q)],
    });

    expect(query).toBeTruthy();

    expect(
      buildMutationFetcherResponse(
        {
          d_0_employee: {
            display_name: 'one',
          },
          d_1_employee: {
            display_name: 'two',
          },
        },
        { userQueryPaths: query!.userQueryPaths, paths: query!.paths },
      ),
    ).toEqual({
      normalizedData: {
        'employee!created_by_employee_id.display_name': 'one',
        'employee!updated_by_employee_id.display_name': 'two',
      },
      userQueryData: undefined,
    });
  });

  it('should work with dedupe alias and user-defined alias', () => {
    const q = c.from('contact').select('some,value').eq('test', 'value');

    const query = buildNormalizedQuery({
      query: 'note_id(test,relation_id,rel:relation_id(test))',
      queriesForTable: () => [new PostgrestParser(q)],
    });

    expect(query).toBeTruthy();

    expect(
      buildMutationFetcherResponse(
        {
          test: '123',
          some: '456',
          value: '789',
          note_id: {
            test: '123',
            d_0_relation_id: 'id',
            relation_id: {
              test: '345',
            },
          },
        },
        { userQueryPaths: query!.userQueryPaths, paths: query!.paths },
      ),
    ).toEqual({
      normalizedData: {
        test: '123',
        some: '456',
        value: '789',
        'note_id.test': '123',
        'note_id.relation_id': 'id',
        'note_id.relation_id.test': '345',
      },
      userQueryData: {
        note_id: {
          test: '123',
          relation_id: 'id',
          rel: {
            test: '345',
          },
        },
      },
    });
  });

  it('should build nested paths correctly', () => {
    expect(
      buildMutationFetcherResponse(
        {
          assignee_id: null,
          blurb: 'Second Content',
          channel_id: {
            id: '554870cc-b918-44b5-ad64-9574fda8fe1d',
            active: true,
            name: 'Email Channel',
            provider_id: null,
          },
          channel_type: 'email',
          created_at: '2023-04-14T07:19:54.763336+00:00',
          display_date: '09:19',
          id: 'e9394bba-6657-44a7-bc8c-9dbcc4851176',
          inbox_id: {
            id: '4b8221b0-f594-4924-ad94-ef5eee76aed4',
            name: 'Default Inbox',
          },
          is_spam: false,
          latest_message_attachment_count: 0,
          organisation_id: 'b18efb43-feef-4171-b7b9-26ee48a795e3',
          recipient_id: {
            id: 'cfae4bd9-acd7-48bc-84f1-f857c91b0294',
            contact_id: '7a53de3e-73c9-4cc9-b8f1-5b9927e531ad',
            full_name: 'Recipient Two',
            handle: 'two@recipient.com',
          },
          recipient_list: 'Recipient One, Recipient Two',
          session_time: null,
          status: 'closed',
          subject: 'Email Conversation Subject',
          tag: [
            {
              id: '0fae4bd9-acd7-48bc-84f1-f857c91b0294',
              name: 'Test',
              color: 'blue',
            },
            {
              id: '1fae4bd9-acd7-48bc-84f1-f857c91b0294',
              name: 'Test 2',
              color: 'red',
            },
          ],
          unread: false,
        },
        {
          paths: [
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
              alias: 'd_0_recipient_id',
              declaration: 'd_0_recipient_id:recipient_id',
              path: 'recipient_id',
            },
            {
              alias: undefined,
              declaration: 'organisation_id',
              path: 'organisation_id',
            },
            {
              alias: 'd_1_inbox_id',
              declaration: 'd_1_inbox_id:inbox_id',
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
          ],
          userQueryPaths: [
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
            {
              alias: 'inbox.id',
              declaration: 'inbox_id:inbox.id',
              path: 'inbox_id.id',
            },
            {
              alias: 'inbox.inbox_name',
              declaration: 'inbox_id:inbox.inbox_name:id',
              path: 'inbox_id.name',
            },
          ],
        },
      ),
    ).toEqual({
      normalizedData: {
        assignee_id: null,
        blurb: 'Second Content',
        'channel_id.active': true,
        'channel_id.id': '554870cc-b918-44b5-ad64-9574fda8fe1d',
        'channel_id.name': 'Email Channel',
        'channel_id.provider_id': null,
        channel_type: 'email',
        created_at: '2023-04-14T07:19:54.763336+00:00',
        display_date: '09:19',
        id: 'e9394bba-6657-44a7-bc8c-9dbcc4851176',
        'inbox_id.id': '4b8221b0-f594-4924-ad94-ef5eee76aed4',
        'inbox_id.name': 'Default Inbox',
        is_spam: false,
        latest_message_attachment_count: 0,
        organisation_id: 'b18efb43-feef-4171-b7b9-26ee48a795e3',
        'recipient_id.contact_id': '7a53de3e-73c9-4cc9-b8f1-5b9927e531ad',
        'recipient_id.full_name': 'Recipient Two',
        'recipient_id.handle': 'two@recipient.com',
        'recipient_id.id': 'cfae4bd9-acd7-48bc-84f1-f857c91b0294',
        recipient_list: 'Recipient One, Recipient Two',
        session_time: null,
        status: 'closed',
        subject: 'Email Conversation Subject',
        'tag.0.color': 'blue',
        'tag.0.id': '0fae4bd9-acd7-48bc-84f1-f857c91b0294',
        'tag.0.name': 'Test',
        'tag.1.color': 'red',
        'tag.1.id': '1fae4bd9-acd7-48bc-84f1-f857c91b0294',
        'tag.1.name': 'Test 2',
        unread: false,
      },
      userQueryData: {
        id: 'e9394bba-6657-44a7-bc8c-9dbcc4851176',
        assignee: null,
        inbox: {
          id: '4b8221b0-f594-4924-ad94-ef5eee76aed4',
          inbox_name: 'Default Inbox',
        },
        tags: [
          {
            id: '0fae4bd9-acd7-48bc-84f1-f857c91b0294',
            tag_name: 'Test',
          },
          {
            id: '1fae4bd9-acd7-48bc-84f1-f857c91b0294',
            tag_name: 'Test 2',
          },
        ],
      },
    });
  });
});
