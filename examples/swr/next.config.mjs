import { config } from 'dotenv';
import * as url from 'url';
import path from 'node:path'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.NODE_ENV === 'development'
        ? {
            env:
                config({
                    path: path.resolve(__dirname, `../../.env.local`),
                })
                    .parsed,
        }
        : {}),
    reactStrictMode: true,
    experimental: {
        fontLoaders: [
            {
                loader: "@next/font/google",
                options: { subsets: ["latin"] },
            },
        ],
    },
}

export default nextConfig
