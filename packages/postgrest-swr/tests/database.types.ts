export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
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
      contacts_cursor: {
        Args: {
          v_username_cursor?: string;
          v_id_cursor?: string;
          v_username_filter?: string;
          v_limit?: number;
        };
        Returns: {
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
        }[];
      };
      contacts_cursor_id_only: {
        Args: {
          v_id_cursor?: string;
          v_username_filter?: string;
          v_limit?: number;
        };
        Returns: {
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
        }[];
      };
      contacts_offset: {
        Args: {
          v_limit?: number;
          v_offset?: number;
          v_username_filter?: string;
        };
        Returns: {
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
        }[];
      };
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          level: number | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          level?: number | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      prefixes: {
        Row: {
          bucket_id: string;
          created_at: string | null;
          level: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          bucket_id: string;
          created_at?: string | null;
          level?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string;
          created_at?: string | null;
          level?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prefixes_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string };
        Returns: undefined;
      };
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json };
        Returns: undefined;
      };
      delete_prefix: {
        Args: { _bucket_id: string; _name: string };
        Returns: boolean;
      };
      extension: {
        Args: { name: string };
        Returns: string;
      };
      filename: {
        Args: { name: string };
        Returns: string;
      };
      foldername: {
        Args: { name: string };
        Returns: string[];
      };
      get_level: {
        Args: { name: string };
        Returns: number;
      };
      get_prefix: {
        Args: { name: string };
        Returns: string;
      };
      get_prefixes: {
        Args: { name: string };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          start_after?: string;
          next_token?: string;
        };
        Returns: {
          name: string;
          id: string;
          metadata: Json;
          updated_at: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      search_legacy_v1: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      search_v1_optimised: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      search_v2: {
        Args: {
          prefix: string;
          bucket_name: string;
          limits?: number;
          levels?: number;
          start_after?: string;
        };
        Returns: {
          key: string;
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          metadata: Json;
        }[];
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const;
