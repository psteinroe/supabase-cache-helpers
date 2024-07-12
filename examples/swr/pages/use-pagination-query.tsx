import { useInfiniteOffsetPaginationQuery } from "@supabase-cache-helpers/postgrest-swr";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Head from "next/head";
import { useCallback, useState } from "react";
import type { z } from "zod";

import {
  type UpsertContactFormData,
  UpsertContactModal,
  type continentEnumSchema,
} from "@/components/contact/upsert-contact.modal";
import { Layout } from "@/components/layout";
import { Code } from "@/components/typography/code";
import { H3 } from "@/components/typography/h3";
import { P } from "@/components/typography/p";
import { Small } from "@/components/typography/small";
import { Subtle } from "@/components/typography/subtle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

export default function UsePaginationQueryPage() {
  const supabase = useSupabaseClient<Database>();
  const { currentPage, previousPage, nextPage } =
    useInfiniteOffsetPaginationQuery(
      supabase
        .from("contact")
        .select("id,username,continent")
        .order("username")
        .returns<
          (Pick<
            Database["public"]["Tables"]["contact"]["Row"],
            "id" | "username"
          > & {
            continent: z.infer<typeof continentEnumSchema>;
          })[]
        >(),
      { revalidateOnFocus: false, pageSize: 5 },
    );

  const [upsertContact, setUpsertContact] = useState<
    UpsertContactFormData | boolean
  >(false);

  const handleClose = useCallback(
    () => setUpsertContact(false),
    [setUpsertContact],
  );

  const handleCreate = useCallback(
    () => setUpsertContact(true),
    [setUpsertContact],
  );

  return (
    <Layout>
      <Head>
        <title>usePaginationQuery</title>
        <meta
          name="description"
          content="The `usePaginationQuery` hook makes it easy to use a paginated supabase query."
        />
      </Head>
      <UpsertContactModal
        open={Boolean(upsertContact)}
        contact={typeof upsertContact !== "boolean" ? upsertContact : null}
        onClose={handleClose}
      />
      <div className="container mx-auto">
        <H3>usePaginationQuery</H3>
        <P>
          The <Code>usePaginationQuery</Code> hook makes it easy to use a
          paginated supabase query. It returns helpers such as{" "}
          <Code>previousPage</Code>, <Code>nextPage</Code> and{" "}
          <Code>currentPage</Code>. This example queries all contacts ordered by{" "}
          <Code>username</Code>. Try to update an existing or create a new
          contact and watch how the list is updated instantly. Note that
          subscriptions are enabled too, and you will see other peoples changes
          instantly reflected here.
        </P>
        <div className="flex flex-row items-center justify-end py-8">
          <Button onClick={handleCreate} variant="default">
            Create Contact
          </Button>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {(currentPage ?? []).map((contact) => (
            <li key={contact.id} className="py-4 px-2">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={null} alt={contact.username} />
                  <AvatarFallback>
                    {contact.username.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Small>{contact.username}</Small>
                  <Subtle>{contact.continent}</Subtle>
                </div>
                <div>
                  <Button
                    onClick={() => setUpsertContact(contact)}
                    variant="outline"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex w-full flex-row justify-center gap-x-2">
          <Button
            onClick={previousPage}
            disabled={!previousPage}
            variant="default"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Page
          </Button>
          <Button onClick={nextPage} disabled={!nextPage} variant="default">
            <ArrowRight className="mr-2 h-4 w-4" />
            Next Page
          </Button>
        </div>
      </div>
    </Layout>
  );
}
