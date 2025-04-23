import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useInsertMutation, useQuery, useUpdateMutation } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-react-query-update';

describe('useUpdateMutation', () => {
  let client: SupabaseClient<Database>;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
  });

  afterEach(cleanup);

  it('should update existing cache item', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username', { count: 'exact' })
          .in('username', [USERNAME_1, USERNAME_2]),
      );
      const { mutateAsync: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
      );
      const { mutateAsync: update } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        'id',
        {
          onSuccess: () => {
            setSuccess(true);
          },
        },
      );
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.username === USERNAME_1)?.id,
                username: USERNAME_2,
              })
            }
          />
          <span>
            {
              data?.find((d) =>
                [USERNAME_1, USERNAME_2].includes(d.username ?? ''),
              )?.username
            }
          </span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(USERNAME_1, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });

  it('should revalidate existing cache item with wildcard', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-wildcard-1`;
    const USERNAME_2 = `${testRunPrefix}-wildcard-2`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('*', { count: 'exact' })
          .in('username', [USERNAME_1, USERNAME_2]),
      );
      const { mutateAsync: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
      );
      const { mutateAsync: update } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.username === USERNAME_1)?.id,
                username: USERNAME_2,
              })
            }
          />
          <span>
            {
              data?.find((d) =>
                [USERNAME_1, USERNAME_2].includes(d.username ?? ''),
              )?.username
            }
          </span>
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0');
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText(USERNAME_1);
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText(USERNAME_2);
    expect(screen.getByTestId('count').textContent).toEqual('count: 1');
    await screen.findByText('success: true');
  });

  it('should revalidate existing cache item with aggregate', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-aggregate-1`;
    const USERNAME_2 = `${testRunPrefix}-aggregate-2`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data } = useQuery(
        client
          .from('contact')
          .select('id.count()')
          .in('username', [USERNAME_1, USERNAME_2]),
      );
      const { mutateAsync: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
      );
      const { mutateAsync: update } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );
      const res = data ? data[0] : null;
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () => {
              const { data } = await client
                .from('contact')
                .select('id')
                .eq('username', USERNAME_1)
                .single();
              await update({
                id: data!.id,
                username: USERNAME_2,
              });
            }}
          />
          <span data-testid="count">{`count: ${res?.count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0');
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText('count: 1');
    fireEvent.click(screen.getByTestId('update'));
    await screen.findByText('count: 1');
    await screen.findByText('success: true');
  });

  it('should revalidate existing cache item with count and head', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-count-1`;
    const USERNAME_2 = `${testRunPrefix}-count-2`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('*', { count: 'exact', head: true })
          .in('username', [USERNAME_1, USERNAME_2]),
      );
      const { mutateAsync: insert } = useInsertMutation(
        client.from('contact'),
        ['id'],
      );
      const { mutateAsync: update } = useUpdateMutation(
        client.from('contact'),
        ['id'],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );
      return (
        <div>
          <div
            data-testid="insert"
            onClick={async () => await insert([{ username: USERNAME_1 }])}
          />
          <div
            data-testid="update"
            onClick={async () =>
              await update({
                id: (data ?? []).find((d) => d.username === USERNAME_1)?.id,
                username: USERNAME_2,
              })
            }
          />
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0');
    fireEvent.click(screen.getByTestId('insert'));
    await screen.findByText('count: 1');
  });
});
