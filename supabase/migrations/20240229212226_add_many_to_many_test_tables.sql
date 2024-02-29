create table "public"."address_book" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" character varying
);


create table "public"."address_book_contact" (
    "contact" uuid not null,
    "address_book" uuid not null
);

CREATE UNIQUE INDEX address_book_contact_pkey ON public.address_book_contact USING btree (contact, address_book);

CREATE UNIQUE INDEX address_book_pkey ON public.address_book USING btree (id);

alter table "public"."address_book" add constraint "address_book_pkey" PRIMARY KEY using index "address_book_pkey";

alter table "public"."address_book_contact" add constraint "address_book_contact_pkey" PRIMARY KEY using index "address_book_contact_pkey";

alter table "public"."address_book_contact" add constraint "address_book_contact_address_book_fkey" FOREIGN KEY (address_book) REFERENCES address_book(id) not valid;

alter table "public"."address_book_contact" validate constraint "address_book_contact_address_book_fkey";

alter table "public"."address_book_contact" add constraint "address_book_contact_contact_fkey" FOREIGN KEY (contact) REFERENCES contact(id) not valid;

alter table "public"."address_book_contact" validate constraint "address_book_contact_contact_fkey";
