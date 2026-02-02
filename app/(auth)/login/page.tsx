"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hint = useMemo(() => {
    const h = [
      "Tip: ask for a ‘deep work’ schedule.",
      "Tip: tell AI your hard constraints first.",
      "Tip: start with “plan my day in 3 blocks”.",
    ];
    return h[Math.floor(Math.random() * h.length)];
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue planning with your AI calendar."
    >
      <FadeIn>
        <form action={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="rounded-2xl bg-card/60 soft-hover focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              {/* <span className="text-xs text-muted-foreground">{hint}</span> */}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-2xl bg-card/60 soft-hover focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground soft-hover">
              <div className="font-medium">Couldn’t log you in</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-2xl press soft-hover"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              New here?{" "}
              <Link
                className="text-foreground underline-offset-4 hover:underline soft-hover"
                href="/signup"
              >
                Create an account
              </Link>
            </span>

            <Link
              className="text-muted-foreground hover:text-foreground soft-hover"
              href="/signup"
            >
              Start trial →
            </Link>
          </div>
        </form>
      </FadeIn>
    </AuthShell>
  );
}