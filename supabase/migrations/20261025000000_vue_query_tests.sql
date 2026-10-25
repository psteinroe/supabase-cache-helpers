-- Dedicated local integration fixtures; never use the service role in composables.
create table public.vue_query_projects (
    id integer primary key,
    owner_id uuid not null references auth.users(id) on delete cascade,
    name text not null
);

create table public.vue_query_tasks (
    id integer primary key,
    owner_id uuid not null references auth.users(id) on delete cascade,
    project_id integer not null references public.vue_query_projects(id) on delete cascade,
    title text not null,
    active boolean not null default true,
    rank integer not null
);

alter table public.vue_query_projects enable row level security;
alter table public.vue_query_tasks enable row level security;
grant select, insert, update, delete on public.vue_query_projects, public.vue_query_tasks to anon, authenticated;
grant all on public.vue_query_projects, public.vue_query_tasks to service_role;

create policy projects_owned on public.vue_query_projects
    for all to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

create policy tasks_read_owned on public.vue_query_tasks
    for select to authenticated using (owner_id = (select auth.uid()));
create policy tasks_insert_owned on public.vue_query_tasks
    for insert to authenticated with check (
        owner_id = (select auth.uid()) and exists (
            select 1 from public.vue_query_projects p
            where p.id = project_id and p.owner_id = (select auth.uid())
        )
    );
create policy tasks_update_owned on public.vue_query_tasks
    for update to authenticated using (owner_id = (select auth.uid()))
    with check (
        owner_id = (select auth.uid()) and exists (
            select 1 from public.vue_query_projects p
            where p.id = project_id and p.owner_id = (select auth.uid())
        )
    );
create policy tasks_delete_owned on public.vue_query_tasks
    for delete to authenticated using (owner_id = (select auth.uid()));
