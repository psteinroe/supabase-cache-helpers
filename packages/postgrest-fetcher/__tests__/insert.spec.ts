import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { buildInsertFetcher } from '../src';
import { Database } from './database.types';
import './utils';

const TEST_PREFIX = 'postgrest-fetcher-insert';
describe('insert', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  it('should support insert many', async () => {
    await expect(
      buildInsertFetcher(client.from('contact'), {
        queriesForTable: () => [
          {
            paths: [
              { alias: undefined, path: 'username', declaration: 'prop1' },
            ],
            filters: [
              {
                or: [
                  {
                    path: 'username',
                    negate: false,
                    operator: 'eq',
                    value: 123,
                  },
                  {
                    path: 'ticket_number',
                    negate: false,
                    operator: 'gte',
                    value: 456,
                  },
                ],
              },
            ],
          },
        ],
      })([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ])
    ).resolves.toEqual([
      {
        normalizedData: {
          ticket_number: null,
          username: `${testRunPrefix}-username-1`,
        },
        userQueryData: undefined,
      },
      {
        normalizedData: {
          ticket_number: null,
          username: `${testRunPrefix}-username-2`,
        },
        userQueryData: undefined,
      },
    ]);
  });

  it('should support insert many without query', async () => {
    await expect(
      buildInsertFetcher(client.from('contact'), {
        queriesForTable: () => [],
      })([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
      ])
    ).resolves.toEqual(null);
  });

  it('should support passing a query', async () => {
    await expect(
      buildInsertFetcher(client.from('contact'), {
        query: 'alias:username',
        queriesForTable: () => [],
      })([{ username: `${testRunPrefix}-username-1` }])
    ).resolves.toEqual([
      {
        normalizedData: { username: `${testRunPrefix}-username-1` },
        userQueryData: { alias: `${testRunPrefix}-username-1` },
      },
    ]);
  });
});
