import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { resolve } from "node:path";

import * as dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

import { PostgrestFilter, PostgrestParser } from "../src";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

type Contact = {
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

describe("postgrest-filter-fn", () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  });
  let query: PostgrestFilterBuilder<Contact>;

  beforeEach(() => {});

  it("test", () => {
    const supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    const filter = PostgrestFilter.fromFilterBuilder<Contact>(
      supabase
        .from<Contact>("contact")
        .select(
          "id,username,ticket_number,golden_ticket,tags,country!inner(code,name,full_name)"
        )
        .or(`username.eq.unknown,and(ticket_number.eq.2,golden_ticket.is.true)`)
        .is("golden_ticket", true)
        .in("username", ["thorwebdev"])
        .contains("tags", ["supateam"])
        .or("name.eq.unknown,and(name.eq.Singapore,code.eq.SG)", {
          foreignTable: "country",
        })
    );
    console.log(
      filter.apply({
        id: "68d2e5ef-d117-4f0c-abc7-60891a643571",
        username: "thorwebdev",
        ticket_number: 2,
        golden_ticket: false,
        tags: ["supateam", "investor"],
        country: {
          code: "SG",
          name: "Singapore",
          full_name: "Republic of Singapore",
        },
      })
    ); // --> false
    console.log(
      filter.apply({
        id: "68d2e5ef-d117-4f0c-abc7-60891a643571",
        created_at: "2022-08-19T15:30:33.072441+00:00",
        username: "thorwebdev",
        ticket_number: 2,
        golden_ticket: true,
        tags: ["supateam", "investor"],
        age_range: "[0,100)",
        hello: "world",
        catchphrase: "'bat' 'cat'",
        country: {
          code: "SG",
          name: "Singapore",
          full_name: "Republic of Singapore",
        },
      })
    ); // --> true
    expect(true).toEqual(true);
  });

  it.each([
    [
      "or",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.or("username.eq.thorwebdev,username.eq.mrx"),
    ],
    [
      "or with nested and",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.or(
          `username.eq.unknown,and(ticket_number.eq.2,golden_ticket.is.true)`
        ),
    ],
    [
      "eq",
      (q: PostgrestFilterBuilder<Contact>) => q.eq("username", "thorwebdev"),
    ],
    [
      "not",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.not("golden_ticket", "is", true),
    ],
    ["neq", (q: PostgrestFilterBuilder<Contact>) => q.neq("country", "SG")],
    ["gt", (q: PostgrestFilterBuilder<Contact>) => q.gt("ticket_number", 50)],
    ["gte", (q: PostgrestFilterBuilder<Contact>) => q.gte("ticket_number", 8)],
    ["lt", (q: PostgrestFilterBuilder<Contact>) => q.lt("ticket_number", 1)],
    ["lte", (q: PostgrestFilterBuilder<Contact>) => q.lte("ticket_number", 0)],
    [
      "like",
      (q: PostgrestFilterBuilder<Contact>) => q.like("username", "%cop%"),
    ],
    [
      "ilike",
      (q: PostgrestFilterBuilder<Contact>) => q.ilike("username", "%COP%"),
    ],
    [
      "in",
      (q: PostgrestFilterBuilder<Contact>) => q.in("username", ["kiwicopple"]),
    ],
    [
      "is",
      (q: PostgrestFilterBuilder<Contact>) => q.is("golden_ticket", false),
    ],
    [
      "fts",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.textSearch("catchphrase", "fa:* & ca:*"),
    ],
    [
      "plfts",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.textSearch("catchphrase", "fat", { type: "plain" }),
    ],
    [
      "contains",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.contains("tags", ["supateam", "investor"]),
    ],
    [
      "containedBy",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.containedBy("tags", ["supateam", "investor"]),
    ],
    [
      "eq with json operator",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.eq("metadata->>hello" as any, "supabase"),
    ],
    [
      "or with foreignTable",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.or("name.eq.Germany,name.eq.Ghana", {
          foreignTable: "country",
        }),
    ],
    [
      "or with foreignTable and nested and",
      (q: PostgrestFilterBuilder<Contact>) =>
        q.or("name.eq.unknown,and(name.eq.Germany,code.eq.DE)", {
          foreignTable: "country",
        }),
    ],
  ])("%s", async (name, applyFilterQuery) => {
    const q = applyFilterQuery(query);
    const { data, error } = await q.single();
    console.log();
    expect(error).toEqual(null);
    expect(data).toBeTruthy();
    expect(
      PostgrestFilter.fromFilterBuilder<Contact>(q).apply(data as Contact)
    ).toEqual(true);
  });
});
