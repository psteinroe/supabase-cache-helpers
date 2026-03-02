import { createUrlFetcher } from '../src/url-fetcher';
import { cleanup, upload } from './utils';
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const TEST_PREFIX = 'storage-fetcher-directory';

describe('urlFetcher', () => {
  let client: SupabaseClient<unknown>;
  let dirName: string;
  let privateFiles: string[];
  let publicFiles: string[];

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

    privateFiles = await upload(client, 'private_contact_files', dirName);
    publicFiles = await upload(client, 'public_contact_files', dirName);
  });

  afterAll(async () => {
    await Promise.all([
      cleanup(client, 'public_contact_files', dirName),
      cleanup(client, 'private_contact_files', dirName),
    ]);
  });

  it('should return undefined if ensureExistence is set and file does not exist', async () => {
    await expect(
      createUrlFetcher('public', {
        ensureExistence: true,
      })(client.storage.from('public_contact_files'), 'unknown'),
    ).resolves.toBeUndefined();
  });

  it('should append updated_at to url ensureExistence is set and file exists', async () => {
    await expect(
      createUrlFetcher('public', {
        ensureExistence: true,
      })(
        client.storage.from('public_contact_files'),
        `${dirName}/${publicFiles[0]}`,
      ),
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/public/public_contact_files/${dirName}/${publicFiles[0]}?updated_at=`,
      ),
    );
  });
  it('should return url for public bucket', async () => {
    await expect(
      createUrlFetcher('public')(
        client.storage.from('public_contact_files'),
        `${dirName}/${publicFiles[0]}`,
      ),
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/public/public_contact_files/${dirName}/${publicFiles[0]}`,
      ),
    );
  });

  it('should return url for private bucket', async () => {
    await expect(
      createUrlFetcher('private')(
        client.storage.from('private_contact_files'),
        `${dirName}/${privateFiles[0]}`,
      ),
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/sign/private_contact_files/${dirName}/${privateFiles[0]}?token=`,
      ),
    );
  });

  it('should pass expires in for private bucket', async () => {
    await expect(
      createUrlFetcher('private', { expiresIn: 10 })(
        client.storage.from('private_contact_files'),
        `${dirName}/${privateFiles[0]}`,
      ),
    ).resolves.toEqual(
      expect.stringContaining(
        `http://localhost:54321/storage/v1/object/sign/private_contact_files/${dirName}/${privateFiles[0]}?token=`,
      ),
    );
  });

  describe('ensureExistence uses list()', () => {
    it('should return undefined when file does not exist', async () => {
      const mock = {
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        exists: vi.fn(),
        info: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'http://example.com/file.png' },
        }),
      };
      const result = await createUrlFetcher('public', {
        ensureExistence: true,
      })(mock as any, 'avatars/photo.png');

      expect(result).toBeUndefined();
      expect(mock.list).toHaveBeenCalledWith('avatars', {
        search: 'photo.png',
        limit: 1,
      });
      expect(mock.exists).not.toHaveBeenCalled();
      expect(mock.info).not.toHaveBeenCalled();
    });

    it('should return url with updated_at when file exists', async () => {
      const mock = {
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'photo.png', updated_at: '2024-01-01T00:00:00Z' }],
          error: null,
        }),
        exists: vi.fn(),
        info: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'http://example.com/avatars/photo.png' },
        }),
      };
      const result = await createUrlFetcher('public', {
        ensureExistence: true,
      })(mock as any, 'avatars/photo.png');

      expect(result).toContain('updated_at=2024-01-01T00%3A00%3A00Z');
      expect(mock.list).toHaveBeenCalledWith('avatars', {
        search: 'photo.png',
        limit: 1,
      });
      expect(mock.exists).not.toHaveBeenCalled();
      expect(mock.info).not.toHaveBeenCalled();
    });

    it('should handle root-level paths without prefix', async () => {
      const mock = {
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'photo.png', updated_at: '2024-01-01T00:00:00Z' }],
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'http://example.com/photo.png' },
        }),
      };
      const result = await createUrlFetcher('public', {
        ensureExistence: true,
      })(mock as any, 'photo.png');

      expect(result).toBeDefined();
      expect(mock.list).toHaveBeenCalledWith(undefined, {
        search: 'photo.png',
        limit: 1,
      });
    });

    it('should throw on list error', async () => {
      const mock = {
        list: vi.fn().mockResolvedValue({
          data: null,
          error: { name: 'StorageError', message: 'list failed' },
        }),
      };
      await expect(
        createUrlFetcher('public', { ensureExistence: true })(
          mock as any,
          'avatars/photo.png',
        ),
      ).rejects.toEqual({ name: 'StorageError', message: 'list failed' });
    });
  });

  it('should bubble up error', async () => {
    expect.assertions(1);
    const mock = {
      createSignedUrl: vi.fn().mockImplementationOnce(() => {
        return { error: { name: 'StorageError', message: 'Unknown Error' } };
      }),
    };
    try {
      await createUrlFetcher('private')(mock as any, '123');
    } catch (e) {
      expect(e).toEqual({ message: 'Unknown Error', name: 'StorageError' });
    }
  });

  it('should throw if mode is invalid', async () => {
    expect.assertions(1);
    try {
      await createUrlFetcher('invalid' as any)(
        client.storage.from('private_contact_files'),
        `${dirName}/${privateFiles[0]}`,
      );
    } catch (e) {
      expect(e).toEqual(new Error('Invalid mode: invalid'));
    }
  });
});
