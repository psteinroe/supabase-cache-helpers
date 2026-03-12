import { PostgrestQueryParser } from '../src/postgrest-query-parser';
import { describe, expect, it } from 'vitest';

describe('PostgrestQueryParser', () => {
  it('should parse or filters with array literals (ov operator)', () => {
    const result = new PostgrestQueryParser(
      'or=(gallery_external_system_types.is.null,gallery_external_system_types.ov.{euronet_v1,fee_v1})&select=id',
    ).filters;
    expect(result).toEqual([
      {
        or: [
          {
            alias: undefined,
            negate: false,
            operator: 'is',
            path: 'gallery_external_system_types',
            value: null,
          },
          {
            alias: undefined,
            negate: false,
            operator: 'ov',
            path: 'gallery_external_system_types',
            value: '{euronet_v1,fee_v1}',
          },
        ],
      },
    ]);
  });

  it('should parse or filters with nested and containing array literals', () => {
    const result = new PostgrestQueryParser(
      'or=(col.is.null,and(col.ov.{a,b},col2.eq.1))&select=id',
    ).filters;
    expect(result).toEqual([
      {
        or: [
          {
            alias: undefined,
            negate: false,
            operator: 'is',
            path: 'col',
            value: null,
          },
          {
            and: [
              {
                alias: undefined,
                negate: false,
                operator: 'ov',
                path: 'col',
                value: '{a,b}',
              },
              {
                alias: undefined,
                negate: false,
                operator: 'eq',
                path: 'col2',
                value: 1,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('should work if the column has the name as the operator', () => {
    expect(
      new PostgrestQueryParser(
        'fts=fts.12%3A*&limit=50&offset=0&order=name.asc&organisation_id=eq.7ffe8eab-8e99-4b63-be2d-a418d4cb767b&select=id%2Cname%2Cwhatsapp_status%2Ctype%2Crequest_approvals%2Clanguage%28name%29%2Ctext%2Cupdated_at%2Cprovider_template_approval%28status%2Ccategory%29',
      ).filters,
    ).toEqual([
      {
        alias: undefined,
        negate: false,
        operator: 'fts',
        path: 'fts',
        value: '12:*',
      },
      {
        alias: undefined,
        negate: false,
        operator: 'eq',
        path: 'organisation_id',
        value: '7ffe8eab-8e99-4b63-be2d-a418d4cb767b',
      },
    ]);
  });
});
