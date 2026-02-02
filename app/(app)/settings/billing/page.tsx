"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_UPGRADES_ENABLED } from "@/lib/demoFlags";
import {
  SubscriptionRow,
  daysUntil,
  isLowTokens,
  isOutOfTokens,
  planLabel,
  planTokenHint,
  tokensRemaining,
  usagePct,
} from "@/lib/billing";

type Tier = "starter_1" | "pro_5" | "max_10";

const PLAN_LIMITS: Record<Exclude<SubscriptionRow["plan"], "trial">, number> = {
  starter_1: 2500,
  pro_5: 12000,
  max_10: 30000,
};

type TokenTx = {
  id: string;
  action: string;
  tokens_charged: number;
  created_at: string;
};

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [tx, setTx] = useState<TokenTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<Tier | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const usedPct = useMemo(() => (sub ? usagePct(sub) : 0), [sub]);
  const remaining = useMemo(() => (sub ? tokensRemaining(sub) : 0), [sub]);
  const trialDays = useMemo(() => (sub ? daysUntil(sub.trial_ends_at) : null), [sub]);
  const low = useMemo(() => (sub ? isLowTokens(sub) : false), [sub]);
  const out = useMemo(() => (sub ? isOutOfTokens(sub) : false), [sub]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg(null);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const [subRes, txRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select(
            "user_id,plan,status,trial_ends_at,period_start,period_end,tokens_monthly_limit,tokens_used,updated_at"
          )
          .eq("user_id", uid)
          .single(),
        supabase
          .from("token_transactions")
          .select("id,action,tokens_charged,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (subRes.error) setMsg(subRes.error.message);
      if (subRes.data) setSub(subRes.data as SubscriptionRow);

      if (!txRes.error && txRes.data) setTx(txRes.data as TokenTx[]);

      setLoading(false);
    }

    load();
  }, []);

  async function demoUpgrade(tier: Tier) {
    if (!sub) return;

    if (!DEMO_UPGRADES_ENABLED) {
      setMsg("Upgrades are disabled in this build.");
      setTimeout(() => setMsg(null), 2000);
      return;
    }

    setBusyTier(tier);
    setMsg(null);

    const newLimit = PLAN_LIMITS[tier];

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan: tier,
        status: "active",
        tokens_monthly_limit: newLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", sub.user_id);

    if (error) {
      setMsg(error.message);
      setBusyTier(null);
      return;
    }

    setSub({
      ...sub,
      plan: tier,
      status: "active",
      tokens_monthly_limit: newLimit,
      updated_at: new Date().toISOString(),
    });

    setBusyTier(null);
    setMsg("Updated plan (demo).");
    setTimeout(() => setMsg(null), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-tight">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tokens power actions like “plan my day”, “regenerate”, and “habit insights”.
        </p>
      </div>

      {/* Current plan */}
      <Card className="soft-card p-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded-full bg-muted" />
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="h-3 w-1/2 rounded-full bg-muted" />
          </div>
        ) : !sub ? (
          <div className="text-sm text-muted-foreground">No subscription found.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Current plan</div>
                <div className="mt-1 font-display text-2xl tracking-tight">
                  {planLabel(sub.plan)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {planTokenHint(sub.plan)}
                </div>

                {sub.plan === "trial" && trialDays !== null && (
                  <div className="mt-3 inline-flex rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80 soft-hover">
                    Trial ends in {trialDays} day{trialDays === 1 ? "" : "s"}
                  </div>
                )}
              </div>

              <div className="min-w-[240px]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tokens used</span>
                  <span className="text-foreground">
                    {sub.tokens_used.toLocaleString()} / {sub.tokens_monthly_limit.toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-300"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  {remaining.toLocaleString()} tokens remaining
                  {out ? " · out of tokens" : low ? " · low tokens" : ""}
                </div>
              </div>
            </div>

            {msg && (
              <div className="mt-4 rounded-2xl bg-muted/40 px-3 py-2 text-sm text-foreground soft-hover">
                {msg}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Upgrade options */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PlanCard
          title="$1 / month"
          subtitle="Light usage"
          tokens="2,500 tokens / month"
          active={sub?.plan === "starter_1"}
          onClick={() => demoUpgrade("starter_1")}
          loading={busyTier === "starter_1"}
          disabled={!DEMO_UPGRADES_ENABLED}
        />
        <PlanCard
          title="$5 / month"
          subtitle="Most popular"
          tokens="12,000 tokens / month"
          active={sub?.plan === "pro_5"}
          onClick={() => demoUpgrade("pro_5")}
          loading={busyTier === "pro_5"}
          disabled={!DEMO_UPGRADES_ENABLED}
        />
        <PlanCard
          title="$10 / month"
          subtitle="Heavy planning"
          tokens="30,000 tokens / month"
          active={sub?.plan === "max_10"}
          onClick={() => demoUpgrade("max_10")}
          loading={busyTier === "max_10"}
          disabled={!DEMO_UPGRADES_ENABLED}
        />
      </div>

      {/* Recent usage */}
      <Card className="mt-6 soft-card p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-xl tracking-tight">Recent token usage</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Last 10 actions that consumed tokens.
            </div>
          </div>
          <div className="text-xs text-muted-foreground">auto updates</div>
        </div>

        <div className="mt-4 space-y-2">
          {tx.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No token usage yet. Try planning your day on the home screen.
            </div>
          ) : (
            tx.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-2xl bg-card/60 px-3 py-2 text-sm soft-hover"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{formatAction(t.action)}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                  -{t.tokens_charged}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="mt-6 text-xs text-muted-foreground">
        {DEMO_UPGRADES_ENABLED
          ? "Demo mode: upgrade buttons update your plan in the database. Stripe can be added later."
          : "Upgrades are disabled in this build. Connect Stripe/webhooks to enable plan changes."}
      </div>
    </div>
  );
}

function PlanCard({
  title,
  subtitle,
  tokens,
  active,
  onClick,
  loading,
  disabled,
}: {
  title: string;
  subtitle: string;
  tokens: string;
  active: boolean;
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <Card className={`soft-card p-5 soft-hover ${active ? "ring-2 ring-ring" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-xl tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
          <div className="mt-3 text-xs text-muted-foreground">{tokens}</div>
        </div>
        {active && (
          <div className="rounded-full bg-primary/20 px-3 py-1 text-xs text-foreground">
            Current
          </div>
        )}
      </div>

      <Button
        className="mt-5 w-full rounded-2xl press soft-hover"
        variant={active ? "secondary" : "default"}
        onClick={onClick}
        disabled={loading || disabled}
      >
        {loading ? "Updating…" : active ? "Selected" : disabled ? "Unavailable" : "Choose plan"}
      </Button>
    </Card>
  );
}

function formatAction(a: string) {
  switch (a) {
    case "plan_day":
      return "Plan day";
    case "regen_plan":
      return "Regenerate plan";
    case "habit_suggest":
      return "Habit suggestion";
    case "habit_insights":
      return "Habit insights";
    case "explain_conflicts":
      return "Explain conflicts";
    default:
      return a.replaceAll("_", " ");
  }
}