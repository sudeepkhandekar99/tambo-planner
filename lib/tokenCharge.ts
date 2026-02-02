import type { SubscriptionRow } from "@/lib/billing";
import { supabaseServer } from "@/lib/supabaseServer";

export type TokenAction =
  | "plan_day"
  | "regen_plan"
  | "habit_suggest"
  | "habit_insights"
  | "explain_conflicts";

export const ACTION_COST: Record<TokenAction, number> = {
  plan_day: 250,
  regen_plan: 250,
  habit_suggest: 150,
  habit_insights: 200,
  explain_conflicts: 120,
};

async function getSubscription(userId: string) {
  const { data, error } = await supabaseServer
    .from("subscriptions")
    .select(
      "user_id,plan,status,trial_ends_at,period_start,period_end,tokens_monthly_limit,tokens_used,updated_at"
    )
    .eq("user_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data as SubscriptionRow;
}

async function resetIfNeeded(userId: string) {
  const { error } = await supabaseServer.rpc("reset_tokens_if_needed", {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
}

/**
 * Charge tokens for an action. Throws if insufficient.
 * Use inside Next.js route handlers only.
 */
export async function chargeTokens(params: {
  userId: string;
  action: TokenAction;
  meta?: Record<string, unknown>;
}) {
  const { userId, action, meta } = params;
  const cost = ACTION_COST[action];

  // 1) reset period if needed
  await resetIfNeeded(userId);

  // 2) reload subscription after reset
  const sub = await getSubscription(userId);

  // Simple MVP rule: if canceled, block AI usage
  if (sub.status === "canceled") {
    throw new Error("Your plan is inactive. Upgrade to continue using AI.");
  }

  const remaining = Math.max(0, sub.tokens_monthly_limit - sub.tokens_used);
  if (remaining < cost) {
    throw new Error("You’re out of tokens. Upgrade your plan to continue.");
  }

  // 3) increment tokens_used atomically-ish (MVP)
  const { error: updErr } = await supabaseServer
    .from("subscriptions")
    .update({
      tokens_used: sub.tokens_used + cost,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updErr) throw new Error(updErr.message);

  // 4) log transaction (optional)
  const { error: txErr } = await supabaseServer.from("token_transactions").insert({
    user_id: userId,
    action,
    tokens_charged: cost,
    meta_json: meta ?? {},
  });

  // If logging fails, don’t block the user
  if (txErr) {
    // eslint-disable-next-line no-console
    console.warn("token_transactions insert failed:", txErr.message);
  }

  return { cost, remainingAfter: remaining - cost };
}