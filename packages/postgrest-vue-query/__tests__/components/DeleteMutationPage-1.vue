<template>
  <div>
    {{ addressBookAndContact?.name }}
    <span data-testid="count">
      count: {{ addressBookAndContact?.contacts.length }}
    </span>
    <div
      v-for="contact in addressBookAndContact?.contacts"
      :key="contact.id"
      data-testid="contact"
    >
      {{ contact.username }}
      <button
        @click="
          deleteContactFromAddressBook({
            contact: contact.id,
            address_book: addressBookAndContact?.id,
          })
        "
      >
        Delete Contact
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useDeleteMutation } from '../../src';
import { SupabaseClient } from '@supabase/supabase-js';

interface Props {
  client: SupabaseClient;
  addressBookId: string;
}
const props = defineProps<Props>();

const { data: addressBookAndContact } = useQuery(
  props.client
    .from('address_book')
    .select('id, name, contacts:contact (id, username)')
    .eq('id', props.addressBookId)
    .single(),
);

const { mutateAsync: deleteContactFromAddressBook } = useDeleteMutation(
  props.client.from('address_book_contact'),
  ['contact', 'address_book'],
  'contact, address_book',
  {
    revalidateRelations: [
      {
        relation: 'address_book',
        relationIdColumn: 'id',
        fKeyColumn: 'address_book',
      },
    ],
  },
);
</script>
