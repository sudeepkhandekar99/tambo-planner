"use client";

import { useAppStore } from "@/lib/appStore";
import { AiChatPanel } from "@/components/workspace/AiChatPanel";
import { EventEditorPanel } from "@/components/workspace/EventEditorPanel";
import { BillingPanel } from "@/components/workspace/BillingPanel";
import { ProfilePanel } from "@/components/workspace/ProfilePanel";

export function RightWorkspace() {
  const mode = useAppStore((s) => s.workspaceMode);

  if (mode === "event") return <EventEditorPanel />;
  if (mode === "billing") return <BillingPanel />;
  if (mode === "profile") return <ProfilePanel />;
  return <AiChatPanel />;
}