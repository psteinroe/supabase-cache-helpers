import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { fireEvent, screen } from '@testing-library/react';
import React, { useState } from 'react';

import { useQuery, useUpsertMutation } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-swr-upsert';

describe('useUpsertMutation', () => {
  let client: SupabaseClient<Database>;
  let provider: Map<any, any>;
  let testRunId: number;
  let testRunPrefix: string;

  beforeAll(async () => {
    testRunId = Math.floor(Math.random() * 100);
    testRunPrefix = `${TEST_PREFIX}-${testRunId}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );
  });

  beforeEach(async () => {
    await client.from('contact').delete().ilike('username', `${TEST_PREFIX}%`);
    await client
      .from('multi_pk')
      .delete()
      .ilike('id_1', `${TEST_PREFIX}%`)
      .ilike('id_2', `${TEST_PREFIX}%`);
  });

  beforeEach(() => {
    provider = new Map();
  });

  it('should upsert into existing cache item', async () => {
    const USERNAME_1 = `${testRunPrefix}-2`;
    const USERNAME_2 = `${testRunPrefix}-3`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,username,golden_ticket', { count: 'exact' })
          .in('username', [USERNAME_1, USERNAME_2]),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );

      const { trigger: upsert } = useUpsertMutation(
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
            data-testid="upsertMany"
            onClick={async () =>
              await upsert([
                {
                  id: data?.find((d) => d.username === USERNAME_1)?.id,
                  username: USERNAME_1,
                  golden_ticket: true,
                },
                {
                  id: 'cae53d23-51a8-4408-9f40-05c83a4b0bbd',
                  username: USERNAME_2,
                  golden_ticket: null,
                },
              ])
            }
          />
          {(data ?? []).map((d) => (
            <span
              key={d.id}
            >{`${d.username} - ${d.golden_ticket ?? 'null'}`}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    await client
      .from('contact')
      .insert({
        username: USERNAME_1,
        golden_ticket: true,
      })
      .throwOnError();
    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText('count: 1', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('upsertMany'));
    await screen.findByText(`${USERNAME_1} - true`, {}, { timeout: 10000 });
    await screen.findByText(`${USERNAME_2} - null`, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 2');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });

  it('should upsert with multiple primary keys', async () => {
    const idValue = (i: number) => testRunId + i;

    await client
      .from('multi_pk')
      .insert([
        { id_1: idValue(1), id_2: idValue(2), name: 'A' },
        { id_1: idValue(1), id_2: idValue(3), name: 'B' },
      ])
      .throwOnError();
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('multi_pk')
          .select('id_1,id_2,name', { count: 'exact' })
          .eq('id_1', idValue(1)),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      );

      const { trigger: upsert } = useUpsertMutation(
        client.from('multi_pk'),
        ['id_1', 'id_2'],
        null,
        {
          onSuccess: () => setSuccess(true),
        },
      );

      return (
        <div>
          <div
            data-testid="upsertMany"
            onClick={async () =>
              await upsert([
                {
                  id_1: idValue(1),
                  id_2: idValue(3),
                  name: 'C',
                },
              ])
            }
          />
          {(data ?? []).map((d) => (
            <span
              key={`${d.id_1}-${d.id_2}`}
            >{`${d.id_1} - ${d.id_2}: ${d.name}`}</span>
          ))}
          <span data-testid="success">{`success: ${success}`}</span>
          <span data-testid="count">{`count: ${count}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    await screen.findByText(
      `${idValue(1)} - ${idValue(2)}: A`,
      {},
      { timeout: 10000 },
    );
    await screen.findByText(
      `${idValue(1)} - ${idValue(3)}: B`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('count: 2');
    fireEvent.click(screen.getByTestId('upsertMany'));
    await screen.findByText(
      `${idValue(1)} - ${idValue(2)}: A`,
      {},
      { timeout: 10000 },
    );
    await screen.findByText(
      `${idValue(1)} - ${idValue(3)}: C`,
      {},
      { timeout: 10000 },
    );
    expect(screen.getByTestId('count').textContent).toEqual('count: 2');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });
});
