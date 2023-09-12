import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { fetchDirectory } from '../src/directory-fetcher';
import { createRemoveFilesFetcher } from '../src/remove-files';
import { upload, cleanup } from './utils';

const TEST_PREFIX = 'storage-fetcher-remove-files';

describe('createRemoveFilesFetcher', () => {
  let client: SupabaseClient<unknown>;
  let dirName: string;
  let files: string[];

  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
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
      remove: jest.fn().mockImplementationOnce(() => {
        return { error: { name: 'StorageError', message: 'Unknown Error' } };
      }),
    };
    try {
      await createRemoveFilesFetcher(mock as any)(['123']);
    } catch (e) {
      expect(e).toEqual({ message: 'Unknown Error', name: 'StorageError' });
    }
  });

  it('should remove specified files', async () => {
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toHaveLength(4);
    await expect(
      createRemoveFilesFetcher(client.storage.from('private_contact_files'))([
        `${dirName}/${files[0]}`,
        `${dirName}/${files[1]}`,
      ])
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: `${dirName}/${files[0]}` }),
        expect.objectContaining({ name: `${dirName}/${files[1]}` }),
      ])
    );
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toHaveLength(2);
  });
});
