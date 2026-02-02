"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { DEMO_UPGRADES_ENABLED } from "@/lib/demoFlags";
import {
  SubscriptionRow,
  daysUntil,
  planLabel,
  tokensRemaining,
  usagePct,
} from "@/lib/billing";
import { fetchSubscription } from "@/lib/subscriptionClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/appStore";

type Tier = "starter_1" | "pro_5" | "max_10";
type TokenTx = { id: string; action: string; tokens_charged: number; created_at: string };

const PLAN_LIMITS: Record<Exclude<SubscriptionRow["plan"], "trial">, number> = {
  starter_1: 2500,
  pro_5: 12000,
  max_10: 30000,
};

export function BillingPanel() {
  const openAi = useAppStore((s) => s.openAi);

  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [tx, setTx] = useState<TokenTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTier, setBusyTier] = useState<Tier | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const s = await fetchSubscription();
        setSub(s);

        const { data: sess } = await supabase.auth.getSession();
        const uid = sess.session?.user.id;
        if (uid) {
          const { data } = await supabase
            .from("token_transactions")
            .select("id,action,tokens_charged,created_at")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(6);

          setTx((data ?? []) as TokenTx[]);
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to load billing");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const pct = useMemo(() => (sub ? usagePct(sub) : 0), [sub]);
  const remaining = useMemo(() => (sub ? tokensRemaining(sub) : 0), [sub]);
  const trialDays = useMemo(() => (sub ? daysUntil(sub.trial_ends_at) : null), [sub]);

  async function demoUpgrade(tier: Tier) {
    if (!sub) return;

    if (!DEMO_UPGRADES_ENABLED) {
      toast.message("Upgrades disabled in this build.");
      return;
    }

    setBusyTier(tier);
    try {
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

      if (error) throw new Error(error.message);

      toast.success("Plan updated (demo)");
      const refreshed = await fetchSubscription();
      setSub(refreshed);
    } catch (e: any) {
      toast.error(e.message || "Upgrade failed");
    } finally {
      setBusyTier(null);
    }
  }

  return (
    <div className="flex h-[720px] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-2xl tracking-tight">Billing</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Your plan and token usage.
          </div>
        </div>

        <Button
          variant="secondary"
          className="rounded-2xl press soft-hover"
          onClick={openAi}
        >
          Back
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Plan + tokens */}
        <Card className="rounded-[26px] bg-background/45 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/2 rounded-full bg-muted" />
              <div className="h-3 w-2/3 rounded-full bg-muted" />
              <div className="h-2 w-full rounded-full bg-muted" />
            </div>
          ) : !sub ? (
            <div className="text-sm text-muted-foreground">No subscription found.</div>
          ) : (
            <div className="space-y-4">
              {/* top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Current plan</div>
                  <div className="mt-1 font-display text-2xl tracking-tight">
                    {planLabel(sub.plan)}
                  </div>

                  {sub.plan === "trial" && trialDays !== null ? (
                    <div className="mt-2 inline-flex rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80">
                      Trial ends in {trialDays} day{trialDays === 1 ? "" : "s"}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-muted/16 px-4 py-3 text-right soft-hover">
                  <div className="text-xs text-muted-foreground">Tokens left</div>
                  <div className="mt-0.5 text-lg font-medium">
                    {remaining.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">{pct}% used</div>
                </div>
              </div>

              {/* usage bar */}
              <div className="h-2 overflow-hidden rounded-full bg-muted/55">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="text-[11px] text-muted-foreground">
                Token usage updates as you run AI actions.
              </div>
            </div>
          )}
        </Card>

        {/* Upgrade */}
        <Card className="rounded-[26px] bg-background/45 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="font-display text-lg tracking-tight">Upgrade</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Choose a plan that matches how often you plan.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <PlanRow
              label="$1 / month"
              note="2,500 tokens"
              active={sub?.plan === "starter_1"}
              disabled={!DEMO_UPGRADES_ENABLED}
              loading={busyTier === "starter_1"}
              onClick={() => demoUpgrade("starter_1")}
            />
            <PlanRow
              label="$5 / month"
              note="12,000 tokens"
              active={sub?.plan === "pro_5"}
              disabled={!DEMO_UPGRADES_ENABLED}
              loading={busyTier === "pro_5"}
              onClick={() => demoUpgrade("pro_5")}
            />
            <PlanRow
              label="$10 / month"
              note="30,000 tokens"
              active={sub?.plan === "max_10"}
              disabled={!DEMO_UPGRADES_ENABLED}
              loading={busyTier === "max_10"}
              onClick={() => demoUpgrade("max_10")}
            />
          </div>

          <div className="mt-3 text-[11px] text-muted-foreground">
            {DEMO_UPGRADES_ENABLED
              ? "Demo mode: buttons update plan in DB. Stripe later."
              : "Upgrades disabled in this build."}
          </div>
        </Card>

        {/* TODO: Recent usage */}
        {/* <Card className="rounded-[26px] bg-background/45 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-display text-lg tracking-tight">Recent usage</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Last few token-charged actions.
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">last 6</div>
          </div>

          <div className="mt-4 space-y-2">
            {tx.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No usage yet. Try “plan my day”.
              </div>
            ) : (
              tx.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-2xl bg-muted/14 px-3 py-2 soft-hover"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {formatAction(t.action)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-full bg-muted/25 px-3 py-1 text-xs text-muted-foreground">
                    -{t.tokens_charged}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card> */}
      </div>
    </div>
  );
}

function PlanRow({
  label,
  note,
  active,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  note: string;
  active: boolean;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "w-full rounded-2xl px-4 py-3 text-left press soft-hover transition",
        active
          ? "bg-primary/18 ring-1 ring-primary/25"
          : "bg-muted/14 hover:bg-muted/24",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{note}</div>
        </div>
        <div className="text-xs text-muted-foreground">
          {loading ? "…" : active ? "Current" : "Choose"}
        </div>
      </div>
    </button>
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