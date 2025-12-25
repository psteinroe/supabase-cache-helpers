import { fetchDirectory } from '../src/directory-fetcher';
import { createRemoveDirectoryFetcher } from '../src/remove-directory';
import { cleanup, upload } from './utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const TEST_PREFIX = 'storage-fetcher-remove-directory';

describe('createRemoveDirectoryFetcher', () => {
  let client: SupabaseClient<unknown>;
  let dirName: string;
  let files: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string,
    );

    await cleanup(client, 'private_contact_files', dirName);
    files = await upload(client, 'private_contact_files', dirName);
  });

  afterAll(async () => {
    await cleanup(client, 'private_contact_files', dirName);
  });

  it('should bubble up error', async () => {
    expect.assertions(1);
    const mock = {
      remove: vi.fn().mockImplementationOnce(() => {
        return { error: { name: 'StorageError', message: 'Unknown Error' } };
      }),
      list: vi.fn().mockImplementationOnce(() => {
        return { error: { name: 'StorageError', message: 'Unknown Error' } };
      }),
    };
    try {
      await createRemoveDirectoryFetcher(mock as any)('123');
    } catch (e) {
      expect(e).toEqual({ message: 'Unknown Error', name: 'StorageError' });
    }
  });

  it('should remove all files in the directory', async () => {
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName),
    ).resolves.toHaveLength(4);
    await expect(
      createRemoveDirectoryFetcher(
        client.storage.from('private_contact_files'),
      )(dirName),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: `${dirName}/${files[0]}` }),
        expect.objectContaining({ name: `${dirName}/${files[1]}` }),
      ]),
    );
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName),
    ).resolves.toEqual([]);
  });
});
