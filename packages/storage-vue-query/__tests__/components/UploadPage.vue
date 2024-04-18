<template>
  <div data-testid="upload" @click="upload({ files, path: dirName })" />
  <div>{{ `isSuccess: ${isSuccess}` }}</div>
</template>

<script setup lang="ts">
import { useDirectory, useUpload } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  dirName: string;
  files: File[];
}
const props = defineProps<Props>();

useDirectory(
  props.client.storage.from('private_contact_files'),
  props.dirName,
  {
    refetchOnWindowFocus: false,
  },
);

const { mutateAsync: upload, isSuccess } = useUpload(
  props.client.storage.from('private_contact_files'),
  {},
);
</script>
