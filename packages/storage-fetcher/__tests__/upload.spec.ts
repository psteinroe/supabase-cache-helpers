import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { cleanup, loadFixtures } from './utils';

import { fetchDirectory, createUploadFetcher } from '../src';

const TEST_PREFIX = 'storage-fetcher-upload';

// https://stackoverflow.com/questions/8609289/convert-a-binary-nodejs-buffer-to-javascript-arraybuffer
const fromBufferToArrayBuffer = (b: Buffer) =>
  b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

describe('createUploadFetcher', () => {
  let client: SupabaseClient<unknown>;
  let dirName: string;
  let fileNames: string[];
  let files: Buffer[];
  beforeAll(async () => {
    dirName = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    client = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );

    await cleanup(client, 'private_contact_files', dirName);
    const fixtures = await loadFixtures();
    fileNames = fixtures.fileNames;
    files = fixtures.files;
  });

  afterEach(async () => {
    await cleanup(client, 'private_contact_files', dirName);
  });

  it('should bubble up error', async () => {
    expect.assertions(1);
    const mock = {
      upload: jest.fn().mockImplementationOnce(() => {
        return { error: { name: 'StorageError', message: 'Unknown Error' } };
      }),
    };
    await expect(
      createUploadFetcher(mock as any)([
        new File([files[0] as BlobPart], 'test1'),
      ])
    ).resolves.toEqual(
      expect.arrayContaining([
        {
          error: { message: 'Unknown Error', name: 'StorageError' },
        },
      ])
    );
  });

  it('should upload files', async () => {
    const { fileNames, files } = await loadFixtures();
    await expect(
      createUploadFetcher(client.storage.from('private_contact_files'), {
        buildFileName: ({ fileName }) => `${dirName}/${fileName}`,
      })([
        new File([files[0] as BlobPart], fileNames[0]),
        new File([files[1] as BlobPart], fileNames[1]),
      ])
    ).resolves.toEqual(
      expect.arrayContaining(
        [fileNames[0], fileNames[1]].map((fileName) =>
          expect.objectContaining({
            data: { path: `${dirName}/${fileName}` },
            error: null,
          })
        )
      )
    );
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toEqual(
      expect.arrayContaining(
        [fileNames[0], fileNames[1]].map((f) =>
          expect.objectContaining({ name: f })
        )
      )
    );
  });

  it('should upload files with prefix', async () => {
    const { fileNames, files } = await loadFixtures();
    await expect(
      createUploadFetcher(client.storage.from('private_contact_files'))(
        [
          new File([files[2] as BlobPart], fileNames[2]),
          new File([files[3] as BlobPart], fileNames[3]),
        ],
        dirName
      )
    ).resolves.toEqual(
      expect.arrayContaining(
        [fileNames[2], fileNames[3]].map((fileName) =>
          expect.objectContaining({
            data: { path: `${dirName}/${fileName}` },
            error: null,
          })
        )
      )
    );
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toEqual(
      expect.arrayContaining(
        [fileNames[2], fileNames[3]].map((f) =>
          expect.objectContaining({ name: f })
        )
      )
    );
  });

  it('should upload array buffer files', async () => {
    const { fileNames, files } = await loadFixtures();
    await expect(
      createUploadFetcher(client.storage.from('private_contact_files'), {
        buildFileName: ({ fileName }) => `${dirName}/${fileName}`,
      })([
        {
          data: fromBufferToArrayBuffer(files[0]),
          name: fileNames[0],
          type: 'image/jpeg',
        },
        {
          data: fromBufferToArrayBuffer(files[1]),
          name: fileNames[1],
          type: 'image/jpeg',
        },
      ])
    ).resolves.toEqual(
      expect.arrayContaining(
        [fileNames[0], fileNames[1]].map((fileName) =>
          expect.objectContaining({
            data: { path: `${dirName}/${fileName}` },
            error: null,
          })
        )
      )
    );
    await expect(
      fetchDirectory(client.storage.from('private_contact_files'), dirName)
    ).resolves.toEqual(
      expect.arrayContaining(
        [fileNames[0], fileNames[1]].map((f) =>
          expect.objectContaining({ name: f })
        )
      )
    );
  });
});
