import path from 'node:path';
import * as url from 'url';
import { config } from 'dotenv';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'development'
    ? {
        env: config({
          path: path.resolve(__dirname, `../../.env.local`),
        }).parsed,
      }
    : {}),
  reactStrictMode: true,
};

export default nextConfig;
