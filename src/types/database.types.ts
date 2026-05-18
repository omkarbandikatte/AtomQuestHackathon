/**
 * Generated Supabase Database types.
 * In production, regenerate with: npm run db:generate-types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "employee" | "manager" | "admin";
          manager_id: string | null;
          department: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          role: "employee" | "manager" | "admin";
          manager_id?: string | null;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "employee" | "manager" | "admin";
          manager_id?: string | null;
          department?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "users_manager_fk";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      cycles: {
        Row: {
          id: string;
          name: string;
          goal_setting_opens: string;
          q1_opens: string;
          q2_opens: string;
          q3_opens: string;
          q4_opens: string;
          cycle_closes: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          goal_setting_opens: string;
          q1_opens: string;
          q2_opens: string;
          q3_opens: string;
          q4_opens: string;
          cycle_closes: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          goal_setting_opens?: string;
          q1_opens?: string;
          q2_opens?: string;
          q3_opens?: string;
          q4_opens?: string;
          cycle_closes?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      goal_sheets: {
        Row: {
          id: string;
          employee_id: string;
          cycle_id: string;
          status: "draft" | "submitted" | "approved" | "returned";
          is_locked: boolean;
          approved_by: string | null;
          approved_at: string | null;
          submitted_at: string | null;
          return_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          cycle_id: string;
          status?: "draft" | "submitted" | "approved" | "returned";
          is_locked?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          submitted_at?: string | null;
          return_comment?: string | null;
        };
        Update: {
          status?: "draft" | "submitted" | "approved" | "returned";
          is_locked?: boolean;
          approved_by?: string | null;
          approved_at?: string | null;
          submitted_at?: string | null;
          return_comment?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_sheets_employee_fk";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goal_sheets_cycle_fk";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "cycles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goal_sheets_approved_by_fk";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          id: string;
          goal_sheet_id: string;
          thrust_area: string;
          title: string;
          description: string | null;
          uom_type: "numeric_min" | "numeric_max" | "timeline" | "zero";
          target_value: number | null;
          target_date: string | null;
          weightage: number;
          is_shared: boolean;
          shared_owner_id: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          goal_sheet_id: string;
          thrust_area: string;
          title: string;
          description?: string | null;
          uom_type: "numeric_min" | "numeric_max" | "timeline" | "zero";
          target_value?: number | null;
          target_date?: string | null;
          weightage: number;
          is_shared?: boolean;
          shared_owner_id?: string | null;
          sort_order?: number;
        };
        Update: {
          thrust_area?: string;
          title?: string;
          description?: string | null;
          uom_type?: "numeric_min" | "numeric_max" | "timeline" | "zero";
          target_value?: number | null;
          target_date?: string | null;
          weightage?: number;
          is_shared?: boolean;
          shared_owner_id?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "goals_sheet_fk";
            columns: ["goal_sheet_id"];
            isOneToOne: false;
            referencedRelation: "goal_sheets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_shared_owner_fk";
            columns: ["shared_owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      checkins: {
        Row: {
          id: string;
          goal_id: string;
          quarter: "Q1" | "Q2" | "Q3" | "Q4";
          actual_value: number | null;
          completion_date: string | null;
          status: "not_started" | "on_track" | "completed";
          progress_score: number | null;
          employee_id: string;
          manager_comment: string | null;
          manager_id: string | null;
          logged_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          quarter: "Q1" | "Q2" | "Q3" | "Q4";
          actual_value?: number | null;
          completion_date?: string | null;
          status?: "not_started" | "on_track" | "completed";
          progress_score?: number | null;
          employee_id: string;
          manager_comment?: string | null;
          manager_id?: string | null;
        };
        Update: {
          actual_value?: number | null;
          completion_date?: string | null;
          status?: "not_started" | "on_track" | "completed";
          progress_score?: number | null;
          manager_comment?: string | null;
          manager_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_goal_fk";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_employee_fk";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_manager_fk";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      shared_goal_links: {
        Row: {
          id: string;
          source_goal_id: string;
          target_goal_id: string;
          is_primary_owner: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_goal_id: string;
          target_goal_id: string;
          is_primary_owner?: boolean;
          created_by: string;
        };
        Update: {
          is_primary_owner?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "shared_goal_links_source_fk";
            columns: ["source_goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_goal_links_target_fk";
            columns: ["target_goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shared_goal_links_created_by_fk";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: number;
          goal_sheet_id: string;
          goal_id: string | null;
          actor_id: string;
          action: string;
          field_changed: string | null;
          old_value: string | null;
          new_value: string | null;
          reason: string | null;
          changed_at: string;
        };
        Insert: {
          goal_sheet_id: string;
          goal_id?: string | null;
          actor_id: string;
          action: string;
          field_changed?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          reason?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "audit_log_sheet_fk";
            columns: ["goal_sheet_id"];
            isOneToOne: false;
            referencedRelation: "goal_sheets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_log_goal_fk";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_log_actor_fk";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: "info" | "approval" | "rejection" | "reminder" | "unlock";
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          type?: "info" | "approval" | "rejection" | "reminder" | "unlock";
          is_read?: boolean;
          link?: string | null;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      compute_progress_score: {
        Args: {
          p_uom_type: string;
          p_target: number;
          p_actual: number;
          p_target_date: string;
          p_completion_date: string;
        };
        Returns: number;
      };
      approve_goal_sheet: {
        Args: {
          p_sheet_id: string;
          p_manager_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
