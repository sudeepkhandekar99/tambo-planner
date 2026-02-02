"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { planDay } from "@/lib/aiClient";
import type { PlanDayResponse } from "@/lib/aiClient";
import { fetchSubscription } from "@/lib/subscriptionClient";
import { useAppStore } from "@/lib/appStore";

type Msg = { role: "assistant" | "user"; text: string };

export function AiChatPanel() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const openBilling = useAppStore((s) => s.openBilling);
  const openProfile = useAppStore((s) => s.openProfile);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Tell me what you want to accomplish today." },
  ]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanDayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

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
        { role: "assistant", text: "Done. Want me to turn this into calendar events?" },
      ]);

      await fetchSubscription().catch(() => null);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      await fetchSubscription().catch(() => null);
    } finally {
      setLoading(false);
    }
  }

  const isTokenError =
    (error || "").toLowerCase().includes("token") ||
    (error || "").toLowerCase().includes("upgrade");

  return (
    <div className="flex h-[720px] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-2xl tracking-tight">AI planner</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80 soft-hover">
              {dateLabel}
            </span>
            <span className="rounded-full bg-muted/18 px-3 py-1 text-xs text-muted-foreground soft-hover">
              Plan day · 250 tokens
            </span>
          </div>
        </div>

        {/* Quiet quick nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={openBilling}
            className="rounded-full bg-muted/12 px-3 py-1 text-xs text-muted-foreground soft-hover hover:bg-muted/22 hover:text-foreground press"
          >
            Billing
          </button>
          <button
            onClick={openProfile}
            className="rounded-full bg-muted/12 px-3 py-1 text-xs text-muted-foreground soft-hover hover:bg-muted/22 hover:text-foreground press"
          >
            Profile
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 overflow-hidden rounded-[26px] bg-background/45 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="h-full overflow-auto p-5 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={[
                "max-w-[92%] rounded-2xl px-4 py-2 text-sm leading-relaxed soft-hover",
                m.role === "user"
                  ? "ml-auto bg-secondary/60"
                  : "bg-card/70",
              ].join(" ")}
            >
              {m.text}
            </div>
          ))}

          {error && (
            <div className="rounded-2xl bg-muted/28 px-4 py-3 text-sm text-foreground soft-hover">
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
            <Card className="rounded-2xl bg-accent/30 p-4 soft-hover">
              <div className="text-sm font-medium">Notes</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                {plan.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {plan?.proposed_blocks?.length ? (
            <div className="space-y-2 pt-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Proposed blocks
              </div>

              {plan.proposed_blocks.map((b, i) => (
                <Card key={i} className="rounded-2xl bg-card/70 p-4 soft-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.start} – {b.end}
                      </div>
                      {b.memo ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {b.memo}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-full bg-primary/15 px-3 py-1 text-xs text-muted-foreground">
                      AI
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Input (anchored) */}
      <div className="mt-4 rounded-[26px] bg-card/60 p-2 soft-hover">
        <div className="flex items-center gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            className="w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={loading ? "Planning…" : "Ask AI to plan your day…"}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-2xl bg-primary/80 px-4 py-2 text-sm press soft-hover hover:bg-primary disabled:opacity-60"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}