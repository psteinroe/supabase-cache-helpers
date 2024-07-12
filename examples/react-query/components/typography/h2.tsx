import type { DetailedHTMLProps, FC, HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const H2: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
> = ({ className, children, ...props }) => {
  return (
    <h2
      className={cn(
        'mt-10 scroll-m-20 border-b border-b-slate-200 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 dark:border-b-slate-700',
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
};
