"use client";

import { AppShell } from "@/components/shell/AppShell";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { RightWorkspace } from "@/components/workspace/RightWorkspace";

export default function AppHome() {
  return (
    <AppShell rightPanel={<RightWorkspace />}>
      <div className="space-y-5">
        {/* Simple hierarchy header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight leading-tight">
              Calendar
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag to create. Click to edit. AI follows the selected date.
            </p>
          </div>

          {/* Optional subtle status pill — no clutter */}
          <div className="hidden sm:inline-flex rounded-full bg-muted/18 px-3 py-1 text-xs text-muted-foreground soft-hover">
            calm mode
          </div>
        </div>

        {/* Calendar */}
        <CalendarPanel />
      </div>
    </AppShell>
  );
}