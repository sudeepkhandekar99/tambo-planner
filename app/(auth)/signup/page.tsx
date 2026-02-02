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

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialLine = useMemo(() => {
    const lines = [
      "Start free • upgrade when you want • cancel anytime",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // trigger uses this to set profile name
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/login");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your trial and let AI shape your day—softly."
    >
      <FadeIn>
        <form action={onSubmit} className="space-y-5">
          <div className="rounded-2xl bg-accent/35 px-3 py-2 text-xs text-foreground/80 soft-hover">
            {trialLine}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Bamboo"
              required
              className="rounded-2xl bg-card/60 soft-hover focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

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
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>
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
              <div className="font-medium">Couldn’t create your account</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-2xl press soft-hover"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              className="text-foreground underline-offset-4 hover:underline soft-hover"
              href="/login"
            >
              Log in
            </Link>
          </p>
        </form>
      </FadeIn>
    </AuthShell>
  );
}