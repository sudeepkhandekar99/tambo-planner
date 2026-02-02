"use client";

import Link from "next/link";
import { SubscriptionRow, isLowTokens, isOutOfTokens, planLabel, tokensRemaining, usagePct } from "@/lib/billing";

export function TokenPill({ sub }: { sub: SubscriptionRow | null }) {
  if (!sub) {
    return (
      <div className="rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80 soft-hover">
        Loading plan…
      </div>
    );
  }

  const remaining = tokensRemaining(sub);
  const pct = usagePct(sub);
  const low = isLowTokens(sub);
  const out = isOutOfTokens(sub);

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80 soft-hover">
        {planLabel(sub.plan)} · {remaining.toLocaleString()} tokens
      </div>

      {/* Tiny usage bar */}
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-primary/80 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {(low || out) && (
        <Link
          href="/settings/billing"
          className="rounded-full bg-primary/20 px-3 py-1 text-xs text-foreground soft-hover hover:bg-primary/30"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}