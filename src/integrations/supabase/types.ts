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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      dependants: {
        Row: {
          age: number | null
          created_at: string
          full_name: string
          geopolitical_zone:
            | Database["public"]["Enums"]["geopolitical_zone"]
            | null
          id: string
          relationship: string
          sex: Database["public"]["Enums"]["sex_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          full_name?: string
          geopolitical_zone?:
            | Database["public"]["Enums"]["geopolitical_zone"]
            | null
          id?: string
          relationship?: string
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          full_name?: string
          geopolitical_zone?:
            | Database["public"]["Enums"]["geopolitical_zone"]
            | null
          id?: string
          relationship?: string
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          device_info: Json | null
          id: string
          message: string
          nps: number | null
          rating: number | null
          result_id: string | null
          screen: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          device_info?: Json | null
          id?: string
          message: string
          nps?: number | null
          rating?: number | null
          result_id?: string | null
          screen?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          device_info?: Json | null
          id?: string
          message?: string
          nps?: number | null
          rating?: number | null
          result_id?: string | null
          screen?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          ai_summary: string | null
          ai_summary_pidgin: string | null
          biomarker_citations: Json | null
          biomarkers: Json | null
          biomarkers_pidgin: Json | null
          checklist_status: string
          consultation_checklist: Json | null
          consultation_checklist_pidgin: Json | null
          created_at: string
          critical_alerts: Json | null
          dependant_id: string | null
          diet_status: string
          dietary_plan: Json | null
          dietary_plan_pidgin: Json | null
          fda_safety: Json | null
          fda_safety_status: string
          grounding_status: string
          has_critical_alert: boolean
          id: string
          nafdac_citations: Json | null
          nafdac_status: string
          nutrition_citations: Json | null
          nutrition_status: string
          processing_steps: Json | null
          status: string
          test_date: string | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_pidgin?: string | null
          biomarker_citations?: Json | null
          biomarkers?: Json | null
          biomarkers_pidgin?: Json | null
          checklist_status?: string
          consultation_checklist?: Json | null
          consultation_checklist_pidgin?: Json | null
          created_at?: string
          critical_alerts?: Json | null
          dependant_id?: string | null
          diet_status?: string
          dietary_plan?: Json | null
          dietary_plan_pidgin?: Json | null
          fda_safety?: Json | null
          fda_safety_status?: string
          grounding_status?: string
          has_critical_alert?: boolean
          id?: string
          nafdac_citations?: Json | null
          nafdac_status?: string
          nutrition_citations?: Json | null
          nutrition_status?: string
          processing_steps?: Json | null
          status?: string
          test_date?: string | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          ai_summary_pidgin?: string | null
          biomarker_citations?: Json | null
          biomarkers?: Json | null
          biomarkers_pidgin?: Json | null
          checklist_status?: string
          consultation_checklist?: Json | null
          consultation_checklist_pidgin?: Json | null
          created_at?: string
          critical_alerts?: Json | null
          dependant_id?: string | null
          diet_status?: string
          dietary_plan?: Json | null
          dietary_plan_pidgin?: Json | null
          fda_safety?: Json | null
          fda_safety_status?: string
          grounding_status?: string
          has_critical_alert?: boolean
          id?: string
          nafdac_citations?: Json | null
          nafdac_status?: string
          nutrition_citations?: Json | null
          nutrition_status?: string
          processing_steps?: Json | null
          status?: string
          test_date?: string | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_dependant_id_fkey"
            columns: ["dependant_id"]
            isOneToOne: false
            referencedRelation: "dependants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          full_name: string
          geopolitical_zone:
            | Database["public"]["Enums"]["geopolitical_zone"]
            | null
          id: string
          medical_disclaimer_accepted: boolean
          ndpa_consent: boolean
          onboarding_completed: boolean
          sex: Database["public"]["Enums"]["sex_type"] | null
          updated_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          full_name?: string
          geopolitical_zone?:
            | Database["public"]["Enums"]["geopolitical_zone"]
            | null
          id?: string
          medical_disclaimer_accepted?: boolean
          ndpa_consent?: boolean
          onboarding_completed?: boolean
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
          user_id: string
          user_role?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          full_name?: string
          geopolitical_zone?:
            | Database["public"]["Enums"]["geopolitical_zone"]
            | null
          id?: string
          medical_disclaimer_accepted?: boolean
          ndpa_consent?: boolean
          onboarding_completed?: boolean
          sex?: Database["public"]["Enums"]["sex_type"] | null
          updated_at?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      support_issue_events: {
        Row: {
          action_key: string | null
          actor_id: string | null
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          issue_id: string
          metadata: Json | null
          note: string | null
          to_status: string | null
        }
        Insert: {
          action_key?: string | null
          actor_id?: string | null
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          issue_id: string
          metadata?: Json | null
          note?: string | null
          to_status?: string | null
        }
        Update: {
          action_key?: string | null
          actor_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          issue_id?: string
          metadata?: Json | null
          note?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_issue_events_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "support_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      support_issues: {
        Row: {
          affected_user_id: string
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          lab_result_id: string | null
          metadata: Json | null
          priority: string
          resolution_action: string | null
          resolution_summary: string | null
          resolved_at: string | null
          resolved_by: string | null
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_user_id: string
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          lab_result_id?: string | null
          metadata?: Json | null
          priority?: string
          resolution_action?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_user_id?: string
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          lab_result_id?: string | null
          metadata?: Json | null
          priority?: string
          resolution_action?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      admin_get_result_owner: {
        Args: { _result_id: string }
        Returns: {
          email: string
          full_name: string
          user_id: string
        }[]
      }
      admin_list_feedback: {
        Args: { _limit?: number }
        Returns: {
          admin_notes: string
          category: string
          created_at: string
          device_info: Json
          email: string
          full_name: string
          id: string
          message: string
          nps: number
          rating: number
          result_id: string
          screen: string
          status: string
          user_id: string
        }[]
      }
      admin_list_issues: {
        Args: { _limit?: number }
        Returns: {
          affected_email: string
          affected_name: string
          affected_user_id: string
          assigned_to: string
          category: string
          created_at: string
          created_by: string
          id: string
          lab_result_id: string
          priority: string
          resolution_action: string
          resolution_summary: string
          resolved_at: string
          source: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          dependants_count: number
          email: string
          full_name: string
          last_activity: string
          last_sign_in: string
          results_count: number
          user_id: string
        }[]
      }
      admin_overview_metrics: { Args: never; Returns: Json }
      admin_recent_results: {
        Args: { _limit?: number }
        Returns: {
          dependant_id: string
          email: string
          full_name: string
          has_critical_alert: boolean
          id: string
          status: string
          upload_date: string
          user_id: string
        }[]
      }
      admin_user_issue_history: {
        Args: { _user_id: string }
        Returns: {
          assigned_to: string
          category: string
          created_at: string
          id: string
          lab_result_id: string
          priority: string
          resolution_action: string
          resolution_summary: string
          resolved_at: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      geopolitical_zone:
        | "south-south"
        | "south-west"
        | "south-east"
        | "north-central"
        | "north-east"
        | "north-west"
      sex_type: "male" | "female"
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
    Enums: {
      app_role: ["admin", "user"],
      geopolitical_zone: [
        "south-south",
        "south-west",
        "south-east",
        "north-central",
        "north-east",
        "north-west",
      ],
      sex_type: ["male", "female"],
    },
  },
} as const
