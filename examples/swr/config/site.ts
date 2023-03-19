import { NavItem } from "@/types/nav"

interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
    docs: string
  }
}

export const siteConfig: SiteConfig = {
  name: "Supabase 🤝 SWR",
  description:
    "A collection of framework specific Cache utilities for working with Supabase.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "useInfiniteScrollQuery",
      href: "/use-infinite-scroll-query",
    },
    {
      title: "usePaginationQuery",
      href: "/use-pagination-query",
    },
  ],
  links: {
    twitter: "https://twitter.com/psteinroe",
    github: "https://github.com/psteinroe/supabase-cache-helpers",
    docs: "https://github.com/psteinroe/supabase-cache-helpers/tree/main/packages/postgrest-swr",
  },
}
