import { render } from '@testing-library/react';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import type React from 'react';
import { SWRConfig } from 'swr';

dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

export const renderWithConfig = (
  element: React.ReactElement,
  config: Parameters<typeof SWRConfig>[0]['value'],
): ReturnType<typeof render> => {
  const TestSWRConfig = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig
      value={{ revalidateOnFocus: false, revalidateIfStale: false, ...config }}
    >
      {children}
    </SWRConfig>
  );
  return render(element, { wrapper: TestSWRConfig });
};
