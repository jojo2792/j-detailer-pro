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
      membership_history: {
        Row: {
          created_at: string
          event: Database["public"]["Enums"]["membership_event"]
          from_plan_id: string | null
          id: string
          membership_id: string
          metadata: Json
          note: string | null
          to_plan_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: Database["public"]["Enums"]["membership_event"]
          from_plan_id?: string | null
          id?: string
          membership_id: string
          metadata?: Json
          note?: string | null
          to_plan_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: Database["public"]["Enums"]["membership_event"]
          from_plan_id?: string | null
          id?: string
          membership_id?: string
          metadata?: Json
          note?: string | null
          to_plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_history_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_history_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_history_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          currency: string
          discount_percentage: number
          features: Json
          id: string
          is_active: boolean
          is_featured: boolean
          limits: Json
          monthly_interior_limit: number
          monthly_price_cents: number
          monthly_wash_limit: number
          name: string
          requires_quote: boolean
          reward_multiplier: number
          slug: string
          tagline: string | null
          tier_rank: number
          updated_at: string
          vehicle_limit: number
        }
        Insert: {
          created_at?: string
          currency?: string
          discount_percentage?: number
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          limits?: Json
          monthly_interior_limit?: number
          monthly_price_cents: number
          monthly_wash_limit?: number
          name: string
          requires_quote?: boolean
          reward_multiplier?: number
          slug: string
          tagline?: string | null
          tier_rank?: number
          updated_at?: string
          vehicle_limit?: number
        }
        Update: {
          created_at?: string
          currency?: string
          discount_percentage?: number
          features?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          limits?: Json
          monthly_interior_limit?: number
          monthly_price_cents?: number
          monthly_wash_limit?: number
          name?: string
          requires_quote?: boolean
          reward_multiplier?: number
          slug?: string
          tagline?: string | null
          tier_rank?: number
          updated_at?: string
          vehicle_limit?: number
        }
        Relationships: []
      }
      memberships: {
        Row: {
          auto_renew: boolean
          billing_customer_id: string | null
          billing_provider: string | null
          billing_subscription_id: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          interior_details_used: number
          paused_at: string | null
          pending_plan_id: string | null
          plan_id: string
          renewal_date: string
          resumes_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
          washes_used: number
        }
        Insert: {
          auto_renew?: boolean
          billing_customer_id?: string | null
          billing_provider?: string | null
          billing_subscription_id?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          interior_details_used?: number
          paused_at?: string | null
          pending_plan_id?: string | null
          plan_id: string
          renewal_date?: string
          resumes_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
          washes_used?: number
        }
        Update: {
          auto_renew?: boolean
          billing_customer_id?: string | null
          billing_provider?: string | null
          billing_subscription_id?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          interior_details_used?: number
          paused_at?: string | null
          pending_plan_id?: string | null
          plan_id?: string
          renewal_date?: string
          resumes_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
          washes_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "memberships_pending_plan_id_fkey"
            columns: ["pending_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_membership_event: {
        Args: {
          _event: Database["public"]["Enums"]["membership_event"]
          _from_plan_id?: string
          _membership_id: string
          _metadata?: Json
          _note?: string
          _to_plan_id?: string
        }
        Returns: undefined
      }
      record_membership_usage: {
        Args: { _kind: string; _membership_id: string; _quantity?: number }
        Returns: {
          auto_renew: boolean
          billing_customer_id: string | null
          billing_provider: string | null
          billing_subscription_id: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          interior_details_used: number
          paused_at: string | null
          pending_plan_id: string | null
          plan_id: string
          renewal_date: string
          resumes_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
          washes_used: number
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_due_membership_cycles: { Args: never; Returns: number }
      sync_membership_cycle: {
        Args: { _membership_id: string }
        Returns: {
          auto_renew: boolean
          billing_customer_id: string | null
          billing_provider: string | null
          billing_subscription_id: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          interior_details_used: number
          paused_at: string | null
          pending_plan_id: string | null
          plan_id: string
          renewal_date: string
          resumes_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
          washes_used: number
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "customer" | "technician" | "admin"
      membership_event:
        | "created"
        | "activated"
        | "upgraded"
        | "downgraded"
        | "paused"
        | "resumed"
        | "cancelled"
        | "renewed"
        | "cycle_reset"
        | "usage_recorded"
        | "auto_renew_changed"
        | "expired"
      membership_status:
        | "pending"
        | "active"
        | "paused"
        | "cancelled"
        | "expired"
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
      app_role: ["customer", "technician", "admin"],
      membership_event: [
        "created",
        "activated",
        "upgraded",
        "downgraded",
        "paused",
        "resumed",
        "cancelled",
        "renewed",
        "cycle_reset",
        "usage_recorded",
        "auto_renew_changed",
        "expired",
      ],
      membership_status: [
        "pending",
        "active",
        "paused",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
