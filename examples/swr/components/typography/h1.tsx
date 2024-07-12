import type { DetailedHTMLProps, FC, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const H1: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
> = ({ className, children, ...props }) => {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
};
