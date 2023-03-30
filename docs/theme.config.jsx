import { useRouter } from "next/router";

export default {
    logo: <span>Supabase Cache Helpers</span>,
    project: {
        link: "https://github.com/psteinroe/supabase-cache-helpers",
    },
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
                🎉 You want to work on a larger-scale Supabase project and use cache
                helpers in production? DM me →
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
