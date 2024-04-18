<template>
  <div>
    <div data-testid="setCondition" @click="() => (condition = true)" />
    <div>{{ data?.username ?? 'undefined' }}</div>
    <div>{{ `isLoading: ${isLoading}` }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuery } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

interface Props {
  client: SupabaseClient;
  contacts: Database['public']['Tables']['contact']['Row'][];
}
const props = defineProps<Props>();

const condition = ref<boolean>(false);
const { data, isLoading } = useQuery(
  props.client
    .from('contact')
    .select('id,username')
    .eq('username', props.contacts[0].username ?? '')
    .maybeSingle(),
  { enabled: condition },
);
</script>
