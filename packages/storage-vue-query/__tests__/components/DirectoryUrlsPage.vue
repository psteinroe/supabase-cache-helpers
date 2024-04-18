<template>
  <div>
    <span v-for="file in files" :key="file.name">{{
      `${file.name}: ${file.url ? 'exists' : file.url}`
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { useDirectoryFileUrls } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  dirName: string;
}
const props = defineProps<Props>();

const { data: files } = useDirectoryFileUrls(
  props.client.storage.from('private_contact_files'),
  props.dirName,
  'private',
);
</script>
