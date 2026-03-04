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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_jobs: {
        Row: {
          agent_type: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          department: string
          feedback_note: string | null
          feedback_rating: number | null
          file_url: string | null
          id: string
          inputs: Json
          output: string | null
          scheduled_task_id: string | null
          skill_id: string
          status: string
          tenant_id: string
          title: string
          tokens_used: number | null
        }
        Insert: {
          agent_type: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          department: string
          feedback_note?: string | null
          feedback_rating?: number | null
          file_url?: string | null
          id?: string
          inputs?: Json
          output?: string | null
          scheduled_task_id?: string | null
          skill_id: string
          status?: string
          tenant_id: string
          title: string
          tokens_used?: number | null
        }
        Update: {
          agent_type?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          department?: string
          feedback_note?: string | null
          feedback_rating?: number | null
          file_url?: string | null
          id?: string
          inputs?: Json
          output?: string | null
          scheduled_task_id?: string | null
          skill_id?: string
          status?: string
          tenant_id?: string
          title?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_jobs_scheduled_task_id_fkey"
            columns: ["scheduled_task_id"]
            isOneToOne: false
            referencedRelation: "scheduled_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_folders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          agent_type: string | null
          content: string
          created_at: string
          department: string | null
          folder_id: string | null
          id: string
          job_id: string | null
          owner: string
          skill_id: string | null
          skill_name: string | null
          tenant_id: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          agent_type?: string | null
          content: string
          created_at?: string
          department?: string | null
          folder_id?: string | null
          id?: string
          job_id?: string | null
          owner?: string
          skill_id?: string | null
          skill_name?: string | null
          tenant_id: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          agent_type?: string | null
          content?: string
          created_at?: string
          department?: string | null
          folder_id?: string | null
          id?: string
          job_id?: string | null
          owner?: string
          skill_id?: string | null
          skill_name?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          tenant_id: string
          tokens: number | null
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          tenant_id: string
          tokens?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          tenant_id?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          content: string | null
          created_at: string
          doc_type: string
          file_path: string | null
          folder_id: string | null
          id: string
          mime_type: string | null
          status: string
          tenant_id: string
          title: string
          tokens: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          doc_type?: string
          file_path?: string | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          status?: string
          tenant_id: string
          title: string
          tokens?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          doc_type?: string
          file_path?: string | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          status?: string
          tenant_id?: string
          title?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "knowledge_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_folders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_tasks: {
        Row: {
          agent_type: string
          created_at: string
          cron_expression: string
          department: string
          id: string
          inputs: Json
          last_job_id: string | null
          last_run_at: string | null
          next_run_at: string | null
          run_count: number
          schedule_type: string
          skill_id: string
          skill_name: string
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          cron_expression: string
          department: string
          id?: string
          inputs?: Json
          last_job_id?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number
          schedule_type?: string
          skill_id: string
          skill_name: string
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          cron_expression?: string
          department?: string
          id?: string
          inputs?: Json
          last_job_id?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number
          schedule_type?: string
          skill_id?: string
          skill_name?: string
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tasks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          agent_type: string
          approval_required: boolean
          created_at: string
          department: string
          description: string | null
          display_name: string | null
          emoji: string | null
          estimated_cost_usd: number | null
          export_formats: string[]
          id: string
          inputs: Json
          is_system: boolean
          name: string
          output_format: string
          output_schema: Json
          preferred_lane: string
          preferred_model: string
          prompt_template: string
          required_capabilities: string[]
          schedulable: boolean
          system_prompt: string
          tags: string[]
          tenant_id: string
          timeout_seconds: number
          token_budget: number
          trigger_keywords: string[]
          updated_at: string
          version: string
          web_search_enabled: boolean
        }
        Insert: {
          agent_type: string
          approval_required?: boolean
          created_at?: string
          department: string
          description?: string | null
          display_name?: string | null
          emoji?: string | null
          estimated_cost_usd?: number | null
          export_formats?: string[]
          id?: string
          inputs?: Json
          is_system?: boolean
          name: string
          output_format?: string
          output_schema?: Json
          preferred_lane?: string
          preferred_model?: string
          prompt_template?: string
          required_capabilities?: string[]
          schedulable?: boolean
          system_prompt?: string
          tags?: string[]
          tenant_id: string
          timeout_seconds?: number
          token_budget?: number
          trigger_keywords?: string[]
          updated_at?: string
          version?: string
          web_search_enabled?: boolean
        }
        Update: {
          agent_type?: string
          approval_required?: boolean
          created_at?: string
          department?: string
          description?: string | null
          display_name?: string | null
          emoji?: string | null
          estimated_cost_usd?: number | null
          export_formats?: string[]
          id?: string
          inputs?: Json
          is_system?: boolean
          name?: string
          output_format?: string
          output_schema?: Json
          preferred_lane?: string
          preferred_model?: string
          prompt_template?: string
          required_capabilities?: string[]
          schedulable?: boolean
          system_prompt?: string
          tags?: string[]
          tenant_id?: string
          timeout_seconds?: number
          token_budget?: number
          trigger_keywords?: string[]
          updated_at?: string
          version?: string
          web_search_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_sessions: {
        Row: {
          chat_id: number
          collected_inputs: Json
          conversation_history: Json
          created_at: string
          current_input_index: number
          id: string
          selected_skill_id: string | null
          state: string
          updated_at: string
        }
        Insert: {
          chat_id: number
          collected_inputs?: Json
          conversation_history?: Json
          created_at?: string
          current_input_index?: number
          id?: string
          selected_skill_id?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          chat_id?: number
          collected_inputs?: Json
          conversation_history?: Json
          created_at?: string
          current_input_index?: number
          id?: string
          selected_skill_id?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          allowed_domains: string[]
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
          token_budget_monthly: number
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[]
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          token_budget_monthly?: number
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[]
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          token_budget_monthly?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_complete: boolean
          role: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_complete?: boolean
          role?: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_complete?: boolean
          role?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          tenant_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          tenant_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_insert_tenant: {
        Args: {
          _allowed_domains?: string[]
          _name: string
          _plan?: string
          _slug: string
        }
        Returns: string
      }
      admin_list_all_agent_jobs: {
        Args: {
          _date_from?: string
          _date_to?: string
          _feedback_rating?: number
          _limit?: number
          _offset?: number
          _search?: string
          _status?: string
          _tenant_id?: string
        }
        Returns: {
          agent_type: string
          completed_at: string
          created_at: string
          department: string
          feedback_note: string
          feedback_rating: number
          id: string
          skill_id: string
          status: string
          tenant_id: string
          tenant_name: string
          title: string
          tokens_used: number
        }[]
      }
      admin_list_all_tenants: {
        Args: never
        Returns: {
          allowed_domains: string[]
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
          token_budget_monthly: number
          user_count: number
        }[]
      }
      admin_update_tenant: {
        Args: {
          _allowed_domains?: string[]
          _id: string
          _name?: string
          _plan?: string
          _status?: string
          _token_budget_monthly?: number
        }
        Returns: undefined
      }
      admin_usage_summary: {
        Args: never
        Returns: {
          jobs_this_month: number
          last_active: string
          plan: string
          tenant_id: string
          tenant_name: string
          tokens_this_month: number
        }[]
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_tenant_for_domain: { Args: { _domain: string }; Returns: string }
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          match_tenant_id: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          similarity: number
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
