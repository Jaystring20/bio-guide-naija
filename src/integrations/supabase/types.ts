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
          biomarkers: Json | null
          biomarkers_pidgin: Json | null
          consultation_checklist: Json | null
          consultation_checklist_pidgin: Json | null
          created_at: string
          critical_alerts: Json | null
          dependant_id: string | null
          dietary_plan: Json | null
          dietary_plan_pidgin: Json | null
          has_critical_alert: boolean
          id: string
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
          biomarkers?: Json | null
          biomarkers_pidgin?: Json | null
          consultation_checklist?: Json | null
          consultation_checklist_pidgin?: Json | null
          created_at?: string
          critical_alerts?: Json | null
          dependant_id?: string | null
          dietary_plan?: Json | null
          dietary_plan_pidgin?: Json | null
          has_critical_alert?: boolean
          id?: string
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
          biomarkers?: Json | null
          biomarkers_pidgin?: Json | null
          consultation_checklist?: Json | null
          consultation_checklist_pidgin?: Json | null
          created_at?: string
          critical_alerts?: Json | null
          dependant_id?: string | null
          dietary_plan?: Json | null
          dietary_plan_pidgin?: Json | null
          has_critical_alert?: boolean
          id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
