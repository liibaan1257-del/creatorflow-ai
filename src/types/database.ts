/**
 * Database types for the Supabase client.
 *
 * Mirrors `supabase/migrations`. After schema changes, regenerate with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
 * (then re-add the convenience aliases at the bottom).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Values allowed by the CHECK constraints in the schema. */
export type ContentType =
  | "blog_post"
  | "blog_outline"
  | "social_post"
  | "youtube_title"
  | "youtube_description"
  | "youtube_script"
  | "seo_title"
  | "meta_description"
  | "product_description";
export type ProjectType = ContentType | "video_script" | "social_caption" | "image" | "other";
export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";
export type GenerationType = ContentType | "image" | "video_script" | "social_caption" | "other";
export type SubscriptionPlan = "free" | "pro" | "business";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";
export type CreditReason =
  | "signup_grant"
  | "monthly_reset"
  | "generation"
  | "regeneration"
  | "image"
  | "image_regeneration"
  | "plan_change"
  | "adjustment";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          default_tone: string | null;
          default_language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          default_tone?: string | null;
          default_language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          default_tone?: string | null;
          default_language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: ProjectType;
          content: string;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
          brief: Json | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          type?: ProjectType;
          content?: string;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
          brief?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: ProjectType;
          content?: string;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
          brief?: Json | null;
        };
        Relationships: [];
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          prompt: string;
          output: string | null;
          type: GenerationType;
          credits_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          prompt: string;
          output?: string | null;
          type: GenerationType;
          credits_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          prompt?: string;
          output?: string | null;
          type?: GenerationType;
          credits_used?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      generated_images: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          prompt: string;
          image_url: string;
          created_at: string;
          generation_id: string | null;
          style: string | null;
          aspect_ratio: string | null;
          width: number | null;
          height: number | null;
          model: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          prompt: string;
          image_url: string;
          created_at?: string;
          generation_id?: string | null;
          style?: string | null;
          aspect_ratio?: string | null;
          width?: number | null;
          height?: number | null;
          model?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          prompt?: string;
          image_url?: string;
          created_at?: string;
          generation_id?: string | null;
          style?: string | null;
          aspect_ratio?: string | null;
          width?: number | null;
          height?: number | null;
          model?: string | null;
        };
        Relationships: [];
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          monthly_limit: number;
          reset_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          monthly_limit?: number;
          reset_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          monthly_limit?: number;
          reset_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: { id: SubscriptionPlan; name: string; monthly_credits: number; sort_order: number };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          balance_after: number;
          reason: CreditReason;
          generation_id: string | null;
          created_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          started_at: string;
          expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      hit_rate_limit: {
        Args: { p_bucket: string };
        Returns: number;
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_my_credits: {
        Args: Record<string, never>;
        Returns: {
          balance: number;
          monthly_limit: number;
          reset_date: string;
          plan: SubscriptionPlan;
          plan_name: string;
        }[];
      };
      generation_cost: {
        Args: { p_type: string };
        Returns: number | null;
      };
      record_image_generation: {
        Args: {
          p_prompt: string;
          p_image_path: string;
          p_style: string;
          p_aspect_ratio: string;
          p_width: number;
          p_height: number;
          p_model: string;
          p_source_image_id?: string;
        };
        Returns: { image_id: string; generation_id: string; credits_used: number; balance: number }[];
      };
      record_generation: {
        Args: {
          p_type: string;
          p_prompt: string;
          p_output: string;
          p_project_id?: string;
          p_is_regeneration?: boolean;
        };
        Returns: { generation_id: string; credits_used: number; balance: number }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];

export type Profile = Row<"profiles">;
export type Project = Row<"projects">;
export type Generation = Row<"generations">;
export type GeneratedImage = Row<"generated_images">;
export type Credits = Row<"credits">;
export type Subscription = Row<"subscriptions">;
export type Plan = Row<"plans">;
export type CreditTransaction = Row<"credit_transactions">;
export type CreditSummary = Database["public"]["Functions"]["get_my_credits"]["Returns"][number];
