<template>
  <div>
    <div>
      {{
        (data ?? []).find((d) => d.username === contacts[0].username)?.username
      }}
    </div>
    <div data-testid="count">{{ count }}</div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestBuilder } from '@supabase/postgrest-js';
import type { Database } from '../database.types';

interface Props {
  client: SupabaseClient;
  query: PostgrestBuilder<any[]>;
  contacts: Database['public']['Tables']['contact']['Row'][];
}
const props = defineProps<Props>();

const { data, count } = useQuery(props.query);
</script>
