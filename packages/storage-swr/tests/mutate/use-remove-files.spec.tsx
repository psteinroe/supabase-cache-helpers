import { useDirectory, useRemoveFiles } from '../../src';
import { cleanup, renderWithConfig, upload } from '../utils';
import { fetchDirectory } from '@supabase-cache-helpers/storage-core';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TEST_PREFIX = 'postgrest-storage-remove';

describe('useRemoveFiles', () => {
  let client: SupabaseClient;
  let provider: Map<any, any>;
  let dirName: string;
  let files: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );

    await Promise.all([
      cleanup(client, 'public_contact_files', dirName),
      cleanup(client, 'private_contact_files', dirName),
    ]);

    files = await upload(client, 'private_contact_files', dirName);
  });
  beforeEach(() => {
    provider = new Map();
  });

  it('should remove files', async () => {
    function Page() {
      useDirectory(client.storage.from('private_contact_files'), dirName, {
        revalidateOnFocus: false,
      });
      const { trigger: remove, isMutating } = useRemoveFiles(
        client.storage.from('private_contact_files'),
      );
      return (
        <>
          <div
            data-testid="remove"
            onClick={() => remove(files.map((f) => [dirName, f].join('/')))}
          />
          <div>{`isMutating: ${isMutating}`}</div>
        </>
      );
    }

    renderWithConfig(<Page />, { provider: () => provider });
    fireEvent.click(screen.getByTestId('remove'));
    await screen.findByText('isMutating: false', {}, { timeout: 10000 });
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName),
    ).resolves.toEqual([]);
  });
});
