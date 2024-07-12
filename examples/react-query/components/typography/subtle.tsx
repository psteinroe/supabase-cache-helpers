import type { DetailedHTMLProps, FC, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Subtle: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
> = ({ className, children, ...props }) => {
  return (
    <p
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    >
      {children}
    </p>
  );
};
