import { createClient } from '@supabase/supabase-js';
import { flatten } from 'flat';

import { PostgrestFilter } from '../src/postgrest-filter';
import { PostgrestParser } from '../src/postgrest-parser';

const MOCK = {
  id: 1,
  text: 'some-text',
  array: ['element-1', 'element-2'],
  empty_array: [],
  null_value: null,
  array_of_objects: [
    { some: { value: 'value' } },
    { some: { value: 'value' } },
  ],
  invalid_array_of_objects: [
    { some: { value: 'value' } },
    { some: { other: 'value' } },
  ],
  date: new Date().toISOString(),
  boolean: false,
  some: {
    nested: {
      value: 'test',
      array: [{ type: 'a' }, { type: 'b' }],
    },
  },
};

describe('PostgrestFilter', () => {
  it('should create from query', () => {
    expect(
      PostgrestFilter.fromQuery(
        new PostgrestParser(
          createClient('https://localhost', 'test')
            .from('contact')
            .select('username')
            .eq('username', 'test')
        ).queryKey
      ).apply({ username: 'test' })
    ).toEqual(true);
  });

  describe('.transform', () => {
    it('should transform within arrays', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  alias: undefined,
                  negate: false,
                  operator: 'eq',
                  path: 'id',
                  value: '846beb37-f4ca-4995-951e-067412e09095',
                },
              ],
            },
          ],
          paths: [
            { declaration: 'id', alias: undefined, path: 'id' },
            { declaration: 'status', alias: undefined, path: 'status' },
            { declaration: 'unread', alias: undefined, path: 'unread' },
            { declaration: 'tag.id', alias: undefined, path: 'tag.id' },
            {
              declaration: 'tag.name',
              alias: undefined,
              path: 'tag.name',
            },
            {
              declaration: 'tag.color',
              alias: undefined,
              path: 'tag.color',
            },
          ],
        }).denormalize({
          id: '846beb37-f4ca-4995-951e-067412e09095',
          unread: false,
          'tag.0.id': '046beb37-f4ca-4995-951e-067412e09095',
          'tag.0.name': 'one',
          'tag.0.color': 'red',
          'tag.1.id': '146beb37-f4ca-4995-951e-067412e09095',
          'tag.1.name': 'two',
          'tag.1.color': 'blue',
        })
      ).toEqual({
        id: '846beb37-f4ca-4995-951e-067412e09095',
        unread: false,
        tag: [
          {
            id: '046beb37-f4ca-4995-951e-067412e09095',
            name: 'one',
            color: 'red',
          },
          {
            id: '146beb37-f4ca-4995-951e-067412e09095',
            name: 'two',
            color: 'blue',
          },
        ],
      });
    });

    it('should transform nested aliases within arrays', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  alias: undefined,
                  negate: false,
                  operator: 'eq',
                  path: 'id',
                  value: '846beb37-f4ca-4995-951e-067412e09095',
                },
              ],
            },
          ],
          paths: [
            { declaration: 'id', alias: undefined, path: 'id' },
            { declaration: 'status', alias: undefined, path: 'status' },
            { declaration: 'unread', alias: undefined, path: 'unread' },
            { declaration: 'tags:tag.id', alias: 'tags.id', path: 'tag.id' },
            {
              declaration: 'tags:tag.display_name:name',
              alias: 'tags.display_name',
              path: 'tag.name',
            },
            {
              declaration: 'tags:tag.color',
              alias: 'tags.color',
              path: 'tag.color',
            },
          ],
        }).denormalize({
          id: '846beb37-f4ca-4995-951e-067412e09095',
          unread: false,
          'tag.0.id': '046beb37-f4ca-4995-951e-067412e09095',
          'tag.0.name': 'one',
          'tag.0.color': 'red',
          'tag.1.id': '146beb37-f4ca-4995-951e-067412e09095',
          'tag.1.name': 'two',
          'tag.1.color': 'blue',
        })
      ).toEqual({
        id: '846beb37-f4ca-4995-951e-067412e09095',
        unread: false,
        tags: [
          {
            id: '046beb37-f4ca-4995-951e-067412e09095',
            display_name: 'one',
            color: 'red',
          },
          {
            id: '146beb37-f4ca-4995-951e-067412e09095',
            display_name: 'two',
            color: 'blue',
          },
        ],
      });
    });
    it('should transform nested aliases', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  alias: undefined,
                  negate: false,
                  operator: 'eq',
                  path: 'id',
                  value: '846beb37-f4ca-4995-951e-067412e09095',
                },
              ],
            },
          ],
          paths: [
            { declaration: 'id', alias: undefined, path: 'id' },
            { declaration: 'status', alias: undefined, path: 'status' },
            { declaration: 'unread', alias: undefined, path: 'unread' },
            {
              declaration: 'recipient:recipient_id.id',
              alias: 'recipient.id',
              path: 'recipient_id.id',
            },
            {
              declaration: 'recipient:recipient_id.display_name:full_name',
              alias: 'recipient.display_name',
              path: 'recipient_id.full_name',
            },
          ],
        }).denormalize({
          id: '846beb37-f4ca-4995-951e-067412e09095',
          unread: false,
          'recipient_id.id': '046beb37-f4ca-4995-951e-067412e09095',
          'recipient_id.full_name': 'test',
        })
      ).toEqual({
        id: '846beb37-f4ca-4995-951e-067412e09095',
        unread: false,
        recipient: {
          id: '046beb37-f4ca-4995-951e-067412e09095',
          display_name: 'test',
        },
      });
    });
    it('should ignore undefined values', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  alias: undefined,
                  negate: false,
                  operator: 'eq',
                  path: 'id',
                  value: '846beb37-f4ca-4995-951e-067412e09095',
                },
              ],
            },
          ],
          paths: [
            { declaration: 'id', alias: undefined, path: 'id' },
            { declaration: 'status', alias: undefined, path: 'status' },
            { declaration: 'unread', alias: undefined, path: 'unread' },
            {
              declaration: 'recipient:recipient_id.id',
              alias: 'recipient.id',
              path: 'recipient_id.id',
            },
            {
              declaration: 'recipient:recipient_id.contact_id',
              alias: 'recipient.contact_id',
              path: 'recipient_id.contact_id',
            },
            {
              declaration: 'recipient:recipient_id.full_name',
              alias: 'recipient.full_name',
              path: 'recipient_id.full_name',
            },
            {
              declaration: 'recipient:recipient_id.handle',
              alias: 'recipient.handle',
              path: 'recipient_id.handle',
            },
            { declaration: 'tags:tag.id', alias: 'tags.id', path: 'tag.id' },
            {
              declaration: 'tags:tag.name',
              alias: 'tags.name',
              path: 'tag.name',
            },
            {
              declaration: 'tags:tag.color',
              alias: 'tags.color',
              path: 'tag.color',
            },
            {
              declaration: 'channel:channel_id.id',
              alias: 'channel.id',
              path: 'channel_id.id',
            },
            {
              declaration: 'channel:channel_id.active',
              alias: 'channel.active',
              path: 'channel_id.active',
            },
            {
              declaration: 'channel:channel_id.name',
              alias: 'channel.name',
              path: 'channel_id.name',
            },
            {
              declaration: 'channel:channel_id.provider_id',
              alias: 'channel.provider_id',
              path: 'channel_id.provider_id',
            },
            {
              declaration: 'inbox:inbox_id.id',
              alias: 'inbox.id',
              path: 'inbox_id.id',
            },
            {
              declaration: 'inbox:inbox_id.name',
              alias: 'inbox.name',
              path: 'inbox_id.name',
            },
            {
              declaration: 'assignee:assignee_id.id',
              alias: 'assignee.id',
              path: 'assignee_id.id',
            },
            {
              alias: 'assignee.display_name',
              declaration: 'assignee:assignee_id.display_name',
              path: 'assignee_id.display_name',
            },
          ],
        }).denormalize({
          id: '846beb37-f4ca-4995-951e-067412e09095',
          unread: false,
        })
      ).toEqual({
        id: '846beb37-f4ca-4995-951e-067412e09095',
        unread: false,
      });
    });
    it('should transform correctly', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'some_other_path',
                  alias: 'text',
                  negate: false,
                  operator: 'eq',
                  value: 'some-text',
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text', alias: 'alias' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).denormalize({
          id: 1,
          text: 'some-text',
          'array.0': 'element-1',
          'array.1': 'element-2',
          empty_array: [],
          null_value: null,
          'array_of_objects.0.some.value': 'value',
          'array_of_objects.1.some.value': 'value',
          'invalid_array_of_objects.0.some.value': 'value',
          'invalid_array_of_objects.1.some.other': 'value',
          date: '2023-09-11T17:17:51.457Z',
          boolean: false,
          'some.nested.value': 'test',
          'some.nested.array.0.type': 'a',
          'some.nested.array.1.type': 'b',
        })
      ).toEqual({
        array: ['element-1', 'element-2'],
        some: {
          nested: {
            value: 'test',
          },
        },
        alias: 'some-text',
      });
    });
  });

  describe('.hasPaths', () => {
    it('with null value for object', () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: 'null_value.value', declaration: 'null_value.value' },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it('with empty array', () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: 'empty_array.value', declaration: 'empty_array.value' },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it('with valid array of objects with json path', () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            {
              path: 'array_of_objects.some->>value',
              declaration: 'array_of_objects.some->>value',
            },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it('with valid array of objects', () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            {
              path: 'array_of_objects.some.value',
              declaration: 'array_of_objects.some.value',
            },
          ],
        }).hasPaths(MOCK)
      ).toEqual(true);
    });

    it('with invalid array of objects', () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            {
              path: 'invalid_array_of_objects.some.value',
              declaration: 'invalid_array_of_objects.some.value',
            },
          ],
        }).hasPaths(MOCK)
      ).toEqual(false);
    });
  });

  describe('.hasFiltersOnPaths', () => {
    it('should return false if there is no filter on the given paths', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'some_other_path',
                  alias: 'text',
                  negate: false,
                  operator: 'eq',
                  value: 'some-text',
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).hasFiltersOnPaths(['some_path', 'some_unexisting_path'])
      ).toEqual(false);
    });
    it('should return true if any path is included', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'id',
                  alias: undefined,
                  negate: false,
                  operator: 'eq',
                  value: 1,
                },
                {
                  path: 'some_other_path',
                  alias: 'text',
                  negate: false,
                  operator: 'eq',
                  value: 'some-text',
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).hasFiltersOnPaths(['some_unexisting_path', 'id'])
      ).toEqual(true);
    });
  });

  describe('.applyFiltersOnPaths', () => {
    it('with and', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              and: [
                {
                  path: 'some_other_path',
                  alias: 'text',
                  negate: false,
                  operator: 'eq',
                  value: 'some-text',
                },
                {
                  path: 'id',
                  negate: false,
                  operator: 'eq',
                  value: 5,
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).applyFiltersOnPaths(MOCK, ['some_other_path'])
      ).toEqual(true);
    });
    it('with or', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'some_other_path',
                  alias: 'text',
                  negate: false,
                  operator: 'eq',
                  value: 'some-text-123',
                },

                {
                  path: 'id',
                  negate: false,
                  operator: 'eq',
                  value: 1,
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).applyFiltersOnPaths(MOCK, ['some_other_path'])
      ).toEqual(false);
    });
  });

  describe('.apply', () => {
    it('with alias', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'some_other_path',
                  alias: 'text',
                  negate: false,
                  operator: 'eq',
                  value: 'some-text',
                },
                {
                  path: 'id',
                  negate: false,
                  operator: 'eq',
                  value: 5,
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it('or', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'id',
                  negate: false,
                  operator: 'eq',
                  value: 5,
                },
                {
                  path: 'id',
                  negate: false,
                  operator: 'eq',
                  value: 1,
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it('or with nested value and undefined path', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'cities.name',
                  negate: false,
                  operator: 'eq',
                  value: 'Paris',
                },
                {
                  path: 'some.nested.value',
                  negate: false,
                  operator: 'eq',
                  value: 't',
                },
                {
                  path: 'some.nested.value',
                  negate: false,
                  operator: 'eq',
                  value: 'test',
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it('or with nested and', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: 'id',
                  negate: false,
                  operator: 'eq',
                  value: 20,
                },
                {
                  and: [
                    {
                      path: 'text',
                      negate: false,
                      operator: 'eq',
                      value: 'some-text',
                    },
                    {
                      path: 'id',
                      negate: false,
                      operator: 'eq',
                      value: 1,
                    },
                  ],
                },
              ],
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it('negate', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: 'id',
              negate: true,
              operator: 'eq',
              value: 123,
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it('array values', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: 'text',
              negate: false,
              operator: 'in',
              value: '(element-1,some-text,element-3)',
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it('boolean values', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: 'boolean',
              negate: false,
              operator: 'is',
              value: false,
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it('json operator', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: 'some->nested->>value',
              negate: false,
              operator: 'eq',
              value: 'test',
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it('date values', () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: 'date',
              negate: false,
              operator: 'lt',
              value: new Date(),
            },
          ],
          paths: [
            { path: 'text', declaration: 'text' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it('should return false if selected value is not present', () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: 'does_not_exist', declaration: 'does_not_exist' },
            { path: 'array', declaration: 'array' },
            { path: 'some.nested.value', declaration: 'some.nested.value' },
          ],
        }).apply(MOCK)
      ).toEqual(false);
    });

    it('should throw if operator is not supported', () => {
      expect.assertions(1);
      try {
        new PostgrestFilter({
          filters: [
            {
              path: 'test',
              negate: false,
              operator: 'unknown' as any,
              value: 'value',
            },
          ],
          paths: [],
        }).apply(MOCK);
      } catch (err) {
        expect(err).toEqual(
          Error(
            `Unable to build filter function for ${JSON.stringify({
              path: 'test',
              negate: false,
              operator: 'unknown',
              value: 'value',
            })}. Operator unknown is not supported.`
          )
        );
      }
    });
  });
});
