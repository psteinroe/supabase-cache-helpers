<template>
  <div data-testid="remove" @click="remove(dirName)" />
  <div>{{ `isSuccess: ${isSuccess}` }}</div>
</template>

<script setup lang="ts">
import { useDirectory, useRemoveDirectory } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  dirName: string;
}
const props = defineProps<Props>();

useDirectory(
  props.client.storage.from('private_contact_files'),
  props.dirName,
  {
    refetchOnWindowFocus: false,
  },
);

const { mutateAsync: remove, isSuccess } = useRemoveDirectory(
  props.client.storage.from('private_contact_files'),
);
</script>
