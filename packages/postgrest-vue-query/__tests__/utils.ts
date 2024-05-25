import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { render } from '@testing-library/vue';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

export const renderWithConfig = (
  element: any,
  props?: { [key: string]: unknown },
  queryClient?: QueryClient,
): ReturnType<typeof render> => {
  const client = queryClient ?? new QueryClient();
  return render(element, {
    props,
    global: {
      plugins: [[VueQueryPlugin, { queryClient: client }]],
    },
  });
};
