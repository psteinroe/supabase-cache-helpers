import { describe, expect, it } from 'vitest';
import { getMutableKeys } from '../../src/lib/mutable-keys';

describe('getMutableKeys', () => {
  it('should return correct keys', () => {
    expect(
      getMutableKeys([
        '$inf$postgrest$page$public$contact$limit=1&offset=0&order=username.asc&select=id%2Cusername&username=ilike.postgrest-swr-pagination-88%25$null$count=null$head=false$undefined.username:asc.nullsLast',
        'postgrest$page$public$contact$limit=1&offset=0&order=username.asc&select=id%2Cusername&username=ilike.postgrest-swr-pagination-88%25$null$count=null$head=false$undefined.username:asc.nullsLast',
        'postgrest$page$public$contact$limit=1&offset=1&order=username.asc&select=id%2Cusername&username=ilike.postgrest-swr-pagination-88%25$null$count=null$head=false$undefined.username:asc.nullsLast',
        'postgrest$page$public$contact$limit=1&offset=2&order=username.asc&select=id%2Cusername&username=ilike.postgrest-swr-pagination-88%25$null$count=null$head=false$undefined.username:asc.nullsLast',
      ]),
    ).toEqual([
      '$inf$postgrest$page$public$contact$limit=1&offset=0&order=username.asc&select=id%2Cusername&username=ilike.postgrest-swr-pagination-88%25$null$count=null$head=false$undefined.username:asc.nullsLast',
    ]);
  });
});
