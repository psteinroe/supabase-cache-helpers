import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { Database } from "@supabase-cache-helpers/shared";
import { resolve } from "node:path";

import * as dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

import { PostgrestFilter } from "../src";
describe("postgrest-filter-fn", () => {
  let supabase: SupabaseClient<Database>;

  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
  });

  let query: PostgrestFilterBuilder<
    Database["public"]["Tables"]["contact"]["Row"],
    any
  >;
  beforeEach(() => {
    query = supabase
      .from("contact")
      .select(
        "id,created_at,username,ticket_number,golden_ticket,tags,age_range,hello:metadata->>hello,catchphrase,country!inner(code,mapped_name:name,full_name)"
      );
  });

  it.each([
    [
      "or",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.or("username.eq.thorwebdev,username.eq.mrx"),
    ],
    [
      "or with nested and",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) =>
        q.or(
          `username.eq.unknown,and(ticket_number.eq.2,golden_ticket.is.true)`
        ),
    ],
    [
      "eq",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.eq("username", "thorwebdev"),
    ],
    [
      "not",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.not("golden_ticket", "is", true),
    ],
    [
      "neq",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.neq("country", "SG"),
    ],
    [
      "gt",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.gt("ticket_number", 50),
    ],
    [
      "gte",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.gte("ticket_number", 8),
    ],
    [
      "lt",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.lt("ticket_number", 1),
    ],
    [
      "lte",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.lte("ticket_number", 0),
    ],
    [
      "like",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.like("username", "%cop%"),
    ],
    [
      "ilike",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.ilike("username", "%COP%"),
    ],
    [
      "in",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.in("username", ["kiwicopple"]),
    ],
    [
      "is",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.is("golden_ticket", false),
    ],
    [
      "fts",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.textSearch("catchphrase", "fa:* & ca:*"),
    ],
    [
      "plfts",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.textSearch("catchphrase", "fat", { type: "plain" }),
    ],
    [
      "contains",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.contains("tags", ["supateam", "investor"]),
    ],
    [
      "containedBy",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.containedBy("tags", ["supateam", "investor"]),
    ],
    [
      "eq with json operator",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.eq("metadata->>hello" as any, "supabase"),
    ],
    [
      "or with foreignTable",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) =>
        q.or("name.eq.Germany,name.eq.Ghana", {
          foreignTable: "country",
        }),
    ],
    [
      "or with foreignTable and nested and",
      (
        q: PostgrestFilterBuilder<
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) =>
        q.or("name.eq.unknown,and(name.eq.Germany,code.eq.DE)", {
          foreignTable: "country",
        }),
    ],
  ])("%s", async (name, applyFilterQuery) => {
    const q = applyFilterQuery(query);
    const { data, error } = await q.single();
    console.log(data);
    expect(error).toEqual(undefined);
    expect(data).toBeTruthy();
    expect(
      PostgrestFilter.fromFilterBuilder<
        Database["public"]["Tables"]["contact"]["Row"],
        any
      >(q).apply(data)
    ).toEqual(true);
  });
});
