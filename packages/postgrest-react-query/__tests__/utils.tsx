import { render } from '@testing-library/react';
import React from 'react';
import { resolve } from 'node:path';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import * as dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

export const renderWithConfig = (
  element: React.ReactElement,
  queryClient: QueryClient
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
