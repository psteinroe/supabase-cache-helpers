import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import type React from 'react';

dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

export const renderWithConfig = (
  element: React.ReactElement,
  queryClient: QueryClient,
): ReturnType<typeof render> => {
  const TestQueryClientProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <QueryClientProvider client={queryClient}> {children} </QueryClientProvider>
  );
  return render(element, { wrapper: TestQueryClientProvider });
};
