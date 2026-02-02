"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchSubscription } from "@/lib/subscriptionClient";
import type { SubscriptionRow } from "@/lib/billing";
import { planLabel, tokensRemaining, usagePct } from "@/lib/billing";
import { useAppStore } from "@/lib/appStore";

export function AppSidebar() {
  const mode = useAppStore((s) => s.workspaceMode);
  const openAi = useAppStore((s) => s.openAi);
  const openBilling = useAppStore((s) => s.openBilling);
  const openProfile = useAppStore((s) => s.openProfile);

  const [profileName, setProfileName] = useState<string>("Loading…");
  const [initials, setInitials] = useState<string>("—");
  const [sub, setSub] = useState<SubscriptionRow | null>(null);

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return;

      const [{ data: p }, s] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", uid).single(),
        fetchSubscription(),
      ]);

      const name = (p?.name || "You").trim() || "You";
      setProfileName(name);

      const parts = name.split(" ").filter(Boolean);
      const init = (
        (parts[0]?.[0] || "Y") +
        (parts.length > 1 ? parts[parts.length - 1][0] : "")
      ).toUpperCase();
      setInitials(init);

      setSub(s);
    }

    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const pct = useMemo(() => (sub ? usagePct(sub) : 0), [sub]);
  const remaining = useMemo(() => (sub ? tokensRemaining(sub) : 0), [sub]);

  const isCalendarActive = mode === "ai" || mode === "event";
  const isBillingActive = mode === "billing";
  const isProfileActive = mode === "profile";

  function NavButton({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        onClick={onClick}
        className={[
          "relative w-full text-left rounded-2xl px-3 py-2",
          "soft-hover press transition",
          active
            ? "bg-primary/20 text-foreground ring-1 ring-primary/25"
            : "bg-muted/18 text-muted-foreground hover:bg-muted/32 hover:text-foreground",
        ].join(" ")}
      >
        {/* active dot */}
        <span
          className={[
            "absolute left-2 top-1/2 -translate-y-1/2",
            "h-2 w-2 rounded-full transition-all duration-200",
            active ? "bg-primary/80 opacity-100" : "bg-muted-foreground/40 opacity-0",
          ].join(" ")}
        />
        <div className="pl-3 flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs opacity-50">→</span>
        </div>
      </button>
    );
  }

  return (
    <aside className="soft-card p-4">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/70 shadow-sm soft-hover">
          <span className="font-display text-lg">✦</span>
        </div>
        <div className="leading-tight">
          <div className="font-display text-lg tracking-tight">tambo</div>
          <div className="text-xs text-muted-foreground">calm AI planning</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6">
        <div className="px-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          Navigation
        </div>
        <div className="mt-3 space-y-2">
          <NavButton label="Calendar" active={isCalendarActive} onClick={openAi} />
          <NavButton label="Billing" active={isBillingActive} onClick={openBilling} />
          <NavButton label="Profile" active={isProfileActive} onClick={openProfile} />
        </div>
      </div>

      {/* Plan & tokens */}
      <div className="mt-8">
        <div className="px-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          Plan & tokens
        </div>

        <div className="mt-3 rounded-2xl bg-muted/14 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">
                {sub ? planLabel(sub.plan) : "Loading…"}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {sub ? `${remaining.toLocaleString()} tokens left` : "—"}
              </div>
            </div>

            <div className="rounded-full bg-accent/45 px-2.5 py-1 text-[11px] text-foreground/80">
              {sub ? `${pct}% used` : "…"}
            </div>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/55">
            <div
              className="h-full rounded-full bg-primary/80 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 text-[11px] text-muted-foreground">
            Tokens power AI actions.
          </div>
        </div>
      </div>

      {/* User */}
      <div className="mt-8">
        <div className="rounded-2xl bg-muted/14 p-3 soft-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/70 font-semibold text-foreground">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{profileName}</div>
              <button
                onClick={logout}
                className="mt-0.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 px-1 text-[11px] text-muted-foreground">
          Click an event to edit on the right.
        </div>
      </div>
    </aside>
  );
}