import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/vue-query';
import { fireEvent, screen } from '@testing-library/vue';

import { fetchQueryInitialData, prefetchQuery } from '../../src';
import { encode } from '../../src/lib/key';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';
import QueryPage1 from '../components/QueryPage-1.vue';
import QueryPage2 from '../components/QueryPage-2.vue';
import QueryPage3 from '../components/QueryPage-3.vue';
import QueryPage4 from '../components/QueryPage-4.vue';
import QueryPage5 from '../components/QueryPage-5.vue';
import QueryPage6 from '../components/QueryPage-6.vue';
import QueryPage7 from '../components/QueryPage-7.vue';

const TEST_PREFIX = 'postgrest-vue-query-query';

describe('useQuery', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database['public']['Tables']['contact']['Row'][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
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
      .select('*')
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(4);
  });

  it('should work for single', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username ?? '')
      .single();

    renderWithConfig(QueryPage1, { client, query }, queryClient);
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
    expect(queryClient.getQueryData(encode(query, false))).toBeDefined();
  });

  it('should work for maybeSingle', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', 'unknown')
      .maybeSingle();

    renderWithConfig(QueryPage2, { client, query }, queryClient);
    await screen.findByText('username: undefined', {}, { timeout: 10000 });
    expect(queryClient.getQueryData(encode(query, false))).toBeDefined();
  });

  it('should work with multiple', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username', { count: 'exact' })
      .ilike('username', `${testRunPrefix}%`);

    renderWithConfig(QueryPage3, { client, query, contacts }, queryClient);
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('4');
    expect(queryClient.getQueryData(encode(query, false))).toBeDefined();
  });

  it('should work for with conditional query', async () => {
    const queryClient = new QueryClient();

    renderWithConfig(QueryPage4, { client, contacts }, queryClient);
    await screen.findByText('undefined', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('setCondition'));
    await screen.findByText(
      contacts[0].username as string,
      {},
      { timeout: 10000 },
    );
  });

  it('refetch should work', async () => {
    const queryClient = new QueryClient();

    renderWithConfig(QueryPage5, { client, contacts }, queryClient);
    await screen.findByText('isLoading: false', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('mutate'));
    await screen.findByText('refetched: true', {}, { timeout: 10000 });
  });

  it('prefetch should work', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username ?? '')
      .single();
    await prefetchQuery(queryClient, query);

    const wrapper = renderWithConfig(
      QueryPage6,
      { client, query },
      queryClient,
    );
    const updateEvent = wrapper.emitted('update');
    expect(updateEvent).toHaveLength(0);
    await screen.findByText(contacts[0].username!, {}, { timeout: 10000 });
  });

  it('initalData should work', async () => {
    const queryClient = new QueryClient();
    const query = client
      .from('contact')
      .select('id,username')
      .eq('username', contacts[0].username ?? '')
      .single();
    const [_, initial] = await fetchQueryInitialData(query);

    const wrapper = renderWithConfig(
      QueryPage7,
      { client, query, initial },
      queryClient,
    );
    const updateEvent = wrapper.emitted('update');
    expect(updateEvent).toHaveLength(0);
    await screen.findByText(contacts[0].username!, {}, { timeout: 10000 });
  });
});
