export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contact: {
        Row: {
          country: string | null;
          username: string | null;
          ticket_number: number | null;
          golden_ticket: boolean | null;
          tags: string[] | null;
          age_range: unknown | null;
          metadata: Json | null;
          catchphrase: unknown | null;
          id: string;
          created_at: string;
          has_low_ticket_number: boolean;
        };
        Insert: {
          country?: string | null;
          username?: string | null;
          ticket_number?: number | null;
          golden_ticket?: boolean | null;
          tags?: string[] | null;
          age_range?: unknown | null;
          metadata?: Json | null;
          catchphrase?: unknown | null;
          id?: string;
          created_at?: string;
        };
        Update: {
          country?: string | null;
          username?: string | null;
          ticket_number?: number | null;
          golden_ticket?: boolean | null;
          tags?: string[] | null;
          age_range?: unknown | null;
          metadata?: Json | null;
          catchphrase?: unknown | null;
          id?: string;
          created_at?: string;
        };
      };
      contact_note: {
        Row: {
          contact_id: string;
          text: string;
          id: string;
          created_at: string;
        };
        Insert: {
          contact_id: string;
          text: string;
          id?: string;
          created_at?: string;
        };
        Update: {
          contact_id?: string;
          text?: string;
          id?: string;
          created_at?: string;
        };
      };
      continent: {
        Row: {
          code: string;
          name: string | null;
        };
        Insert: {
          code: string;
          name?: string | null;
        };
        Update: {
          code?: string;
          name?: string | null;
        };
      };
      country: {
        Row: {
          code: string;
          name: string;
          full_name: string;
          iso3: string;
          number: string;
          continent_code: string;
        };
        Insert: {
          code: string;
          name: string;
          full_name: string;
          iso3: string;
          number: string;
          continent_code: string;
        };
        Update: {
          code?: string;
          name?: string;
          full_name?: string;
          iso3?: string;
          number?: string;
          continent_code?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_low_ticket_number: {
        Args: { "": unknown };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
