<template>
  <div>{{ isLoading ? 'validating' : `username: ${data?.username}` }}</div>
</template>

<script setup lang="ts">
import { useQuery } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestBuilder } from '@supabase/postgrest-js';

interface Props {
  client: SupabaseClient;
  query: PostgrestBuilder<{
    id: string;
    username: string | null;
  } | null>;
}
const props = defineProps<Props>();

const { data, isLoading } = useQuery(props.query);
</script>
