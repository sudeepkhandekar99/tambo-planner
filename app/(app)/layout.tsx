"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AppHeader } from "@/components/layout/AppHeader";
import { FadeIn } from "@/components/motion/FadeIn";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      if (mounted) setReady(true);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-[28px] bg-card/70 p-6 shadow-sm backdrop-blur">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-1/3 rounded-full bg-muted" />
              <div className="h-3 w-2/3 rounded-full bg-muted" />
              <div className="h-3 w-1/2 rounded-full bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="px-6 py-8">
        <FadeIn>{children}</FadeIn>
      </main>
    </div>
  );
}