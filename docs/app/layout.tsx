import type { Viewport } from 'next';
import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Banner, Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
  metadataBase: new URL('https://supabase-cache-helpers.vercel.app'),
  title: {
    default: 'Supabase Cache Helpers',
    template: '%s – Supabase Cache Helpers',
  },
  description:
    'A collection of framework specific Cache utilities for working with Supabase.',
  applicationName: 'Supabase Cache Helpers',
  generator: 'Next.js',
  appleWebApp: {
    title: 'Supabase Cache Helpers',
  },
  other: {
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'msapplication-TileColor': '#fff',
  },
  openGraph: {
    title: 'Supabase Cache Helpers',
    description:
      'A collection of framework specific Cache utilities for working with Supabase.',
    url: 'https://supabase-cache-helpers.vercel.app',
    siteName: 'Supabase Cache Helpers',
    images: [
      {
        url: 'https://supabase-cache-helpers.vercel.app/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supabase Cache Helpers',
    description:
      'A collection of framework specific Cache utilities for working with Supabase.',
    images: ['https://supabase-cache-helpers.vercel.app/og-image.png'],
    creator: '@psteinroe',
    site: 'https://supabase-cache-helpers.vercel.app',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const navbar = <Navbar logo={<span>Supabase Cache Helpers</span>} />;
  const pageMap = await getPageMap();
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head faviconGlyph="✦" />
      <body>
        <Layout
          banner={
            <Banner storageKey="hiring">
              <a
                href="https://twitter.com/psteinroe"
                target="_blank"
                rel="noreferrer"
              >
                🎉 We are hiring! You want to work on a large-scale Supabase
                project? DM me →
              </a>
            </Banner>
          }
          navbar={navbar}
          footer={
            <Footer>
              MIT {new Date().getFullYear()}
              <a
                href="https://supabase-cache-helpers.vercel.app"
                target="_blank"
                rel="noreferrer"
              >
                {': '}
                Supabase Cache Helpers
              </a>
            </Footer>
          }
          editLink="Edit this page on GitHub"
          docsRepositoryBase="https://github.com/psteinroe/supabase-cache-helpers/blob/core/docs"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          pageMap={pageMap}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
