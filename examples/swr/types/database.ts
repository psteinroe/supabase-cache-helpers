export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contact: {
        Row: {
          age_range: unknown | null
          catchphrase: unknown | null
          continent: string | null
          country: string | null
          created_at: string
          golden_ticket: boolean | null
          id: string
          metadata: Json | null
          tags: string[] | null
          ticket_number: number | null
          username: string | null
          has_low_ticket_number: boolean | null
        }
        Insert: {
          age_range?: unknown | null
          catchphrase?: unknown | null
          continent?: string | null
          country?: string | null
          created_at?: string
          golden_ticket?: boolean | null
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          ticket_number?: number | null
          username?: string | null
        }
        Update: {
          age_range?: unknown | null
          catchphrase?: unknown | null
          continent?: string | null
          country?: string | null
          created_at?: string
          golden_ticket?: boolean | null
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          ticket_number?: number | null
          username?: string | null
        }
      }
      contact_note: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          text: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          text?: string
        }
      }
      continent: {
        Row: {
          code: string
          name: string | null
        }
        Insert: {
          code: string
          name?: string | null
        }
        Update: {
          code?: string
          name?: string | null
        }
      }
      country: {
        Row: {
          code: string
          continent_code: string
          full_name: string
          iso3: string
          name: string
          number: string
        }
        Insert: {
          code: string
          continent_code: string
          full_name: string
          iso3: string
          name: string
          number: string
        }
        Update: {
          code?: string
          continent_code?: string
          full_name?: string
          iso3?: string
          name?: string
          number?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_low_ticket_number: {
        Args: {
          "": unknown
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
