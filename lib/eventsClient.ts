import { supabase } from "@/lib/supabaseClient";

export type EventSource = "manual" | "ai";

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  start_ts: string; // ISO
  end_ts: string;   // ISO
  memo: string | null;
  source: EventSource;
  created_at: string;
};

export type NewEventInput = {
  title: string;
  start_ts: string;
  end_ts: string;
  memo?: string | null;
  source?: EventSource;
};

export type UpdateEventInput = Partial<NewEventInput> & { id: string };

function dayBoundsISO(yyyyMmDd: string) {
  // Use local day boundaries but store as ISO timestamps
  const start = new Date(`${yyyyMmDd}T00:00:00`);
  const end = new Date(`${yyyyMmDd}T23:59:59.999`);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export async function fetchEventsForDay(dateYYYYMMDD: string): Promise<EventRow[]> {
  const { startISO, endISO } = dayBoundsISO(dateYYYYMMDD);

  const { data, error } = await supabase
    .from("events")
    .select("id,user_id,title,start_ts,end_ts,memo,source,created_at")
    .gte("start_ts", startISO)
    .lte("start_ts", endISO)
    .order("start_ts", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as EventRow[];
}

export async function createEvent(input: NewEventInput): Promise<EventRow> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) throw new Error("Not logged in");

  const payload = {
    user_id: userId,
    title: input.title,
    start_ts: input.start_ts,
    end_ts: input.end_ts,
    memo: input.memo ?? null,
    source: input.source ?? "manual",
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id,user_id,title,start_ts,end_ts,memo,source,created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as EventRow;
}

export async function updateEvent(input: UpdateEventInput): Promise<EventRow> {
  const { id, ...patch } = input;

  const { data, error } = await supabase
    .from("events")
    .update({
      ...patch,
      memo: patch.memo ?? undefined,
    })
    .eq("id", id)
    .select("id,user_id,title,start_ts,end_ts,memo,source,created_at")
    .single();

  if (error) throw new Error(error.message);
  return data as EventRow;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}