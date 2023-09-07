import { buildSelectStatement } from '../../../src/fetch/lib/build-select-statement';

describe('buildSelectStatement', () => {
  it('should build nested paths correctly', () => {
    expect(
      buildSelectStatement([
        { alias: undefined, path: 'name', declaration: 'name' },
        { alias: undefined, path: 'prop2', declaration: 'prop2' },
        { alias: undefined, path: 'prop3', declaration: 'prop3' },
        {
          alias: 'city.test',
          path: 'cities.name',
          declaration: 'city:cities.test:name',
        },
        {
          alias: undefined,
          path: 'countries.capital',
          declaration: 'countries.capital',
        },
        {
          alias: undefined,
          path: 'countries.population',
          declaration: 'countries.population',
        },
        {
          alias: 'countries.some_ref.test',
          path: 'countries.some_ref.first',
          declaration: 'countries.some_ref.test:first',
        },
        {
          alias: undefined,
          path: 'countries.some_ref.second',
          declaration: 'countries.some_ref.second',
        },
        {
          alias: 'alias.prop',
          path: 'test.prop',
          declaration: 'alias:test.prop',
        },
      ])
    ).toEqual(
      'name,prop2,prop3,city:cities(test:name),countries(capital,population,some_ref(test:first,second)),alias:test(prop)'
    );
  });

  it('should work for inner joins', () => {
    expect(
      buildSelectStatement([
        {
          alias: undefined,
          path: 'name',
          declaration: 'name',
        },
        {
          alias: 'alias.test',
          path: 'organisation.name',
          declaration: 'organisation!contact_organisation_id_fkey!inner.name',
        },
      ])
    ).toEqual(
      'name,organisation!contact_organisation_id_fkey!inner(test:name)'
    );
  });

  it('should work for json operators', () => {
    expect(
      buildSelectStatement([
        { alias: 'field', path: 'name->nested', declaration: 'name->nested' },
      ])
    ).toEqual('field:name->nested');
  });
});
