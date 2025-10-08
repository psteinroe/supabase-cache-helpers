create or replace function public.boolean_return() returns boolean
as $$
select false;
$$ language sql stable set search_path = '';

