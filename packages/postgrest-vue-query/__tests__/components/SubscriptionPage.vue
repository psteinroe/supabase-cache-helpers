<template>
  <div>
    <span v-for="d in data" :key="d.id">{{
      `ticket_number: ${d.ticket_number}`
    }}</span>
    <span data-testid="count">{{ `count: ${count}` }}</span>
    <span data-testid="status">{{ status }}</span>
    <span data-testid="callback-called">{{ `cbCalled: ${cbCalled}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery, useSubscription } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

const emit = defineEmits(['update']);

interface Props {
  client: SupabaseClient;
  username: string;
}
const props = defineProps<Props>();

const { data, count } = useQuery(
  props.client
    .from('contact')
    .select('id,username,ticket_number', { count: 'exact' })
    .eq('username', props.username),
);

const cbCalled = ref<boolean>(false);

const { status } = useSubscription(
  props.client,
  `public:contact:username=eq.${props.username}`,
  {
    event: '*',
    table: 'contact',
    schema: 'public',
    filter: `username=eq.${props.username}`,
  },
  ['id'],
  {
    callback: () => {
      cbCalled.value = true;
      return;
    },
  },
);
</script>
