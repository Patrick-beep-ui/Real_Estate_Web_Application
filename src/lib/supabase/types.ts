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
      ad_creatives: {
        Row: {
          ab_test_group: string | null
          ab_test_hypothesis: string | null
          brand_photo_url: string | null
          call_to_action: string | null
          created_at: string
          description: string | null
          estimated_relevance_score: number | null
          format: string
          headline: string
          id: string
          image_prompt: string | null
          image_url: string | null
          market_slug: string
          model_used: string | null
          performance_data: Json | null
          platform: string
          primary_text: string | null
          sitelink_extensions: Json | null
          situation_slug: string
          source_lead_insights: Json | null
          status: string
          target_audience: string | null
          version: number
          video_concept: Json | null
        }
        Insert: {
          ab_test_group?: string | null
          ab_test_hypothesis?: string | null
          brand_photo_url?: string | null
          call_to_action?: string | null
          created_at?: string
          description?: string | null
          estimated_relevance_score?: number | null
          format?: string
          headline: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          market_slug: string
          model_used?: string | null
          performance_data?: Json | null
          platform?: string
          primary_text?: string | null
          sitelink_extensions?: Json | null
          situation_slug: string
          source_lead_insights?: Json | null
          status?: string
          target_audience?: string | null
          version?: number
          video_concept?: Json | null
        }
        Update: {
          ab_test_group?: string | null
          ab_test_hypothesis?: string | null
          brand_photo_url?: string | null
          call_to_action?: string | null
          created_at?: string
          description?: string | null
          estimated_relevance_score?: number | null
          format?: string
          headline?: string
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          market_slug?: string
          model_used?: string | null
          performance_data?: Json | null
          platform?: string
          primary_text?: string | null
          sitelink_extensions?: Json | null
          situation_slug?: string
          source_lead_insights?: Json | null
          status?: string
          target_audience?: string | null
          version?: number
          video_concept?: Json | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          ai_generated: boolean | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          schema_type: string | null
          seo_title: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          schema_type?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          schema_type?: string | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      drip_sequences: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          message_template: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          step: number
        }
        Insert: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          message_template?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          step: number
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          message_template?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "drip_sequences_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          id: string
          market_slug: string
          model_used: string | null
          preview_text: string | null
          situation_slug: string
          status: string
          step: number
          subject: string
          version: number
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          market_slug: string
          model_used?: string | null
          preview_text?: string | null
          situation_slug: string
          status?: string
          step: number
          subject: string
          version?: number
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          id?: string
          market_slug?: string
          model_used?: string | null
          preview_text?: string | null
          situation_slug?: string
          status?: string
          step?: number
          subject?: string
          version?: number
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          after_body: string | null
          after_title: string | null
          before_body: string | null
          before_title: string | null
          body_paragraphs: Json | null
          bullets: Json | null
          content_type: string
          created_at: string
          faqs: Json | null
          final_cta_headline: string | null
          final_cta_subline: string | null
          generated_at: string
          headline: string | null
          id: string
          market_slug: string
          meta_description: string | null
          meta_title: string | null
          model_used: string | null
          situation_slug: string
          sms_prefilled_text: string | null
          status: string
          subheadline: string | null
          updated_at: string
          urgency_line: string | null
          version: number
          video_caption_lines: Json | null
          warning_body: string | null
          warning_title: string | null
          why_tarek_body: Json | null
        }
        Insert: {
          after_body?: string | null
          after_title?: string | null
          before_body?: string | null
          before_title?: string | null
          body_paragraphs?: Json | null
          bullets?: Json | null
          content_type?: string
          created_at?: string
          faqs?: Json | null
          final_cta_headline?: string | null
          final_cta_subline?: string | null
          generated_at?: string
          headline?: string | null
          id?: string
          market_slug: string
          meta_description?: string | null
          meta_title?: string | null
          model_used?: string | null
          situation_slug: string
          sms_prefilled_text?: string | null
          status?: string
          subheadline?: string | null
          updated_at?: string
          urgency_line?: string | null
          version?: number
          video_caption_lines?: Json | null
          warning_body?: string | null
          warning_title?: string | null
          why_tarek_body?: Json | null
        }
        Update: {
          after_body?: string | null
          after_title?: string | null
          before_body?: string | null
          before_title?: string | null
          body_paragraphs?: Json | null
          bullets?: Json | null
          content_type?: string
          created_at?: string
          faqs?: Json | null
          final_cta_headline?: string | null
          final_cta_subline?: string | null
          generated_at?: string
          headline?: string | null
          id?: string
          market_slug?: string
          meta_description?: string | null
          meta_title?: string | null
          model_used?: string | null
          situation_slug?: string
          sms_prefilled_text?: string | null
          status?: string
          subheadline?: string | null
          updated_at?: string
          urgency_line?: string | null
          version?: number
          video_caption_lines?: Json | null
          warning_body?: string | null
          warning_title?: string | null
          why_tarek_body?: Json | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          lead_id: string | null
          response_body: Json
          response_status: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          lead_id?: string | null
          response_body: Json
          response_status: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          lead_id?: string | null
          response_body?: Json
          response_status?: number
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_errors: {
        Row: {
          created_at: string
          email: string | null
          error_code: string | null
          error_details: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          market_slug: string | null
          name: string | null
          payload: Json | null
          phone: string | null
          property_address: string | null
          resolved: boolean
          resolved_at: string | null
          retry_count: number
          situation_slug: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          error_code?: string | null
          error_details?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          market_slug?: string | null
          name?: string | null
          payload?: Json | null
          phone?: string | null
          property_address?: string | null
          resolved?: boolean
          resolved_at?: string | null
          retry_count?: number
          situation_slug?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          error_code?: string | null
          error_details?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          market_slug?: string | null
          name?: string | null
          payload?: Json | null
          phone?: string | null
          property_address?: string | null
          resolved?: boolean
          resolved_at?: string | null
          retry_count?: number
          situation_slug?: string | null
          source?: string | null
        }
        Relationships: []
      }
      lead_scoring_log: {
        Row: {
          category: string
          created_at: string | null
          id: string
          lead_id: string
          model_used: string | null
          raw_input: Json | null
          raw_output: Json | null
          reason: string | null
          score: number
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          lead_id: string
          model_used?: string | null
          raw_input?: Json | null
          raw_output?: Json | null
          reason?: string | null
          score: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          model_used?: string | null
          raw_input?: Json | null
          raw_output?: Json | null
          reason?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_scoring_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          auto_routed: boolean | null
          consent_promotional: boolean
          consent_transactional: boolean
          created_at: string
          email: string | null
          expected_close_date: string | null
          fbclid: string | null
          gclid: string | null
          id: string
          lead_category: string | null
          lead_score: number | null
          listed_with_agent: string | null
          market_slug: string
          msclkid: string | null
          name: string
          notes: string | null
          offer_amount: number | null
          page_path: string | null
          phone: string
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          property_address: string | null
          property_age: string | null
          scored_at: string | null
          scoring_reason: string | null
          situation_slug: string
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          timeline_to_sell: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          assigned_to?: string | null
          auto_routed?: boolean | null
          consent_promotional?: boolean
          consent_transactional?: boolean
          created_at?: string
          email?: string | null
          expected_close_date?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          lead_category?: string | null
          lead_score?: number | null
          listed_with_agent?: string | null
          market_slug: string
          msclkid?: string | null
          name: string
          notes?: string | null
          offer_amount?: number | null
          page_path?: string | null
          phone: string
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          property_address?: string | null
          property_age?: string | null
          scored_at?: string | null
          scoring_reason?: string | null
          situation_slug: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          timeline_to_sell?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          assigned_to?: string | null
          auto_routed?: boolean | null
          consent_promotional?: boolean
          consent_transactional?: boolean
          created_at?: string
          email?: string | null
          expected_close_date?: string | null
          fbclid?: string | null
          gclid?: string | null
          id?: string
          lead_category?: string | null
          lead_score?: number | null
          listed_with_agent?: string | null
          market_slug?: string
          msclkid?: string | null
          name?: string
          notes?: string | null
          offer_amount?: number | null
          page_path?: string | null
          phone?: string
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          property_address?: string | null
          property_age?: string | null
          scored_at?: string | null
          scoring_reason?: string | null
          situation_slug?: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          timeline_to_sell?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          created_at: string
          id: string
          market_slug: string
          message_text: string
          model_used: string | null
          situation_slug: string
          status: string
          step: number
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          market_slug: string
          message_text: string
          model_used?: string | null
          situation_slug: string
          status?: string
          step: number
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          market_slug?: string
          message_text?: string
          model_used?: string | null
          situation_slug?: string
          status?: string
          step?: number
          version?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      lead_status: "new" | "contacted" | "qualified" | "closed" | "lost"
      pipeline_stage:
        | "new"
        | "contacted"
        | "offer_made"
        | "under_contract"
        | "closed"
        | "lost"
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
      app_role: ["admin", "moderator", "user"],
      lead_status: ["new", "contacted", "qualified", "closed", "lost"],
      pipeline_stage: [
        "new",
        "contacted",
        "offer_made",
        "under_contract",
        "closed",
        "lost",
      ],
    },
  },
} as const
