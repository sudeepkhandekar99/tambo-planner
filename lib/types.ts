export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  memo?: string | null;
  source: "manual" | "ai";
};

export type ProposedBlock = {
  tempId: string;
  title: string;
  start: string;
  end: string;
  memo?: string;
  accepted: boolean;
};

export type Subscription = {
  plan: "trial" | "starter_1" | "pro_5" | "max_10";
  status: "trialing" | "active" | "canceled";
  tokensMonthlyLimit: number;
  tokensUsed: number;
  trialEndsAt?: string | null;
  periodEnd?: string | null;
};