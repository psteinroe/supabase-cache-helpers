import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { buildMutationFetcherResponse } from '../../src/fetch/build-mutation-fetcher-response';
import { buildNormalizedQuery } from '../../src/fetch/build-normalized-query';
import { PostgrestParser } from '../../src/postgrest-parser';

const c = createClient('https://localhost', 'any');

describe('buildMutationFetcherResponse', () => {
  it('should work with json columns', () => {
    const q = c
      .from('campaign')
      .select('jsoncol,jsonarraycol,jsonarrayobjcol')
      .eq('id', 'some-id');

    const query = buildNormalizedQuery({
      query: 'jsoncol,jsonarraycol,jsonarrayobjcol',
      queriesForTable: () => [new PostgrestParser(q)],
    });

    expect(query).toBeTruthy();

    expect(
      buildMutationFetcherResponse(
        {
          id: 'some-id',
          jsoncol: {
            test: '123',
          },
          jsonarraycol: ['123'],
          jsonarrayobjcol: [{ some: 'value' }, { some: 'other' }],
        },
        {
          groupedUserQueryPaths: query!.groupedUserQueryPaths,
          groupedPaths: query!.groupedPaths,
        },
      ),
    ).toEqual({
      normalizedData: {
        id: 'some-id',
        'jsoncol.test': '123',
        'jsonarraycol.0': '123',
        'jsonarrayobjcol.0.some': 'value',
        'jsonarrayobjcol.1.some': 'other',
      },
      userQueryData: {
        jsoncol: {
          test: '123',
        },
        jsonarraycol: ['123'],
        jsonarrayobjcol: [{ some: 'value' }, { some: 'other' }],
      },
    });
  });

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
          id: 'some-id',
          d_0_employee: {
            display_name: 'one',
          },
          d_1_employee: {
            display_name: 'two',
          },
        },
        {
          groupedUserQueryPaths: query!.groupedUserQueryPaths,
          groupedPaths: query!.groupedPaths,
        },
      ),
    ).toEqual({
      normalizedData: {
        id: 'some-id',
        'employee!created_by_employee_id.display_name': 'one',
        'employee!updated_by_employee_id.display_name': 'two',
      },
      userQueryData: undefined,
    });
  });

  it('should include wildcard from user query only', () => {
    const q = c
      .from('contact')
      .select('some,value,ishouldbetheretoo,*,note_id(id,test,*)')
      .eq('test', 'value');

    const query = buildNormalizedQuery({
      query: '*',
      queriesForTable: () => [new PostgrestParser(q)],
    });

    expect(query).toBeTruthy();

    expect(
      buildMutationFetcherResponse(
        {
          some: '456',
          value: '789',
          ishouldbethere: '123',
          ishouldbetheretoo: { some: 'object' },
          ishouldbetheretootoo: ['one'],
          ishouldbetheretootootoo: [{ one: 'two' }],
          note_id: {
            id: 'id',
            test: '123',
            ishouldnotbethere: 'id',
          },
        },
        {
          groupedUserQueryPaths: query!.groupedUserQueryPaths,
          groupedPaths: query!.groupedPaths,
        },
      ),
    ).toEqual({
      normalizedData: {
        some: '456',
        value: '789',
        ishouldbethere: '123',
        'ishouldbetheretoo.some': 'object',
        'ishouldbetheretootoo.0': 'one',
        'ishouldbetheretootootoo.0.one': 'two',
        'note_id.id': 'id',
        'note_id.test': '123',
      },
      userQueryData: {
        some: '456',
        value: '789',
        ishouldbethere: '123',
        ishouldbetheretoo: { some: 'object' },
        ishouldbetheretootoo: ['one'],
        ishouldbetheretootootoo: [{ one: 'two' }],
      },
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
            relation_id: 'id',
            d_0_relation_id: {
              test: '345',
            },
          },
        },
        {
          groupedUserQueryPaths: query!.groupedUserQueryPaths,
          groupedPaths: query!.groupedPaths,
        },
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
          d_0_inbox_id: {
            id: '4b8221b0-f594-4924-ad94-ef5eee76aed4',
            name: 'Default Inbox',
          },
          is_spam: false,
          latest_message_attachment_count: 0,
          organisation_id: 'b18efb43-feef-4171-b7b9-26ee48a795e3',
          d_0_recipient_id: {
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
          groupedPaths: [
            {
              declaration: 'id',
              path: 'id',
            },
            {
              declaration: 'assignee_id',
              path: 'assignee_id',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  declaration: 'display_name',
                  path: 'display_name',
                },
              ],
            },
            {
              declaration: 'tag',
              path: 'tag',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  declaration: 'name',
                  path: 'name',
                },
                {
                  declaration: 'color',
                  path: 'color',
                },
              ],
            },
            {
              declaration: 'status',
              path: 'status',
            },
            {
              declaration: 'session_time',
              path: 'session_time',
            },
            {
              declaration: 'is_spam',
              path: 'is_spam',
            },
            {
              declaration: 'subject',
              path: 'subject',
            },
            {
              declaration: 'channel_type',
              path: 'channel_type',
            },
            {
              declaration: 'created_at',
              path: 'created_at',
            },
            {
              declaration: 'recipient_list',
              path: 'recipient_list',
            },
            {
              declaration: 'unread',
              path: 'unread',
            },
            {
              alias: 'd_0_recipient_id',
              declaration: 'd_0_recipient_id:recipient_id',
              path: 'recipient_id',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  declaration: 'contact_id',
                  path: 'contact_id',
                },
                {
                  declaration: 'full_name',
                  path: 'full_name',
                },
                {
                  declaration: 'handle',
                  path: 'handle',
                },
              ],
            },
            {
              declaration: 'channel_id',
              path: 'channel_id',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  declaration: 'active',
                  path: 'active',
                },
                {
                  declaration: 'name',
                  path: 'name',
                },
                {
                  declaration: 'provider_id',
                  path: 'provider_id',
                },
              ],
            },
            {
              alias: 'd_0_inbox_id',
              declaration: 'd_0_inbox_id:inbox_id',
              path: 'inbox_id',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  declaration: 'name',
                  path: 'name',
                },
              ],
            },
            {
              declaration: 'recipient_id',
              path: 'recipient_id',
            },
            {
              declaration: 'organisation_id',
              path: 'organisation_id',
            },
            {
              declaration: 'inbox_id',
              path: 'inbox_id',
            },
            {
              declaration: 'display_date',
              path: 'display_date',
            },
            {
              declaration: 'latest_message_attachment_count',
              path: 'latest_message_attachment_count',
            },
            {
              declaration: 'blurb',
              path: 'blurb',
            },
          ],
          groupedUserQueryPaths: [
            {
              declaration: 'id',
              path: 'id',
            },

            {
              alias: 'assignee',
              declaration: 'assignee:assignee_id',
              path: 'assignee_id',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  alias: 'test_name',
                  declaration: 'test_name:display_name',
                  path: 'display_name',
                },
              ],
            },

            {
              alias: 'tags',
              declaration: 'tags:tag',
              path: 'tag',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  alias: 'tag_name',
                  declaration: 'tag_name:name',
                  path: 'name',
                },
              ],
            },
            {
              alias: 'inbox',
              declaration: 'inbox_id:inbox',
              path: 'inbox_id',
              paths: [
                {
                  declaration: 'id',
                  path: 'id',
                },
                {
                  alias: 'inbox_name',
                  declaration: 'inbox_name:name',
                  path: 'name',
                },
              ],
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
