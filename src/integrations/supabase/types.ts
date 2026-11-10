export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_requests: {
        Row: {
          agent_id: string
          created_at: string
          details: string
          due_date: string | null
          id: string
          priority: string
          requested_by: string
          requester_email: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          details?: string
          due_date?: string | null
          id?: string
          priority?: string
          requested_by?: string
          requester_email?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          details?: string
          due_date?: string | null
          id?: string
          priority?: string
          requested_by?: string
          requester_email?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          description: string
          id: string
          is_coordinator: boolean
          name: string
          responsibilities: string[]
          role_title: string
          room: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_coordinator?: boolean
          name: string
          responsibilities?: string[]
          role_title: string
          room: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_coordinator?: boolean
          name?: string
          responsibilities?: string[]
          role_title?: string
          room?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          id?: never
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      changelog_entries: {
        Row: {
          created_at: string
          created_by: string
          entry_date: string
          id: string
          summary: string
          version: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          entry_date?: string
          id?: string
          summary: string
          version?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          entry_date?: string
          id?: string
          summary?: string
          version?: string | null
        }
        Relationships: []
      }
      cost_items: {
        Row: {
          assumption: string
          category: string
          created_at: string
          created_by: string
          id: string
          monthly_cost: number
          name: string
          one_time_cost: number
          updated_at: string
        }
        Insert: {
          assumption?: string
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          monthly_cost?: number
          name: string
          one_time_cost?: number
          updated_at?: string
        }
        Update: {
          assumption?: string
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          monthly_cost?: number
          name?: string
          one_time_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          context: string
          created_at: string
          created_by: string
          decided_on: string
          decision: string
          id: string
          status: string
          title: string
        }
        Insert: {
          context?: string
          created_at?: string
          created_by?: string
          decided_on?: string
          decision?: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          context?: string
          created_at?: string
          created_by?: string
          decided_on?: string
          decision?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kind: string
          notes: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          notes?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          notes?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      financial_scenarios: {
        Row: {
          assumptions: string
          churn_pct: number
          created_at: string
          created_by: string
          growth_pct: number
          id: string
          name: string
          price_per_school: number
          schools: number
          updated_at: string
        }
        Insert: {
          assumptions?: string
          churn_pct?: number
          created_at?: string
          created_by?: string
          growth_pct?: number
          id?: string
          name: string
          price_per_school?: number
          schools?: number
          updated_at?: string
        }
        Update: {
          assumptions?: string
          churn_pct?: number
          created_at?: string
          created_by?: string
          growth_pct?: number
          id?: string
          name?: string
          price_per_school?: number
          schools?: number
          updated_at?: string
        }
        Relationships: []
      }
      mirrored_tasks: {
        Row: {
          agent_id: string | null
          board_id: string | null
          closed: boolean
          description: string | null
          due: string | null
          external_id: string
          id: string
          labels: Json
          last_synced_at: string
          list_id: string | null
          list_name: string | null
          name: string
          source: string
          url: string | null
        }
        Insert: {
          agent_id?: string | null
          board_id?: string | null
          closed?: boolean
          description?: string | null
          due?: string | null
          external_id: string
          id?: string
          labels?: Json
          last_synced_at?: string
          list_id?: string | null
          list_name?: string | null
          name: string
          source?: string
          url?: string | null
        }
        Update: {
          agent_id?: string | null
          board_id?: string | null
          closed?: boolean
          description?: string | null
          due?: string | null
          external_id?: string
          id?: string
          labels?: Json
          last_synced_at?: string
          list_id?: string | null
          list_name?: string | null
          name?: string
          source?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mirrored_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          created_at: string
          id: string
          integration: string
          items_count: number
          message: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          integration: string
          items_count?: number
          message?: string | null
          status: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          integration?: string
          items_count?: number
          message?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_status:
        | "disponivel"
        | "aguardando_aprovacao"
        | "em_andamento"
        | "pausado"
        | "nao_configurado"
      app_role: "admin" | "editor" | "viewer"
      request_status:
        | "pendente"
        | "aprovado"
        | "em_andamento"
        | "concluido"
        | "rejeitado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: [
        "disponivel",
        "aguardando_aprovacao",
        "em_andamento",
        "pausado",
        "nao_configurado",
      ],
      app_role: ["admin", "editor", "viewer"],
      request_status: [
        "pendente",
        "aprovado",
        "em_andamento",
        "concluido",
        "rejeitado",
      ],
    },
  },
} as const