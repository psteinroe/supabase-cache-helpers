<template>
  <div>
    <div>{{ data?.username ?? 'undefined' }}</div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue';
import { useQuery } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestBuilder } from '@supabase/postgrest-js';

const emit = defineEmits(['update']);

interface Props {
  client: SupabaseClient;
  query: PostgrestBuilder<{
    id: string;
    username: string | null;
  }>;
}
const props = defineProps<Props>();

const { data } = useQuery(props.query);

watchEffect(() => {
  if (!data.value) emit('update');
});
</script>
