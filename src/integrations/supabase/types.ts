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
          file_url: string | null
          id: string
          inputs: Json
          output: string | null
          scheduled_task_id: string | null
          skill_id: string
          status: string
          title: string
          tokens_used: number | null
        }
        Insert: {
          agent_type: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          department: string
          file_url?: string | null
          id?: string
          inputs?: Json
          output?: string | null
          scheduled_task_id?: string | null
          skill_id: string
          status?: string
          title: string
          tokens_used?: number | null
        }
        Update: {
          agent_type?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          department?: string
          file_url?: string | null
          id?: string
          inputs?: Json
          output?: string | null
          scheduled_task_id?: string | null
          skill_id?: string
          status?: string
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
        ]
      }
      content_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
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
          title: string
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
          title: string
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
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
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
          id: string
          tokens: number | null
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          tokens?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
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
        ]
      }
      knowledge_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_folders"
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
          timeout_seconds?: number
          token_budget?: number
          trigger_keywords?: string[]
          updated_at?: string
          version?: string
          web_search_enabled?: boolean
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
