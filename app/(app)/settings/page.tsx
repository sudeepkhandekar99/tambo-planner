import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your plan, tokens, and profile — keep it cozy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/settings/billing" className="group">
          <Card className="soft-card p-6 soft-hover">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-xl tracking-tight">
                  Billing & Tokens
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Trial, plans, token usage, upgrades.
                </p>
              </div>

              <div className="rounded-full bg-accent/50 px-3 py-1 text-xs text-foreground/80 transition group-hover:bg-accent/70">
                Open →
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/settings/profile" className="group">
          <Card className="soft-card p-6 soft-hover">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-xl tracking-tight">
                  Profile
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Name, avatar color, preferences.
                </p>
              </div>

              <div className="rounded-full bg-accent/50 px-3 py-1 text-xs text-foreground/80 transition group-hover:bg-accent/70">
                Open →
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        Tip: tokens are deducted when you generate or regenerate an AI plan.
      </div>
    </div>
  );
}