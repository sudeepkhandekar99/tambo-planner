import { create } from "zustand";
import type { CalendarEvent, ProposedBlock, Subscription } from "./types";

type AuthState = { userId: string | null; email: string | null };

type AppState = {
  auth: AuthState;
  selectedDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  proposedPlan: ProposedBlock[];
  subscription: Subscription | null;

  setAuth: (auth: AuthState) => void;
  setSelectedDate: (d: string) => void;

  setEvents: (events: CalendarEvent[]) => void;
  upsertEvent: (e: CalendarEvent) => void;
  removeEvent: (id: string) => void;

  setProposedPlan: (blocks: ProposedBlock[]) => void;
  updateProposedBlock: (tempId: string, patch: Partial<ProposedBlock>) => void;
  clearProposedPlan: () => void;

  setSubscription: (s: Subscription | null) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export const useAppStore = create<AppState>((set, get) => ({
  auth: { userId: null, email: null },
  selectedDate: today(),
  events: [],
  proposedPlan: [],
  subscription: null,

  setAuth: (auth) => set({ auth }),
  setSelectedDate: (d) => set({ selectedDate: d }),

  setEvents: (events) => set({ events }),
  upsertEvent: (e) => {
    const curr = get().events;
    const idx = curr.findIndex((x) => x.id === e.id);
    if (idx === -1) return set({ events: [e, ...curr] });
    const next = [...curr];
    next[idx] = e;
    set({ events: next });
  },
  removeEvent: (id) => set({ events: get().events.filter((e) => e.id !== id) }),

  setProposedPlan: (blocks) => set({ proposedPlan: blocks }),
  updateProposedBlock: (tempId, patch) =>
    set({
      proposedPlan: get().proposedPlan.map((b) =>
        b.tempId === tempId ? { ...b, ...patch } : b
      ),
    }),
  clearProposedPlan: () => set({ proposedPlan: [] }),

  setSubscription: (s) => set({ subscription: s }),
}));