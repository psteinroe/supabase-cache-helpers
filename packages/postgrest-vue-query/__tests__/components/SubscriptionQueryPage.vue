<template>
  <div>
    <span v-for="d in data" :key="d.id">{{
      `ticket_number: ${d.ticket_number} | has_low_ticket_number: ${d.has_low_ticket_number}`
    }}</span>
    <span data-testid="count">{{ `count: ${count}` }}</span>
    <span data-testid="status">{{ statusRef }}</span>
    <span data-testid="callback-called">{{ `cbCalled: ${cbCalled}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery, useSubscriptionQuery } from '../../src';
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
    .select('id,username,has_low_ticket_number,ticket_number', {
      count: 'exact',
    })
    .eq('username', props.username),
);

const cbCalled = ref<boolean>(false);

const { statusRef } = useSubscriptionQuery(
  props.client,
  `public:contact:username=eq.${props.username}`,
  {
    event: '*',
    table: 'contact',
    schema: 'public',
    filter: `username=eq.${props.username}`,
  },
  ['id'],
  'id,username,has_low_ticket_number,ticket_number',
  {
    callback: (evt) => {
      if (evt.data.ticket_number === 1000) {
        cbCalled.value = true;
      }
    },
  },
);
</script>
