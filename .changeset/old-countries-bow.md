---
"@supabase-cache-helpers/postgrest-filter": patch
"@supabase-cache-helpers/postgrest-mutate": patch
---

only mutate with pks only, if the key either does not fitler on pks, or the input matches all pk filters
