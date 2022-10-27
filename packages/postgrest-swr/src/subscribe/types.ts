import { GenericTable } from "@supabase/postgrest-js/dist/module/types";

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export const isV1Response = <T extends GenericTable>(
  payload: unknown
): payload is ResponseV1<T> => Boolean((payload as ResponseV1<T>).record);

export type ResponseV1<T extends GenericTable> = {
  // the change timestamp. eg: "2020-10-13T10:09:22Z".
  commit_timestamp: string;

  // the database schema. eg: "public".
  schema: string;

  // the database table. eg: "users".
  table: string;

  // the event type.
  type: RealtimeEventType;

  // all the columns for this table. See "column" type below.
  columns: Column[];

  // the new values. eg: { "id": "9", "age": "12" }.
  record: T["Row"];

  // the previous values. eg: { "id": "9", "age": "11" }. Only works if the table has `REPLICATION FULL`.
  old_record: T["Row"];

  // any change errors.
  errors: null | string[];
};

export type Column = {
  // any special flags for the column. eg: ["key"]
  flags: string[];

  // the column name. eg: "user_id"
  name: string;

  // the column type. eg: "uuid"
  type: string;

  // the type modifier. eg: 4294967295
  type_modifier: number;
};
