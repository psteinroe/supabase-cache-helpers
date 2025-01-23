import { OrderDefinition } from './query-types';

export const parseOrderBy = (searchParams: URLSearchParams) => {
  const orderBy: OrderDefinition[] = [];
  searchParams.forEach((value, key) => {
    const split = key.split('.');
    if (split[split.length === 2 ? 1 : 0] === 'order') {
      // separated by ,
      const orderByDefs = value.split(',');
      orderByDefs.forEach((def) => {
        const [column, ascending, nullsFirst] = def.split('.');
        orderBy.push({
          ascending: ascending === 'asc',
          column,
          nullsFirst: nullsFirst === 'nullsfirst',
          foreignTable: split.length === 2 ? split[0] : undefined,
        });
      });
    }
  });

  return orderBy;
};
