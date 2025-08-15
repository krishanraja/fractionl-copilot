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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          context: Json | null
          conversation_type: string
          created_at: string
          id: string
          question: string
          response: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          conversation_type?: string
          created_at?: string
          id?: string
          question: string
          response: string
          user_id: string
        }
        Update: {
          context?: Json | null
          conversation_type?: string
          created_at?: string
          id?: string
          question?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message_count: number | null
          summary: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message_count?: number | null
          summary?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_progress: {
        Row: {
          advisory_progress: number | null
          created_at: string
          date: string
          id: string
          lectures_progress: number | null
          month: string
          notes: string | null
          pr_progress: number | null
          updated_at: string
          user_id: string
          workshops_progress: number | null
        }
        Insert: {
          advisory_progress?: number | null
          created_at?: string
          date: string
          id?: string
          lectures_progress?: number | null
          month: string
          notes?: string | null
          pr_progress?: number | null
          updated_at?: string
          user_id?: string
          workshops_progress?: number | null
        }
        Update: {
          advisory_progress?: number | null
          created_at?: string
          date?: string
          id?: string
          lectures_progress?: number | null
          month?: string
          notes?: string | null
          pr_progress?: number | null
          updated_at?: string
          user_id?: string
          workshops_progress?: number | null
        }
        Relationships: []
      }
      monthly_goals: {
        Row: {
          advisory_target: number | null
          cost_budget: number | null
          created_at: string
          id: string
          lectures_target: number | null
          month: string
          pr_target: number | null
          revenue_forecast: number | null
          updated_at: string
          user_id: string
          workshops_target: number | null
        }
        Insert: {
          advisory_target?: number | null
          cost_budget?: number | null
          created_at?: string
          id?: string
          lectures_target?: number | null
          month: string
          pr_target?: number | null
          revenue_forecast?: number | null
          updated_at?: string
          user_id?: string
          workshops_target?: number | null
        }
        Update: {
          advisory_target?: number | null
          cost_budget?: number | null
          created_at?: string
          id?: string
          lectures_target?: number | null
          month?: string
          pr_target?: number | null
          revenue_forecast?: number | null
          updated_at?: string
          user_id?: string
          workshops_target?: number | null
        }
        Relationships: []
      }
      monthly_snapshots: {
        Row: {
          created_at: string
          id: string
          month: string
          site_visits: number | null
          social_followers: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          site_visits?: number | null
          social_followers?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          site_visits?: number | null
          social_followers?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          company: string | null
          contact_person: string | null
          created_at: string
          estimated_close_date: string | null
          estimated_value: number | null
          id: string
          month: string
          notes: string | null
          probability: number | null
          stage: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_person?: string | null
          created_at?: string
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          month: string
          notes?: string | null
          probability?: number | null
          stage?: string
          title: string
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          company?: string | null
          contact_person?: string | null
          created_at?: string
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          month?: string
          notes?: string | null
          probability?: number | null
          stage?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_entries: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          month: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          description?: string | null
          id?: string
          month: string
          source: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          month?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sheets_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          google_sheet_id: string | null
          id: string
          integration_type: string
          is_token_compromised: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          security_hash: string | null
          settings: Json | null
          sheet_name: string | null
          sync_enabled: boolean | null
          sync_error: string | null
          sync_status: string | null
          token_access_count: number | null
          token_expires_at: string | null
          token_last_rotated_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          google_sheet_id?: string | null
          id?: string
          integration_type?: string
          is_token_compromised?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          security_hash?: string | null
          settings?: Json | null
          sheet_name?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_status?: string | null
          token_access_count?: number | null
          token_expires_at?: string | null
          token_last_rotated_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          google_sheet_id?: string | null
          id?: string
          integration_type?: string
          is_token_compromised?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          security_hash?: string | null
          settings?: Json | null
          sheet_name?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_status?: string | null
          token_access_count?: number | null
          token_expires_at?: string | null
          token_last_rotated_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spreadsheet_sync: {
        Row: {
          created_at: string
          google_sheet_id: string | null
          id: string
          last_sync_at: string | null
          sync_enabled: boolean | null
          sync_error: string | null
          sync_frequency: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          google_sheet_id?: string | null
          id?: string
          last_sync_at?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          google_sheet_id?: string | null
          id?: string
          last_sync_at?: string | null
          sync_enabled?: boolean | null
          sync_error?: string | null
          sync_frequency?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_business_context: {
        Row: {
          business_type: string | null
          communication_style: string | null
          created_at: string
          id: string
          main_challenges: string[] | null
          priorities: string[] | null
          target_market: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string | null
          communication_style?: string | null
          created_at?: string
          id?: string
          main_challenges?: string[] | null
          priorities?: string[] | null
          target_market?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string | null
          communication_style?: string | null
          created_at?: string
          id?: string
          main_challenges?: string[] | null
          priorities?: string[] | null
          target_market?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_google_tokens: {
        Args: { target_user_id: string }
        Returns: {
          access_token: string
          refresh_token: string
          token_expires_at: string
        }[]
      }
      log_token_access: {
        Args: {
          access_type: string
          additional_info?: Json
          success?: boolean
          target_user_id: string
        }
        Returns: undefined
      }
      verify_token_integrity: {
        Args: { target_user_id: string }
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
