import { create } from "zustand";
import type { EventRow } from "@/lib/eventsClient";

type WorkspaceMode = "ai" | "event" | "billing" | "profile";

type DraftEvent = {
  title: string;
  start: Date;
  end: Date;
  memo: string;
  source: "manual" | "ai";
};

type AppState = {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (d: string) => void;

  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (m: WorkspaceMode) => void;

  // event editing/creating
  activeEvent: EventRow | null;
  draftEvent: DraftEvent | null;

  openAi: () => void;
  openBilling: () => void;
  openProfile: () => void;

  openEditEvent: (e: EventRow) => void;
  openCreateEvent: (start: Date, end: Date) => void;

  clearEventPanel: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export const useAppStore = create<AppState>((set) => ({
  selectedDate: today(),
  setSelectedDate: (d) => set({ selectedDate: d }),

  workspaceMode: "ai",
  setWorkspaceMode: (m) => set({ workspaceMode: m }),

  activeEvent: null,
  draftEvent: null,

  openAi: () => set({ workspaceMode: "ai", activeEvent: null, draftEvent: null }),
  openBilling: () => set({ workspaceMode: "billing", activeEvent: null, draftEvent: null }),
  openProfile: () => set({ workspaceMode: "profile", activeEvent: null, draftEvent: null }),

  openEditEvent: (e) =>
    set({ workspaceMode: "event", activeEvent: e, draftEvent: null }),

  openCreateEvent: (start, end) =>
    set({
      workspaceMode: "event",
      activeEvent: null,
      draftEvent: {
        title: "",
        start,
        end,
        memo: "",
        source: "manual",
      },
    }),

  clearEventPanel: () => set({ activeEvent: null, draftEvent: null, workspaceMode: "ai" }),
}));