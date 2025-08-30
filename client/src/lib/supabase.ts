import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          icon: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          icon?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          icon?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          space_id: string
          name: string
          description: string | null
          icon: string
          order_index: number
          view_mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id: string
          name: string
          description?: string | null
          icon?: string
          order_index?: number
          view_mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: string
          name?: string
          description?: string | null
          icon?: string
          order_index?: number
          view_mode?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          collection_id: string
          title: string
          url: string
          description: string | null
          favicon: string | null
          preview: any | null
          tags: string[] | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          title: string
          url: string
          description?: string | null
          favicon?: string | null
          preview?: any | null
          tags?: string[] | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          title?: string
          url?: string
          description?: string | null
          favicon?: string | null
          preview?: any | null
          tags?: string[] | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shares: {
        Row: {
          id: string
          workspace_id: string
          view_key: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          view_key: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          view_key?: string
          created_at?: string
        }
      }
    }
  }
}

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type Space = Database['public']['Tables']['spaces']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Share = Database['public']['Tables']['shares']['Row']
