import { upsert } from '../../src/mutate/build-upsert-mutator-fn';

type ItemType = {
  [idx: string]: string | number | null;
  id_1: number;
  id_2: number;
  value_1: number | null;
  value_2: number | null;
};
