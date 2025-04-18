import { useFileUrl } from '@supabase-cache-helpers/storage-swr';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { FC, PropsWithChildren } from 'react';

import type { Database } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const ContactCards: FC<PropsWithChildren> = ({ children }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
);

export type ContactCardProps = {
  contact: Pick<
    Database['public']['Tables']['contact']['Row'],
    'id' | 'username' | 'continent'
  >;
  onClick: () => void;
};

export const ContactCard: FC<ContactCardProps> = ({ contact, onClick }) => {
  const supabase = useSupabaseClient();
  const { data: avatarUrl } = useFileUrl(
    supabase.storage.from('contact_avatars'),
    contact.id,
    'public',
    {
      ensureExistence: true,
    },
  );

  return (
    <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
      <div className="shrink-0">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={contact.username} />
          <AvatarFallback>{contact.username.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <div onClick={onClick} className="focus:outline-hidden">
          <span className="absolute inset-0" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-900">
            {contact.username}
          </p>
          <p className="truncate text-sm text-gray-500">{contact.continent}</p>
        </div>
      </div>
    </div>
  );
};
