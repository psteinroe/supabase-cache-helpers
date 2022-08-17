insert into public.contact (
        username,
        country,
        ticket_number,
        golden_ticket,
        tags,
        age_range,
        metadata,
        catchphrase
    )
values (
        'psteinroe',
        'DE',
        0,
        FALSE,
        ARRAY ['hellomateo.de', 'supafan']::text [],
        '[20,30)'::int4range,
        jsonb_build_object('hello', 'supabase'),
        'fat cat'::tsvector
    ),
    (
        'kiwicopple',
        'SG',
        77,
        true,
        ARRAY ['supateam', 'ceo']::text [],
        '[0,100)'::int4range,
        jsonb_build_object('hello', 'world'),
        'cat bat'::tsvector
    ),
    (
        'thorwebdev',
        'SG',
        2,
        true,
        ARRAY ['supateam', 'investor']::text [],
        '[0,100)'::int4range,
        jsonb_build_object('hello', 'world'),
        'cat bat'::tsvector
    );
insert into public.contact_note (contact_id, text)
select id,
    'hello world'
from public.contact;