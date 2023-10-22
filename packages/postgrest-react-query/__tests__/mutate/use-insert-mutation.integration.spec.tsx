import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
import React, { useState } from 'react';

import { useInsertMutation, useQuery } from '../../src';
import type { Database } from '../database.types';
import { renderWithConfig } from '../utils';

const TEST_PREFIX = 'postgrest-swr-insert';

describe('useInsertMutation', () => {
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

  it('should insert into existing cache item with alias', async () => {
    const queryClient = new QueryClient();
    const USERNAME_1 = `${testRunPrefix}-1`;
    const USERNAME_2 = `${testRunPrefix}-2`;
    const USERNAME_3 = `${testRunPrefix}-3`;
    function Page() {
      const [success, setSuccess] = useState<boolean>(false);
      const { data, count } = useQuery(
        client
          .from('contact')
          .select('id,alias:username', { count: 'exact' })
          .in('username', [USERNAME_1, USERNAME_2, USERNAME_3]),
      );
      const { mutateAsync: insert } = useInsertMutation(
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
            data-testid="insertMany"
            onClick={async () =>
              await insert([
                {
                  username: USERNAME_2,
                },
                {
                  username: USERNAME_3,
                },
              ])
            }
          />
          {(data ?? []).map((d) => (
            <span key={d.id}>{d.alias}</span>
          ))}
          <span data-testid="count">{`count: ${count}`}</span>
          <span data-testid="success">{`success: ${success}`}</span>
        </div>
      );
    }

    renderWithConfig(<Page />, queryClient);
    await screen.findByText('count: 0', {}, { timeout: 10000 });
    fireEvent.click(screen.getByTestId('insertMany'));
    await screen.findByText(USERNAME_2, {}, { timeout: 10000 });
    await screen.findByText(USERNAME_3, {}, { timeout: 10000 });
    expect(screen.getByTestId('count').textContent).toEqual('count: 2');
    await screen.findByText('success: true', {}, { timeout: 10000 });
  });
});
