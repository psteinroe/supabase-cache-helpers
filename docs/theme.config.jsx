import { useRouter } from "next/router";

export default {
  logo: <span>Supabase Cache Helpers</span>,
  project: {
    link: "https://github.com/psteinroe/supabase-cache-helpers",
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Supabase Cache Helpers" />
      <meta
        property="og:description"
        content="A collection of framework specific Cache utilities for working with Supabase."
      />
      <meta
        property="og:image"
        content="https://supabase-cache-helpers.vercel.app/og-image.png"
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image:alt" content="Supabase Cache Helpers Banner" />
      <meta name="twitter:title" content="Supabase Cache Helpers" />
      <meta
        name="twitter:description"
        content="A collection of framework specific Cache utilities for working with Supabase."
      />
      <meta
        name="twitter:image"
        content="https://supabase-cache-helpers.vercel.app/og-image.png"
      />
    </>
  ),
  docsRepositoryBase:
    "https://github.com/psteinroe/supabase-cache-helpers/blob/core/docs",
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== "/") {
      return {
        titleTemplate: "%s – Supabase Cache Helpers",
      };
    }
  },
  banner: {
    key: "v1.0-release",
    text: (
      <a href="https://twitter.com/psteinroe" target="_blank" rel="noreferrer">
        🎉 We are hiring! You want to work on a larger-scale Supabase project?
        DM me →
      </a>
    ),
  },
  footer: {
    text: (
      <span>
        MIT {new Date().getFullYear()} ©{" "}
        <a
          href="https://supabase-cache-helpers.vercel.app"
          target="_blank"
          rel="noreferrer"
        >
          Supabase Cache Helpers
        </a>
      </span>
    ),
  },
};
