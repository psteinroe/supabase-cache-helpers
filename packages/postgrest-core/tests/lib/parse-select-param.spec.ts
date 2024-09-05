import { describe, expect, it } from 'vitest';
import { parseSelectParam } from '../../src/lib/parse-select-param';

describe('parseSelectParam', () => {
  it('should parse aggregates', () => {
    expect(parseSelectParam('amount.sum()')).toEqual([
      {
        alias: undefined,
        declaration: 'amount.sum()',
        path: 'amount',
        aggregate: 'sum',
      },
    ]);
  });

  it('should parse multiple aggregates with grouping', () => {
    expect(parseSelectParam('amount.sum(),amount.avg(),order_date')).toEqual([
      {
        alias: undefined,
        declaration: 'amount.sum()',
        path: 'amount',
        aggregate: 'sum',
      },
      {
        alias: undefined,
        declaration: 'amount.avg()',
        path: 'amount',
        aggregate: 'avg',
      },
      {
        alias: undefined,
        declaration: 'order_date',
        path: 'order_date',
      },
    ]);
  });

  it('should parse aggregates with alias', () => {
    expect(
      parseSelectParam('amount.sum(),alias:amount.avg(),order_date'),
    ).toEqual([
      {
        alias: undefined,
        declaration: 'amount.sum()',
        path: 'amount',
        aggregate: 'sum',
      },
      {
        alias: 'alias',
        declaration: 'alias:amount.avg()',
        path: 'amount',
        aggregate: 'avg',
      },
      {
        alias: undefined,
        declaration: 'order_date',
        path: 'order_date',
      },
    ]);
  });

  it('should parse aggregates within embedded resources', () => {
    expect(parseSelectParam('state,orders(amount.sum(),order_date)')).toEqual([
      {
        alias: undefined,
        declaration: 'state',
        path: 'state',
      },
      {
        alias: undefined,
        declaration: 'orders.amount.sum()',
        path: 'orders.amount',
        aggregate: 'sum',
      },
      {
        alias: undefined,
        declaration: 'orders.order_date',
        path: 'orders.order_date',
      },
    ]);
  });

  it('should return input if falsy', () => {
    expect(
      parseSelectParam(
        'id,assignee:assignee_id(id,test_name:display_name),tags:tag(id,tag_name:name)',
      ),
    ).toEqual([
      {
        alias: undefined,
        declaration: 'id',
        path: 'id',
      },
      {
        alias: 'assignee.id',
        declaration: 'assignee:assignee_id.id',
        path: 'assignee_id.id',
      },
      {
        alias: 'assignee.test_name',
        declaration: 'assignee:assignee_id.test_name:display_name',
        path: 'assignee_id.display_name',
      },
      {
        alias: 'tags.id',
        declaration: 'tags:tag.id',
        path: 'tag.id',
      },
      {
        alias: 'tags.tag_name',
        declaration: 'tags:tag.tag_name:name',
        path: 'tag.name',
      },
    ]);
  });

  it('should work for special case', () => {
    expect(
      parseSelectParam(
        'id,team_members:team_member_team_id_fkey(employee!team_member_employee_id_fkey(id,display_name,user_id),team_id)',
      ),
    ).toEqual([
      {
        alias: undefined,
        declaration: 'id',
        path: 'id',
      },
      {
        declaration: 'team_members:team_member_team_id_fkey.team_id',
        alias: 'team_members.team_id',
        path: 'team_member_team_id_fkey.team_id',
      },
      {
        declaration:
          'team_members:team_member_team_id_fkey.employee!team_member_employee_id_fkey.id',
        alias: 'team_members.employee.id',
        path: 'team_member_team_id_fkey.employee.id',
      },
      {
        declaration:
          'team_members:team_member_team_id_fkey.employee!team_member_employee_id_fkey.display_name',
        alias: 'team_members.employee.display_name',
        path: 'team_member_team_id_fkey.employee.display_name',
      },
      {
        declaration:
          'team_members:team_member_team_id_fkey.employee!team_member_employee_id_fkey.user_id',
        alias: 'team_members.employee.user_id',
        path: 'team_member_team_id_fkey.employee.user_id',
      },
    ]);
  });
});
