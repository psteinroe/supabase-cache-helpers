INSERT INTO public.contact (
        username,
        country,
        ticket_number,
        golden_ticket,
        tags,
        age_range,
        metadata,
        catchphrase
    )
VALUES (
        'psteinroe',
        'DE',
        0,
        FALSE,
        ARRAY ['hellomateo.de', 'supafan']::text [],
        '[20,30)'::int4range,
        jsonb_build_object('hello', 'world'),
        'fat cat'::tsvector
    ),
    (
        'kiwicopple',
        'SG',
        77,
        TRUE,
        ARRAY ['supateam', 'ceo']::text [],
        '[0,100)'::int4range,
        jsonb_build_object('hello', 'world'),
        'cat bat'::tsvector
    ),
    (
        'thorwebdev',
        'SG',
        2,
        TRUE,
        ARRAY ['supateam', 'investor']::text [],
        '[0,100)'::int4range,
        jsonb_build_object('hello', 'world'),
        'cat bat'::tsvector
    );
INSERT INTO public.contact_note (contact_id, text)
SELECT id,
    'hello world'
FROM public.contact;