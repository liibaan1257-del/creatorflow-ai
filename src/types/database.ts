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
export type ProjectType = "blog_post" | "video_script" | "social_caption" | "image" | "other";
export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";
export type GenerationType = "blog_post" | "video_script" | "social_caption" | "other";
export type SubscriptionPlan = "free" | "pro" | "business";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          prompt: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          prompt?: string;
          image_url?: string;
          created_at?: string;
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
    Functions: { [_ in never]: never };
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
