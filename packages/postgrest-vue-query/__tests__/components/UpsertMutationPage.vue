<template>
  <div>
    <div data-testid="upsertMany" @click="executeUpsert" />

    <span v-for="d in data" :key="d.id">
      {{ `${d.username} - ${d.golden_ticket ?? 'null'}` }}
    </span>

    <span data-testid="count">{{ `count: ${count}` }}</span>
    <span data-testid="success">{{ `success: ${success}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery, useUpsertMutation } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  username1: string;
  username2: string;
}
const props = defineProps<Props>();

const success = ref<boolean>(false);

const { data, count } = useQuery(
  props.client
    .from('contact')
    .select('id,username,golden_ticket', { count: 'exact' })
    .in('username', [props.username1, props.username2]),
);

const { mutateAsync: upsert } = useUpsertMutation(
  props.client.from('contact'),
  ['id'],
  null,
  {
    onSuccess: () => (success.value = true),
  },
);

const executeUpsert = async () =>
  await upsert([
    {
      id: data.value?.find((d) => d.username === props.username1)?.id,
      username: props.username1,
      golden_ticket: true,
    },
    {
      id: 'cae53d23-51a8-4408-9f40-05c83a4b0bbd',
      username: props.username2,
      golden_ticket: null,
    },
  ]);
</script>
