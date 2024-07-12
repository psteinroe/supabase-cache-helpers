import type { DetailedHTMLProps, FC, HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const Small: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
> = ({ className, children, ...props }) => {
  return (
    <small
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    >
      {children}
    </small>
  );
};
