import { useId } from 'react';

import { KEY_SEPARATOR } from '../lib';

const PREFIX = 'random-mutation-key';

export const useRandomKey = () => {
  const key = useId();

  return [PREFIX, key].join(KEY_SEPARATOR);
};
