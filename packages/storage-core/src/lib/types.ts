import type { StorageClient } from '@supabase/storage-js';

export type StorageFileApi = ReturnType<StorageClient['from']>;

export type DecodedStorageKey = { bucketId: string; path: string };

export type StoragePrivacy = 'public' | 'private';
