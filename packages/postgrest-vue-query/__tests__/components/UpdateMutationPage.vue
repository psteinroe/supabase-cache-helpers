<template>
  <div>
    <div data-testid="insert" @click="executeInsert" />
    <div data-testid="update" @click="executeUpdate" />
    <span>
      {{ computedUsername }}
    </span>
    <span data-testid="count">{{ `count: ${count}` }}</span>
    <span data-testid="success">{{ `success: ${success}` }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useInsertMutation, useUpdateMutation } from '../../src';
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
    .select('id,username', { count: 'exact' })
    .in('username', [props.username1, props.username2]),
);
const { mutateAsync: insert } = useInsertMutation(
  props.client.from('contact'),
  ['id'],
);
const { mutateAsync: update } = useUpdateMutation(
  props.client.from('contact'),
  ['id'],
  null,
  {
    onSuccess: () => (success.value = true),
  },
);

const executeInsert = async () => await insert([{ username: props.username1 }]);
const executeUpdate = async () =>
  await update({
    id: (data.value ?? []).find((d) => d.username === props.username1)?.id,
    username: props.username2,
  });

const computedUsername = computed(
  () =>
    data.value?.find((d) =>
      [props.username1, props.username2].includes(d.username ?? ''),
    )?.username,
);
</script>
