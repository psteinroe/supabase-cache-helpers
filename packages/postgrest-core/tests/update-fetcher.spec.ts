import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { Database } from './database.types';
import './utils';

import { PostgrestParser } from '../src';
import { buildUpdateFetcher } from '../src/update-fetcher';

const TEST_PREFIX = 'postgrest-fetcher-update-';

describe('update', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contact: Database['public']['Tables']['contact']['Row'] | null;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert({ username: `${testRunPrefix}-username-1` })
      .select('*,has_low_ticket_number')
      .throwOnError()
      .single();
    contact = data;
    expect(contact).toBeDefined();
  });

  it('should throw if input does not have a value for all primary keys', async () => {
    await expect(
      buildUpdateFetcher(client.from('contact'), ['id'], {
        queriesForTable: () => [],
      })({}),
    ).rejects.toThrowError('Missing value for primary key id');
  });

  it('should update entity by primary keys', async () => {
    const qb = client.from('contact');
    const updateSpy = vi.spyOn(qb, 'update');
    const username = `${testRunPrefix}-username-2`;
    const updatedContact = await buildUpdateFetcher(qb, ['id'], {
      stripPrimaryKeys: false,
      queriesForTable: () => [],
    })({
      id: contact?.id,
      username,
    });
    expect(updatedContact).toEqual({
      normalizedData: {
        id: expect.anything(),
        username,
      },
    });
    expect(updateSpy).toHaveBeenCalledWith(
      {
        id: expect.anything(),
        username,
      },
      expect.anything(),
    );
    const { data } = await client
      .from('contact')
      .select('*')
      .eq('id', contact?.id ?? '')
      .throwOnError()
      .maybeSingle();
    expect(data?.username).toEqual(`${testRunPrefix}-username-2`);
  });

  it('should update entity by primary keys excluding primary keys in payload', async () => {
    const qb = client.from('contact');
    const updateSpy = vi.spyOn(qb, 'update');
    const username = `${testRunPrefix}-username-2`;
    const updatedContact = await buildUpdateFetcher(qb, ['id'], {
      queriesForTable: () => [],
    })({
      id: contact?.id,
      username,
    });
    expect(updatedContact).toEqual({
      normalizedData: {
        id: expect.anything(),
        username,
      },
    });
    expect(updateSpy).toHaveBeenCalledWith({ username }, expect.anything());
    const { data } = await client
      .from('contact')
      .select('*')
      .eq('id', contact?.id ?? '')
      .throwOnError()
      .maybeSingle();
    expect(data?.username).toEqual(`${testRunPrefix}-username-2`);
  });

  it('should apply query if provided', async () => {
    const result = await buildUpdateFetcher(client.from('contact'), ['id'], {
      query: 'username',
      queriesForTable: () => [],
    })({
      id: contact?.id,
      username: `${testRunPrefix}-username-3`,
    });
    expect(result).toEqual({
      normalizedData: {
        username: `${testRunPrefix}-username-3`,
      },
      userQueryData: {
        username: `${testRunPrefix}-username-3`,
      },
    });
  });

  it('should use alias if there is one on the pks', async () => {
    const q = client
      .from('contact')
      .select('test:id,username')
      .eq('test', contact!.id);

    const updatedContact = await buildUpdateFetcher(
      client.from('contact'),
      ['id'],
      {
        queriesForTable: () => [new PostgrestParser(q)],
      },
    )({
      id: contact?.id,
      username: `${testRunPrefix}-username-4`,
    });
    expect(updatedContact).toEqual({
      normalizedData: {
        id: expect.anything(),
        username: `${testRunPrefix}-username-4`,
      },
    });
    const { data } = await client
      .from('contact')
      .select('*')
      .eq('id', contact?.id ?? '')
      .throwOnError()
      .maybeSingle();
    expect(data?.username).toEqual(`${testRunPrefix}-username-4`);
  });

  it('should not throw error when primary key value is false', async () => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      throwOnError: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };

    await expect(
      buildUpdateFetcher(qb as any, ['is_active'], {
        stripPrimaryKeys: false,
        queriesForTable: () => [],
      })({ is_active: false, username: 'testuser' }),
    ).resolves.not.toThrow();
    expect(qb.eq).toHaveBeenCalledWith('is_active', false);
  });

  it('should not throw error when primary key value is 0', async () => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      throwOnError: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };

    await expect(
      buildUpdateFetcher(qb as any, ['id'], {
        stripPrimaryKeys: false,
        queriesForTable: () => [],
      })({ id: 0, username: 'testuser' }),
    ).resolves.not.toThrow();
    expect(qb.eq).toHaveBeenCalledWith('id', 0);
  });
});
