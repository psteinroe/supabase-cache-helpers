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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Contact = {
  country: string | null;
  username: string | null;
  ticket_number: number | null;
  golden_ticket: boolean | null;
  tags: string[] | null;
  age_range: unknown | null;
  metadata: Json | null;
  catchphrase: unknown | null;
  id: string;
  created_at: string;
};
