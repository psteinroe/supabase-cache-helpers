<template>
  <div>{{ `URL: ${url ? 'exists' : url}` }}</div>
</template>

<script setup lang="ts">
import { useFileUrl } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  dirName: string;
  publicFiles: string[];
}
const props = defineProps<Props>();

const { data: url } = useFileUrl(
  props.client.storage.from('public_contact_files'),
  `${props.dirName}/${props.publicFiles[0]}`,
  'public',
  {
    ensureExistence: true,
  },
);
</script>
