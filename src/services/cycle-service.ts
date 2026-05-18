import { createClient } from "@/lib/supabase/client";
import type { Cycle } from "@/types/app.types";

export class CycleService {
  static async getActiveCycle(): Promise<Cycle | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cycles")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getAllCycles(): Promise<Cycle[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cycles")
      .select("*")
      .order("goal_setting_opens", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
