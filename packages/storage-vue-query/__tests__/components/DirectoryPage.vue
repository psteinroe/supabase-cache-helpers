<template>
  <div>
    <span v-for="file in files" :key="file.name">{{ file.name }}</span>
  </div>
</template>

<script setup lang="ts">
import { useDirectory } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  dirName: string;
}
const props = defineProps<Props>();

const { data: files } = useDirectory(
  props.client.storage.from('private_contact_files'),
  props.dirName,
  {
    refetchOnWindowFocus: false,
  },
);
</script>
