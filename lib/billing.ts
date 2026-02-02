export type PlanTier = "trial" | "starter_1" | "pro_5" | "max_10";
export type SubStatus = "trialing" | "active" | "canceled";

export type SubscriptionRow = {
  user_id: string;
  plan: PlanTier;
  status: SubStatus;
  trial_ends_at: string | null;
  period_start: string;
  period_end: string;
  tokens_monthly_limit: number;
  tokens_used: number;
  updated_at: string;
};

export function planLabel(plan: PlanTier) {
  switch (plan) {
    case "trial":
      return "Trial";
    case "starter_1":
      return "$1 / month";
    case "pro_5":
      return "$5 / month";
    case "max_10":
      return "$10 / month";
    default:
      return "Plan";
  }
}

export function planTokenHint(plan: PlanTier) {
  // TODO: Can tweak these anytime
  switch (plan) {
    case "trial":
      return "Full experience for 30 days";
    case "starter_1":
      return "Light planning + quick edits";
    case "pro_5":
      return "Most people pick this";
    case "max_10":
      return "Heavy planning + lots of AI";
    default:
      return "";
  }
}

export function tokensRemaining(sub: SubscriptionRow) {
  return Math.max(0, sub.tokens_monthly_limit - sub.tokens_used);
}

export function usagePct(sub: SubscriptionRow) {
  if (sub.tokens_monthly_limit <= 0) return 0;
  return Math.min(100, Math.round((sub.tokens_used / sub.tokens_monthly_limit) * 100));
}

export function daysUntil(dateIso: string | null) {
  if (!dateIso) return null;
  const end = new Date(dateIso).getTime();
  const now = Date.now();
  const diff = end - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isLowTokens(sub: SubscriptionRow) {
  return tokensRemaining(sub) <= Math.floor(sub.tokens_monthly_limit * 0.15);
}

export function isOutOfTokens(sub: SubscriptionRow) {
  return tokensRemaining(sub) <= 0;
}