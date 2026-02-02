"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TokenPill } from "@/components/billing/TokenPill";
import type { SubscriptionRow } from "@/lib/billing";
import { fetchSubscription } from "@/lib/subscriptionClient";

type Profile = {
  name: string;
  avatar_color: string;
};

export function AppHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sub, setSub] = useState<SubscriptionRow | null>(null);

  const initials = useMemo(() => {
    const name = profile?.name?.trim() || "You";
    const parts = name.split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] || "Y") +
      (parts.length > 1 ? parts[parts.length - 1][0] : "")
    ).toUpperCase();
  }, [profile?.name]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) return;

      const [{ data: p }, s] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, avatar_color")
          .eq("id", uid)
          .single(),
        fetchSubscription(),
      ]);

      if (p) setProfile(p as Profile);
      if (s) setSub(s);
    }

    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="sticky top-0 z-20 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="group flex items-center gap-3 soft-hover">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card/70 shadow-sm backdrop-blur">
            <span className="font-display text-lg">✦</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg tracking-tight">tambo</div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground/80 transition">
              calm AI planning
            </div>
          </div>
        </Link>

        <div className="hidden md:block">
          <TokenPill sub={sub} />
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Settings
          </Link>

          <div className="flex items-center gap-3 rounded-full bg-card/70 px-3 py-1.5 shadow-sm backdrop-blur soft-hover">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-medium">
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm leading-tight">{profile?.name || "Loading…"}</div>
              <button
                onClick={logout}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/30 px-6 py-2 md:hidden">
        <TokenPill sub={sub} />
      </div>
    </header>
  );
}