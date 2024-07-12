import { Inter as FontSans } from "@next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";

import "@/styles/globals.css";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import Head from "next/head";
import { useState } from "react";

const queryClient = new QueryClient();

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <QueryClientProvider client={queryClient}>
      <style jsx global>{`
				:root {
					--font-sans: ${fontSans.style.fontFamily};
				}
			}`}</style>

      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Supabase Cache Helpers SWR Demo" />
        <meta
          property="og:description"
          content="A collection of SWR utilities for working with Supabase."
        />
        <meta
          property="og:image"
          content="https://supabase-cache-helpers.vercel.app/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image:alt"
          content="Supabase Cache Helpers Banner"
        />
        <meta name="twitter:title" content="Supabase Cache Helpers" />
        <meta
          name="twitter:description"
          content="A collection of framework specific Cache utilities for working with Supabase."
        />
        <meta
          name="twitter:image"
          content="https://supabase-cache-helpers.vercel.app/og-image.png"
        />
      </Head>
      <SessionContextProvider
        supabaseClient={supabaseClient}
        initialSession={pageProps.initialSession}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Component {...pageProps} />
          <Analytics />
        </ThemeProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  );
}
