import { supabase } from "@/lib/supabaseClient";

export type PlanDayResponse = {
  mode: string;
  proposed_blocks: { title: string; start: string; end: string; memo?: string }[];
  warnings?: string[];
};

export async function planDay(params: {
  selectedDate: string;
  prompt: string;
}): Promise<PlanDayResponse> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Not logged in");

  const res = await fetch("/api/ai/plan-day", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "AI request failed");
  }

  return data as PlanDayResponse;
}