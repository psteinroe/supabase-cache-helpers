import type { Middleware, SWRHook } from "swr";

import { encode } from "./encode";

export const middleware: Middleware = (useSWRNext: SWRHook) => {
  return (key, fetcher, config) => {
    if (!fetcher) throw new Error("No fetcher provided");
    return useSWRNext(encode(key), () => fetcher(key), config);
  };
};
