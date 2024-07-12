import type * as SelectPrimitive from "@radix-ui/react-select";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { FC } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

export type ContinentSelectProps = {
  containerProps?: SelectPrimitive.SelectProps;
  triggerProps?: SelectPrimitive.SelectTriggerProps;
};

export const ContinentSelect: FC<ContinentSelectProps> = ({
  containerProps,
  triggerProps,
}) => {
  const supabase = useSupabaseClient<Database>();
  const { data, isLoading } = useQuery(
    supabase.from("continent").select("code,name"),
  );

  const { disabled, ...props } = containerProps;

  return (
    <Select disabled={disabled || isLoading} {...props}>
      <SelectTrigger
        {...triggerProps}
        className={cn("w-[180px]", triggerProps.className)}
      >
        <SelectValue placeholder="Select a continent" />
      </SelectTrigger>
      <SelectContent>
        {(data ?? []).map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
