import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type { Database } from "./database.types";
import { resolve } from "node:path";

import * as dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

import { PostgrestFilter, PostgrestQueryParser } from "../src";

const TEST_PREFIX = "postgrest-filter-psotgrest-filter";

describe("postgrest-filter-fn", () => {
  let supabase: SupabaseClient<Database>;
  let testRunPrefix: string;
  let contacts: Database["public"]["Tables"]["contact"]["Row"][];

  beforeAll(async () => {
    testRunPrefix = `${TEST_PREFIX}-${Math.floor(Math.random() * 100)}`;
    supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );
    await supabase
      .from("contact")
      .delete()
      .ilike("username", `${TEST_PREFIX}%`);

    const { data } = await supabase
      .from("contact")
      .insert([
        {
          username: `${testRunPrefix}-username-1`,
          country: "DE",
          ticket_number: 0,
          golden_ticket: false,
          tags: ["hellomateo.de", "supafan"],
          metadata: { hello: "supabase" },
          catchphrase: "fat cat",
        },
        {
          username: `${testRunPrefix}-username-2`,
          country: "SG",
          ticket_number: 77,
          golden_ticket: true,
          tags: ["supateam", "ceo"],
          metadata: { hello: "world" },
          catchphrase: "cat bat",
        },
        {
          username: `${testRunPrefix}-username-3`,
          country: "SG",
          ticket_number: 2,
          golden_ticket: true,
          tags: ["supateam", "investor"],
          metadata: { hello: "world", array: [{ value: "a" }, { value: "b" }] },
          catchphrase: "cat bat",
        },
      ])
      .select("*")
      .throwOnError();
    contacts = data ?? [];
    expect(contacts).toHaveLength(3);
  });
  let query: PostgrestFilterBuilder<
    Database["public"],
    Database["public"]["Tables"]["contact"]["Row"],
    any
  >;
  beforeEach(() => {
    query = supabase
      .from("contact")
      .select(
        "id,created_at,username,ticket_number,golden_ticket,tags,age_range,metadata,hello:metadata->>hello,catchphrase,country!inner(code,mapped_name:name,full_name)"
      );
  });

  it.each([
    [
      "or",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.or(`username.eq.${testRunPrefix}-username-1,username.eq.mrx`),
    ],
    [
      "or with nested and",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
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
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.eq("username", `${testRunPrefix}-username-2`),
    ],
    [
      "not",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.not("golden_ticket", "is", true),
    ],
    [
      "neq",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.neq("country", "SG"),
    ],
    [
      "gt",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.gt("ticket_number", 50),
    ],
    [
      "gte",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.gte("ticket_number", 8),
    ],
    [
      "lt",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.lt("ticket_number", 1),
    ],
    [
      "lte",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.lte("ticket_number", 0),
    ],
    [
      "like",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.like("username", `%-username-1`),
    ],
    [
      "ilike",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.ilike("username", `%-USERNAME-1`),
    ],
    [
      "in",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.in("username", [`${testRunPrefix}-username-1`]),
    ],
    [
      "is",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.is("golden_ticket", false),
    ],
    [
      "fts",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.textSearch("catchphrase", "fa:* & ca:*"),
    ],
    [
      "plfts",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.textSearch("catchphrase", "fat", { type: "plain" }),
    ],
    [
      "contains",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.contains("tags", ["supateam", "investor"]),
    ],
    [
      "contains with json",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.contains("metadata->array", JSON.stringify([{ value: "a" }])),
    ],
    [
      "containedBy",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.containedBy("tags", ["supateam", "investor"]),
    ],
    [
      "eq with json operator",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.eq("metadata->>hello" as any, "supabase"),
    ],
    [
      "eq with nested json array operator",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.eq("metadata->array->0->>value" as any, "a"),
    ],
    [
      "or with foreignTable",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) =>
        q.or("name.eq.Germany,name.eq.Ghana", {
          foreignTable: "country",
        }),
    ],
    [
      "or with contains and json",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
          Database["public"]["Tables"]["contact"]["Row"],
          any
        >
      ) => q.or(`metadata->array.cs.[{"value": "b"}]`),
    ],
    [
      "or with foreignTable and nested and",
      (
        q: PostgrestFilterBuilder<
          Database["public"],
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
    const { data, error } = await q
      .ilike("username", `${testRunPrefix}%`)
      .single();
    expect(error).toEqual(null);
    expect(data).toBeTruthy();
    expect(
      PostgrestFilter.fromFilterBuilder<
        Database["public"],
        Database["public"]["Tables"]["contact"]["Row"],
        any
      >(q).apply(data)
    ).toEqual(true);
  });
});
