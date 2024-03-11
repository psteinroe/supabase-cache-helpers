alter table public.contact_note add column created_by_contact_id uuid references public.contact on delete set null;
alter table public.contact_note add column updated_by_contact_id uuid references public.contact on delete set null;
