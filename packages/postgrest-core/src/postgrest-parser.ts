import type { PostgrestBuilder } from '@supabase/postgrest-js';

import { encodeObject } from './lib/encode-object';
import { isObject } from './lib/is-object';
import { parseOrderBy } from './lib/parse-order-by';
import type { OrderDefinition } from './lib/query-types';
import { sortSearchParams } from './lib/sort-search-param';
import {
  PostgrestQueryParser,
  type PostgrestQueryParserOptions,
} from './postgrest-query-parser';

export class PostgrestParser<Result> extends PostgrestQueryParser {
  private readonly _url: URL;
  private readonly _headers: { [key: string]: string };
  private readonly _body: object | undefined;
  private readonly _method: 'GET' | 'HEAD' | 'POST' | 'PATCH' | 'DELETE';

  public readonly queryKey: string;
  public readonly bodyKey: string | undefined;
  public readonly count: string | null;
  public readonly schema: string;
  public readonly table: string;
  public readonly isHead: boolean | undefined;
  public readonly limit: number | undefined;
  public readonly offset: number | undefined;
  public readonly orderBy: OrderDefinition[] = [];
  public readonly orderByKey: string;

  constructor(
    fb: PostgrestBuilder<Result>,
    public readonly opts?: PostgrestQueryParserOptions,
  ) {
    super(new URL(fb['url']).searchParams.toString(), opts);

    this._url = new URL(fb['url']);
    this._headers = { ...fb['headers'] };
    this._body = isObject(fb['body']) ? { ...fb['body'] } : undefined;
    this._method = fb['method'];

    this.queryKey = sortSearchParams(this._url.searchParams).toString();

    this.table = (this._url.toString().split('/rest/v1/').pop() as string)
      .split('?')
      .shift() as string;

    if (this._body) {
      this.bodyKey = encodeObject(this._body as Record<string, unknown>);
    }

    // 'Prefer': return=minimal|representation,count=exact|planned|estimated
    const preferHeaders: Record<string, string> = (
      this._headers['Prefer'] ?? ''
    )
      .split(',')
      .reduce<Record<string, string>>((prev, curr) => {
        const s = curr.split('=');
        return {
          ...prev,
          [s[0]]: s[1],
        };
      }, {});
    this.count = preferHeaders['count'] ?? null;

    this.schema = fb['schema'] as string;

    this.isHead = this._method === 'HEAD';

    const limit = this._url.searchParams.get('limit');
    this.limit = limit ? Number(limit) : undefined;
    const offset = this._url.searchParams.get('offset');
    this.offset = offset ? Number(offset) : undefined;

    this.orderBy = parseOrderBy(this._url.searchParams);
    this.orderByKey = this.orderBy
      .map(
        ({ column, ascending, nullsFirst, foreignTable }) =>
          `${foreignTable ? `${foreignTable}.` : ''}${column}:${
            ascending ? 'asc' : 'desc'
          }.${nullsFirst ? 'nullsFirst' : 'nullsLast'}`,
      )
      .join('|');
  }
}
