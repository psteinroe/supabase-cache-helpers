import { render } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import { resolve } from "node:path";

import * as dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

export const renderWithConfig = (
  element: React.ReactElement,
  config: Parameters<typeof SWRConfig>[0]["value"]
): ReturnType<typeof render> => {
  const TestSWRConfig = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={config}>{children}</SWRConfig>
  );
  return render(element, { wrapper: TestSWRConfig });
};
