import { supabase } from "@/lib/supabaseClient";
import type { SubscriptionRow } from "@/lib/billing";

export async function fetchSubscription(): Promise<SubscriptionRow | null> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) return null;

  const res = await fetch("/api/billing/subscription", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return (await res.json()) as SubscriptionRow;
}