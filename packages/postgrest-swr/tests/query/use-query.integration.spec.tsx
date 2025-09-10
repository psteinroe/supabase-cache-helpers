import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { fetchQueryFallbackData, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-swr-query';

describe('useQuery', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 1000)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);

    const { data } = await client
      .from('contact')
      .insert([
        { username: `${testRunPrefix}-username-1` },
        { username: `${testRunPrefix}-username-2` },
        { username: `${testRunPrefix}-username-3` },
        { username: `${testRunPrefix}-username-4` },
      ])
      .select('*,has_low_ticket_number')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });
  beforeEach(() => {
    provider = new Map();
  });

  afterEach(cleanup);

  it('should work for single', async () => {
    function Page() {
      const { data } = useQuery(
        !contacts[0].username
          ? null
          : client
              .from('contact')
              .select('id,username')
              .eq('username', contacts[0].username)
              .single(),
        { revalidateOnFocus: false },
      );

      return <div>{data?.username}</div>;
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith('postgrest')),
    ).toBeDefined();
  });

  it('should work for maybeSingle', async () => {
    function Page() {
      const { data, isValidating } = useQuery(
        client
          .from('contact')
          .select('id,username')
          .eq('username', 'unknown')
          .maybeSingle(),
      );
      return (
        <div>{isValidating ? 'validating' : `username: ${data?.username}`}</div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('username: undefined', {}, { timeout: 10000 });
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith('postgrest')),
    ).toBeDefined();
  });

  it('should work with multiple', async () => {
    function Page() {
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .ilike('username', `${testRunPrefix}%`),
        { revalidateOnFocus: false },
      );
      return (
        <div>
          <div>
            {
              (data ?? []).find((d) => d.username === contacts[0].username)
                ?.username
            }
          </div>
          <div data-testid="count">{`count: ${count}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
    await screen.findByText(`count: 4`, {}, { timeout: 10000 });
    expect(
      Array.from(provider.keys()).find((k) => k.startsWith('postgrest')),
    ).toBeDefined();
  });

  it('should work for with conditional query', { timeout: 20000 }, async () => {
    function Page() {
      const [condition, setCondition] = useState(false);
      const { data, isLoading } = useQuery(
        condition && contacts[0].username
          ? client
              .from('contact')
              .select('id,username')
              .eq('username', contacts[0].username)
              .maybeSingle()
          : null,
        { revalidateOnFocus: false },
      );

      return (
        <div>
          <div data-testid="setCondition" onClick={() => setCondition(true)} />
          <div data-testid="conditional">{`conditional: ${data?.username ?? 'undefined'}`}</div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    const screen = renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('isLoading: false', {}, { timeout: 5000 });
    await screen.findByText('conditional: undefined', {}, { timeout: 5000 });
    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      `conditional: ${contacts[0].username}`,
      {},
      { timeout: 10000 },
    );
  });

  it('mutate should work', async () => {
    function Page() {
      const { data, mutate, isLoading } = useQuery(
        !contacts[0].username
          ? null
          : client
              .from('contact')
              .select('id,username')
              .eq('username', contacts[0].username)
              .single(),
        { revalidateOnFocus: false },
      );
      const [mutated, setMutated] = useState<typeof data | null>(null);

      return (
        <div>
          <div
            data-testid="mutate"
            onClick={async () => {
              setMutated((await mutate())?.data);
            }}
          />
          <div>{data?.username ?? 'undefined'}</div>
          <div>{`mutated: ${!!mutated}`}</div>
          <div>{`isLoading: ${isLoading}`}</div>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('isLoading: false', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('mutate'));
    await screen.findByText('mutated: true', {}, { timeout: 10000 });
  });

  it('should work with fallbackData', async () => {
    const q = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username!)
      .single();
    const [_, fallbackData] = await fetchQueryFallbackData(q);
    function Page() {
      const { data } = useQuery(null, {
        revalidateOnFocus: false,
        fallbackData,
      });

      return <div>{`fallbackData: ${data?.username}`}</div>;
    }

    const screen = renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      `fallbackData: ${contacts[0].username!}`,
      {},
      { timeout: 10000 },
    );
  });

  it('should work with global fallbackData', async () => {
    const q = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username!)
      .single();
    const [key, fallbackData] = await fetchQueryFallbackData(q);
    function Page() {
      const { data } = useQuery(q, {
        revalidateOnFocus: true,
      });

      return <div>{data?.username}</div>;
    }

    renderWithConfig(<Page />, {
      provider: () => provider,
      fallback: {
        [key]: {
          ...fallbackData,
          data: { ...fallbackData.data, username: 'fallback' },
        },
      },
    });
    await screen.findByText('fallback', {}, { timeout: 10000 });
  });
});
