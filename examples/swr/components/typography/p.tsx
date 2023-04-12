import { DetailedHTMLProps, FC, HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export const P: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
> = ({ className, children, ...props }) => {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    >
      {children}
    </p>
  )
}
