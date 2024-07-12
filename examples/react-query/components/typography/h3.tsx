import type { DetailedHTMLProps, FC, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const H3: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
> = ({ className, children, ...props }) => {
  return (
    <h3
      className={cn(
        "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
};
