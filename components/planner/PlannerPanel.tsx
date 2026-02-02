"use client";

import Link from "next/link";
import { useState } from "react";
import { planDay } from "@/lib/aiClient";
import type { PlanDayResponse } from "@/lib/aiClient";
import { Card } from "@/components/ui/card";
import { fetchSubscription } from "@/lib/subscriptionClient";
import type { SubscriptionRow } from "@/lib/billing";

type Msg = { role: "assistant" | "user"; text: string };

export function PlannerPanel({
  selectedDate,
  onSubscriptionChange,
}: {
  selectedDate: string;
  onSubscriptionChange?: (sub: SubscriptionRow | null) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hey — tell me what you want to accomplish today." },
  ]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanDayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshSub() {
    if (!onSubscriptionChange) return;
    const s = await fetchSubscription();
    onSubscriptionChange(s);
  }

  async function send() {
    const p = prompt.trim();
    if (!p || loading) return;

    setError(null);
    setLoading(true);

    setMessages((m) => [...m, { role: "user", text: p }]);
    setPrompt("");

    try {
      const res = await planDay({ selectedDate, prompt: p });
      setPlan(res);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Got it. Here’s a proposed schedule you can accept or edit." },
      ]);
      await refreshSub();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      await refreshSub();
    } finally {
      setLoading(false);
    }
  }

  const isTokenError =
    (error || "").toLowerCase().includes("token") ||
    (error || "").toLowerCase().includes("upgrade");

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-[28px] bg-background/45 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
      {/* top hint row */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80 soft-hover">
          Plan day · 250 tokens
        </div>

        {plan?.warnings?.length ? (
          <div className="rounded-full bg-muted/45 px-3 py-1 text-xs text-muted-foreground soft-hover">
            {plan.warnings.length} note{plan.warnings.length === 1 ? "" : "s"}
          </div>
        ) : (
          <div className="rounded-full bg-muted/30 px-3 py-1 text-xs text-muted-foreground soft-hover">
            calm mode
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={[
              "max-w-[90%] rounded-2xl px-3 py-2 text-sm soft-hover",
              m.role === "user" ? "ml-auto bg-secondary/60" : "bg-card/70",
            ].join(" ")}
          >
            {m.text}
          </div>
        ))}

        {error && (
          <div className="rounded-2xl bg-muted/40 px-3 py-3 text-sm text-foreground soft-hover">
            <div className="font-medium">Heads up</div>
            <div className="mt-1 text-muted-foreground">{error}</div>

            {isTokenError && (
              <div className="mt-3">
                <Link
                  href="/settings/billing"
                  className="inline-flex rounded-full bg-primary/20 px-4 py-2 text-xs text-foreground soft-hover hover:bg-primary/30"
                >
                  Upgrade plan →
                </Link>
              </div>
            )}
          </div>
        )}

        {plan?.warnings?.length ? (
          <div className="rounded-2xl bg-accent/40 px-3 py-2 text-sm text-foreground/90 soft-hover">
            <div className="font-medium">Notes</div>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {plan.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {plan?.proposed_blocks?.length ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Proposed blocks</div>

            {plan.proposed_blocks.map((b, i) => (
              <Card key={i} className="rounded-2xl bg-card/70 p-3 soft-hover">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{b.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.start} – {b.end}
                    </div>
                    {b.memo ? (
                      <div className="mt-1 text-xs text-muted-foreground">{b.memo}</div>
                    ) : null}
                  </div>

                  <button className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground press soft-hover hover:bg-muted/70">
                    Accept
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border/40 p-3">
        <div className="flex items-center gap-2 rounded-2xl bg-card/60 p-2 soft-hover">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={loading ? "Planning…" : "Ask AI to plan your day…"}
            disabled={loading}
          />
          <button
            onClick={send}
            className="rounded-2xl bg-primary/80 px-3 py-2 text-sm press soft-hover hover:bg-primary disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}