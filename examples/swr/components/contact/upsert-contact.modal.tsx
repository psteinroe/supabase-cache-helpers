import { FC, FormEventHandler, useCallback, useEffect } from "react"
import { useUpsertMutation } from "@supabase-cache-helpers/postgrest-swr"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { v4 as uuid } from "uuid"
import { z } from "zod"

import { Database } from "@/types/database"
import { ContinentSelect } from "../continent/continent-select"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export const continentEnumSchema = z.enum([
  "AF",
  "AS",
  "EU",
  "NA",
  "SA",
  "OC",
  "AN",
])

const upsertContactSchema = z.object({
  id: z.string().optional(),
  username: z.string(),
  continent: continentEnumSchema,
})

export type UpsertContactFormData = z.infer<typeof upsertContactSchema>

export type UpsertContactModalProps = {
  contact?: UpsertContactFormData | null
  open: boolean
  onClose: () => void
}

export const UpsertContactModal: FC<UpsertContactModalProps> = ({
  contact,
  open,
  onClose,
}) => {
  const supabase = useSupabaseClient<Database>()

  const { trigger: upsert, isMutating } = useUpsertMutation(
    supabase.from("contact"),
    ["id"],
    null,
    { onSuccess: onClose }
  )

  const { register, handleSubmit, control, reset } =
    useForm<UpsertContactFormData>({
      defaultValues: { id: undefined, username: "@psteinroe", continent: "EU" },
    })

  useEffect(() => {
    if (contact) reset(contact)
  }, [contact, reset])

  const onSubmitHandler = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      handleSubmit(async (data) => {
        await upsert([{ ...data, id: data.id ?? uuid() }])
      })(e)
    },
    [handleSubmit, upsert]
  )

  const onOpenChangeHandler = useCallback(
    (open: boolean) => {
      if (open === false) onClose()
    },
    [onClose]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChangeHandler}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmitHandler}>
          <DialogHeader>
            <DialogTitle>Edit contact</DialogTitle>
            <DialogDescription>
              Make changes to the contact here. Click save when you are done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Username
              </Label>
              <Input
                id="name"
                className="col-span-3"
                {...register("username")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Continent
              </Label>
              <Controller
                control={control}
                name="continent"
                render={({ field }) => (
                  <ContinentSelect
                    triggerProps={{ id: "username", className: "col-span-3" }}
                    containerProps={{
                      value: field.value,
                      onValueChange: (v) => field.onChange(v),
                    }}
                  />
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}{" "}
              {isMutating ? "Loading" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
