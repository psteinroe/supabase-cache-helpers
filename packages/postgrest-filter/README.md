## PostgREST Filter

When an insert returns data, it does not have mapped paths. For the filter, we need to add a transformer that checks if the paths exists and transform into alias before applying.
