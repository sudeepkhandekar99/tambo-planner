"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TokenPill } from "@/components/billing/TokenPill";
import type { SubscriptionRow } from "@/lib/billing";
import { fetchSubscription } from "@/lib/subscriptionClient";
import { PlannerPanel } from "@/components/planner/PlannerPanel";

export default function AppHome() {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);

  const selectedDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      const s = await fetchSubscription();
      setSub(s);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-tight leading-tight">
          Plan gently.
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">
          Your calendar in the center, your AI planner on the right — accept, edit,
          import. Warm vibes only.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8 soft-card p-6 soft-hover">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl tracking-tight">Calendar</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Day view coming next (react-big-calendar).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground soft-hover">
                Day
              </button>
              <button className="rounded-full bg-muted/30 px-3 py-1 text-xs text-muted-foreground soft-hover hover:bg-muted/60">
                Week
              </button>
              <button className="rounded-full bg-muted/30 px-3 py-1 text-xs text-muted-foreground soft-hover hover:bg-muted/60">
                Month
              </button>
            </div>
          </div>

          <div className="mt-6 h-[560px] rounded-[28px] bg-background/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]" />
        </Card>

        <Card className="col-span-4 soft-card p-6 soft-hover">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight">AI Planner</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Chat + proposed plan live here.
              </p>
            </div>

            <TokenPill sub={sub} />
          </div>

          <div className="mt-6">
            <PlannerPanel selectedDate={selectedDate} onSubscriptionChange={setSub} />
          </div>
        </Card>
      </div>
    </div>
  );
}