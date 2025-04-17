export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      address_book: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      address_book_contact: {
        Row: {
          address_book: string;
          contact: string;
        };
        Insert: {
          address_book: string;
          contact: string;
        };
        Update: {
          address_book?: string;
          contact?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'address_book_contact_address_book_fkey';
            columns: ['address_book'];
            isOneToOne: false;
            referencedRelation: 'address_book';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'address_book_contact_contact_fkey';
            columns: ['contact'];
            isOneToOne: false;
            referencedRelation: 'contact';
            referencedColumns: ['id'];
          },
        ];
      };
      contact: {
        Row: {
          age_range: unknown | null;
          catchphrase: unknown | null;
          continent: string | null;
          country: string | null;
          created_at: string;
          golden_ticket: boolean | null;
          id: string;
          metadata: Json | null;
          tags: string[] | null;
          ticket_number: number | null;
          username: string | null;
          has_low_ticket_number: boolean | null;
        };
        Insert: {
          age_range?: unknown | null;
          catchphrase?: unknown | null;
          continent?: string | null;
          country?: string | null;
          created_at?: string;
          golden_ticket?: boolean | null;
          id?: string;
          metadata?: Json | null;
          tags?: string[] | null;
          ticket_number?: number | null;
          username?: string | null;
        };
        Update: {
          age_range?: unknown | null;
          catchphrase?: unknown | null;
          continent?: string | null;
          country?: string | null;
          created_at?: string;
          golden_ticket?: boolean | null;
          id?: string;
          metadata?: Json | null;
          tags?: string[] | null;
          ticket_number?: number | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_continent_fkey';
            columns: ['continent'];
            isOneToOne: false;
            referencedRelation: 'continent';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'contact_country_fkey';
            columns: ['country'];
            isOneToOne: false;
            referencedRelation: 'country';
            referencedColumns: ['code'];
          },
        ];
      };
      contact_note: {
        Row: {
          contact_id: string;
          created_at: string;
          created_by_contact_id: string | null;
          id: string;
          text: string;
          updated_by_contact_id: string | null;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          created_by_contact_id?: string | null;
          id?: string;
          text: string;
          updated_by_contact_id?: string | null;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          created_by_contact_id?: string | null;
          id?: string;
          text?: string;
          updated_by_contact_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_note_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contact';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_note_created_by_contact_id_fkey';
            columns: ['created_by_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contact';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_note_updated_by_contact_id_fkey';
            columns: ['updated_by_contact_id'];
            isOneToOne: false;
            referencedRelation: 'contact';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [];
      };
      country: {
        Row: {
          code: string;
          continent_code: string;
          full_name: string;
          iso3: string;
          name: string;
          number: string;
        };
        Insert: {
          code: string;
          continent_code: string;
          full_name: string;
          iso3: string;
          name: string;
          number: string;
        };
        Update: {
          code?: string;
          continent_code?: string;
          full_name?: string;
          iso3?: string;
          name?: string;
          number?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'country_continent_code_fkey';
            columns: ['continent_code'];
            isOneToOne: false;
            referencedRelation: 'continent';
            referencedColumns: ['code'];
          },
        ];
      };
      multi_pk: {
        Row: {
          id_1: number;
          id_2: number;
          name: string | null;
        };
        Insert: {
          id_1: number;
          id_2: number;
          name?: string | null;
        };
        Update: {
          id_1?: number;
          id_2?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      serial_key_table: {
        Row: {
          id: number;
          value: string | null;
        };
        Insert: {
          id?: number;
          value?: string | null;
        };
        Update: {
          id?: number;
          value?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_low_ticket_number: {
        Args: { '': Database['public']['Tables']['contact']['Row'] };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
