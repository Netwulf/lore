// Database types for Supabase
// Run `npm run db:gen-types` to regenerate from your Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          title: string;
          content: Json;
          parent_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          content?: Json;
          parent_id?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: Json;
          parent_id?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pages_parent_id_fkey';
            columns: ['parent_id'];
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pages_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      page_links: {
        Row: {
          id: string;
          source_id: string;
          target_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          target_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          target_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'page_links_source_id_fkey';
            columns: ['source_id'];
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'page_links_target_id_fkey';
            columns: ['target_id'];
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'page_links_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      dismissed_suggestions: {
        Row: {
          id: string;
          page_id: string;
          suggested_page_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          suggested_page_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          suggested_page_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dismissed_suggestions_page_id_fkey';
            columns: ['page_id'];
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dismissed_suggestions_suggested_page_id_fkey';
            columns: ['suggested_page_id'];
            referencedRelation: 'pages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dismissed_suggestions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience types
export type Page = Database['public']['Tables']['pages']['Row'];
export type PageInsert = Database['public']['Tables']['pages']['Insert'];
export type PageUpdate = Database['public']['Tables']['pages']['Update'];

export type PageLink = Database['public']['Tables']['page_links']['Row'];
export type PageLinkInsert = Database['public']['Tables']['page_links']['Insert'];
export type PageLinkUpdate = Database['public']['Tables']['page_links']['Update'];

export type DismissedSuggestion = Database['public']['Tables']['dismissed_suggestions']['Row'];
export type DismissedSuggestionInsert = Database['public']['Tables']['dismissed_suggestions']['Insert'];
export type DismissedSuggestionUpdate = Database['public']['Tables']['dismissed_suggestions']['Update'];

// Page Chunks (for embeddings)
export interface PageChunk {
  id: string;
  page_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  created_at: string;
}

export interface PageChunkInsert {
  id?: string;
  page_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[] | null;
  created_at?: string;
}

// User Settings
export interface UserSettings {
  id: string;
  user_id: string;
  llm_provider: string;
  llm_model: string;
  llm_base_url: string | null;
  embedding_provider: string;
  embedding_model: string;
  image_provider: string;
  image_model: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsInsert {
  id?: string;
  user_id: string;
  llm_provider?: string;
  llm_model?: string;
  llm_base_url?: string | null;
  embedding_provider?: string;
  embedding_model?: string;
  image_provider?: string;
  image_model?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettingsUpdate {
  llm_provider?: string;
  llm_model?: string;
  llm_base_url?: string | null;
  embedding_provider?: string;
  embedding_model?: string;
  image_provider?: string;
  image_model?: string;
  updated_at?: string;
}

// User API Keys
export interface UserApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface UserApiKeyInsert {
  id?: string;
  user_id: string;
  provider: string;
  api_key: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserApiKeyUpdate {
  api_key?: string;
  updated_at?: string;
}
