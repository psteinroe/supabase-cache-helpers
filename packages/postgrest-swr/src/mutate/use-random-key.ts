import { KEY_SEPARATOR } from '../lib';
import { useId } from 'react';

const PREFIX = 'random-mutation-key';

export const useRandomKey = () => {
  const key = useId();

  return [PREFIX, key].join(KEY_SEPARATOR);
};
