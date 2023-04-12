import { BareFetcher, Key, Middleware, SWRConfiguration, SWRHook } from 'swr';

import { encode } from './encode';

export const middleware: Middleware = <Type>(useSWRNext: SWRHook) => {
  return (
    key: Key,
    fetcher: BareFetcher<Type> | null,
    config: SWRConfiguration
  ) => {
    if (!fetcher) throw new Error('No fetcher provided');
    return useSWRNext(encode(key), () => fetcher(key), config);
  };
};
