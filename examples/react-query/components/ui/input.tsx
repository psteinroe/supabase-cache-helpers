import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = ({
  ref,
  className,
  ...props
}: InputProps & {
  ref: React.RefObject<HTMLInputElement>;
}) => {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
};
Input.displayName = 'Input';

export { Input };
