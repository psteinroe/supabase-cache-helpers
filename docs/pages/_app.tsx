import { TabProvider } from '@/components/tab-context';
import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TabProvider>
      <Component {...pageProps} />
      <Analytics />
    </TabProvider>
  );
}

export default MyApp;
