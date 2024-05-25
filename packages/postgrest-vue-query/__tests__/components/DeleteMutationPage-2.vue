<template>
  <div>
    <div data-testid="delete" @click="executeDeleteContact" />
    <div
      data-testid="deleteWithEmptyOptions"
      @click="executeDeleteWithEmptyOptions"
    />
    <div
      data-testid="deleteWithoutOptions"
      @click="executeDeleteWithoutOptions"
    />
    <span v-for="d in data" :key="d.id">{{ d.username }}</span>
    <span data-testid="count">{{ `count: ${count}` }}</span>
    <span data-testid="success">{{ `success: ${success}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Database } from '../database.types';
import { useQuery, useDeleteMutation } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  contacts: Database['public']['Tables']['contact']['Row'][];
}
const props = defineProps<Props>();

const success = ref<boolean>(false);
const { data, count } = useQuery(
  props.client
    .from('contact')
    .select('id,username', { count: 'exact' })
    .eq('username', props.contacts[0].username ?? ''),
);
const { mutateAsync: deleteContact } = useDeleteMutation(
  props.client.from('contact'),
  ['id'],
  null,
  { onSuccess: () => (success.value = true) },
);
const { mutateAsync: deleteWithEmptyOptions } = useDeleteMutation(
  props.client.from('contact'),
  ['id'],
  null,
  {},
);
const { mutateAsync: deleteWithoutOptions } = useDeleteMutation(
  props.client.from('contact'),
  ['id'],
);

const executeDeleteContact = () =>
  deleteContact({
    id: (data.value ?? []).find((c) => c)?.id,
  });

const executeDeleteWithEmptyOptions = () =>
  deleteWithEmptyOptions({
    id: (data.value ?? []).find((c) => c)?.id,
  });
const executeDeleteWithoutOptions = () =>
  deleteWithoutOptions({
    id: (data.value ?? []).find((c) => c)?.id,
  });
</script>
