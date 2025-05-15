create or replace function public.contacts_offset(
    v_limit integer default 50,
    v_offset integer default 0,
    v_username_filter text default null
) returns setof public.contact
as $$
select * from public.contact
where (v_username_filter is null or username ilike v_username_filter)
order by username, id
limit v_limit offset v_offset;
$$ language sql stable set search_path = '';

create or replace function public.contacts_cursor(
    v_username_cursor text default null,
    v_id_cursor uuid default null,
    v_username_filter text default null,
    v_limit integer default 50
) returns setof public.contact
as $$
select * from public.contact
where
    (v_username_cursor is null or (username > v_username_cursor or (username = v_username_cursor and id > v_id_cursor))) and
    (v_username_filter is null or username ilike v_username_filter)
order by username, id
limit v_limit;
$$ language sql stable set search_path = '';


create or replace function public.contacts_cursor_id_only(
    v_id_cursor uuid default null,
    v_username_filter text default null,
    v_limit integer default 50
) returns setof public.contact
as $$
select * from public.contact
where
    (v_id_cursor is null or (id < v_id_cursor)) and
    (v_username_filter is null or username ilike v_username_filter)
order by id desc
limit v_limit;
$$ language sql stable set search_path = '';

