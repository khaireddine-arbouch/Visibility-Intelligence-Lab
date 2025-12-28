/**
 * Supabase Database Types
 * Generated types for type-safe database operations
 */

export interface Database {
  public: {
    Tables: {
      serp_entries: {
        Row: {
          id: number
          query: string
          outlet: string
          rank: number
          date: string
          title: string | null
          url: string | null
          category: 'mainstream' | 'foreign' | 'independent' | 'local'
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          query: string
          outlet: string
          rank: number
          date: string
          title?: string | null
          url?: string | null
          category?: 'mainstream' | 'foreign' | 'independent' | 'local'
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          query?: string
          outlet?: string
          rank?: number
          date?: string
          title?: string | null
          url?: string | null
          category?: 'mainstream' | 'foreign' | 'independent' | 'local'
          country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      outlets: {
        Row: {
          id: number
          name: string
          category: 'mainstream' | 'foreign' | 'independent' | 'local'
          country: string | null
          headquarters: string | null
          parent: string | null
          ownership: string | null
          affiliations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          category?: 'mainstream' | 'foreign' | 'independent' | 'local'
          country?: string | null
          headquarters?: string | null
          parent?: string | null
          ownership?: string | null
          affiliations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: 'mainstream' | 'foreign' | 'independent' | 'local'
          country?: string | null
          headquarters?: string | null
          parent?: string | null
          ownership?: string | null
          affiliations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      outlet_category: 'mainstream' | 'foreign' | 'independent' | 'local'
    }
  }
}

