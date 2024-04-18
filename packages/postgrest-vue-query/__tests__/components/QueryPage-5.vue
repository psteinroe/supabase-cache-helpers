<template>
  <div>
    <div data-testid="mutate" @click="executeSetRefetch" />
    <div>{{ data?.username ?? 'undefined' }}</div>
    <div>{{ `refetched: ${!!refetched}` }}</div>
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

const { data, refetch, isLoading } = useQuery(
  props.client
    .from('contact')
    .select('id,username')
    .eq('username', props.contacts[0].username ?? '')
    .single(),
);
const refetched = ref<typeof data | null>(null);

const executeSetRefetch = async () =>
  (refetched.value = (await refetch())?.data?.data);
</script>
