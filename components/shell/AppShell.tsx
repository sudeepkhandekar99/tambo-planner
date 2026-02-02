"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { AppSidebar } from "@/components/shell/AppSidebar";

export function AppShell({
  children,
  rightPanel,
}: {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-12 gap-6 items-stretch min-h-[calc(100vh-3rem)]">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3">
            <div className="h-full">
              <AppSidebar />
            </div>
          </div>

          {/* Center */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6">
            <div className="soft-card p-6 h-full">
              <FadeIn>{children}</FadeIn>
            </div>
          </div>

          {/* Right */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3">
            <div className="soft-card p-6 h-full">
              <FadeIn>{rightPanel}</FadeIn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}