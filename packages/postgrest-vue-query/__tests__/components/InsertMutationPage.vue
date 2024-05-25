<template>
  <div>
    <div data-testid="insertMany" @click="executeInsert" />
    <span v-for="d in data" :key="d.id">{{ d.alias }}</span>
    <span data-testid="count">{{ `count: ${count}` }}</span>
    <span data-testid="success">{{ `success: ${success}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery, useInsertMutation } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  userName1: string;
  userName2: string;
  userName3: string;
}
const props = defineProps<Props>();

const success = ref<boolean>(false);

const { data, count } = useQuery(
  props.client
    .from('contact')
    .select('id,alias:username', { count: 'exact' })
    .in('username', [props.userName1, props.userName2, props.userName3]),
);
const { mutateAsync: insert } = useInsertMutation(
  props.client.from('contact'),
  ['id'],
  null,
  {
    onSuccess: () => (success.value = true),
  },
);

const executeInsert = () =>
  insert([
    {
      username: props.userName2,
    },
    {
      username: props.userName3,
    },
  ]);
</script>
