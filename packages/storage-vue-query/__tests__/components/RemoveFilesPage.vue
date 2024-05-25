<template>
  <div
    data-testid="remove"
    @click="remove(files.map((f) => [dirName, f].join('/')))"
  />
  <div>{{ `isSuccess: ${isSuccess}` }}</div>
</template>

<script setup lang="ts">
import { useDirectory, useRemoveFiles } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  dirName: string;
  files: string[];
}
const props = defineProps<Props>();

useDirectory(
  props.client.storage.from('private_contact_files'),
  props.dirName,
  {
    refetchOnWindowFocus: false,
  },
);

const { mutateAsync: remove, isSuccess } = useRemoveFiles(
  props.client.storage.from('private_contact_files'),
);
</script>
