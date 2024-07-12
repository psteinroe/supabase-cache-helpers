import { useSubscriptionQuery } from '@supabase-cache-helpers/postgrest-react-query';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import { SiteHeader } from '@/components/site-header';
import type { Database } from '@/types/database';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const supabase = useSupabaseClient<Database>();

  useSubscriptionQuery(
    supabase,
    'contacts',
    { event: '*', table: 'contact', schema: 'public' },
    ['id'],
  );

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
