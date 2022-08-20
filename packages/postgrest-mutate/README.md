
# PostgREST Mutate

This submodule provides convenience helpers for mutating data. It is not meant to be used standalone.

## Limitations
- insert does not respect ordering and simply prepends the input
- insert does not respect page sizes in paginated queries
