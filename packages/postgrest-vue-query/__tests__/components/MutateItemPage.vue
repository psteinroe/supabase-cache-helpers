<template>
  <div>
    <div data-testid="mutate" @click="executeMutate" />
    <span v-for="d in data" :key="d.id">{{ d.username }}</span>
    <span data-testid="count">{{ `count: ${count}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useMutateItem } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  testRunPrefix: string;
}
const props = defineProps<Props>();

const { data, count } = useQuery(
  props.client
    .from('contact')
    .select('id,username', { count: 'exact' })
    .ilike('username', `${props.testRunPrefix}%`),
);

const mutate = useMutateItem({
  schema: 'public',
  table: 'contact',
  primaryKeys: ['id'],
});

async function executeMutate() {
  return await mutate(
    {
      id: (data.value ?? []).find((c) => c)?.id,
    },
    (c) => ({ ...c, username: `${c.username}-updated` }),
  );
}
</script>
