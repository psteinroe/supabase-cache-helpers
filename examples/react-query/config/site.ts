import type { NavItem } from "@/types/nav";

interface SiteConfig {
  name: string;
  description: string;
  mainNav: NavItem[];
  links: {
    twitter: string;
    github: string;
    docs: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "Supabase Cache Helpers for React Query",
  description:
    "A collection of React Query utilities for working with Supabase.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "useQuery",
      href: "/use-query",
    },
    // {
    //   title: "useInfiniteScrollQuery",
    //   href: "/use-infinite-scroll-query",
    // },
    // {
    //   title: "usePaginationQuery",
    //   href: "/use-pagination-query",
    // },
  ],
  links: {
    twitter: "https://twitter.com/psteinroe",
    github: "https://github.com/psteinroe/supabase-cache-helpers",
    docs: "https://supabase-cache-helpers.vercel.app",
  },
};
