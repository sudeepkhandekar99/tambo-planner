"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CalendarView } from "@/components/calendar/CalendarView";
import { Button } from "@/components/ui/button";

import type { EventRow } from "@/lib/eventsClient";
import { fetchEventsForDay, updateEvent } from "@/lib/eventsClient";
import { useAppStore } from "@/lib/appStore";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function toYYYYMMDD(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarPanel() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const openEditEvent = useAppStore((s) => s.openEditEvent);
  const openCreateEvent = useAppStore((s) => s.openCreateEvent);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const lastDnDToastAt = useRef<number>(0);

  const prettyDate = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const shortDate = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }, [selectedDate]);

  async function loadDay(dateYYYYMMDD: string) {
    setLoading(true);
    try {
      const data = await fetchEventsForDay(dateYYYYMMDD);
      setEvents(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDay(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  function dndToast(message: string) {
    const now = Date.now();
    if (now - lastDnDToastAt.current < 900) return;
    lastDnDToastAt.current = now;
    toast.success(message);
  }

  async function onMoveEvent({ id, start, end }: { id: string; start: Date; end: Date }) {
    try {
      await updateEvent({ id, start_ts: start.toISOString(), end_ts: end.toISOString() });
      dndToast("Event moved");
      await loadDay(selectedDate);
    } catch (e: any) {
      toast.error(e.message || "Move failed");
    }
  }

  async function onResizeEvent({ id, start, end }: { id: string; start: Date; end: Date }) {
    try {
      await updateEvent({ id, start_ts: start.toISOString(), end_ts: end.toISOString() });
      dndToast("Event resized");
      await loadDay(selectedDate);
    } catch (e: any) {
      toast.error(e.message || "Resize failed");
    }
  }

  function openNewEventDefault() {
    const start = new Date(`${selectedDate}T09:00:00`);
    const end = new Date(`${selectedDate}T10:00:00`);
    openCreateEvent(start, end);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-xl tracking-tight">Day</div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Date picker pill */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="rounded-full bg-muted/18 px-4 py-2 text-sm text-foreground soft-hover hover:bg-muted/28 press">
                  {prettyDate}
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="start"
                className="w-[320px] rounded-[28px] border border-border/50 bg-card p-4 shadow-xl"
              >
                <div className="mb-3">
                  <div className="font-display text-base tracking-tight">Pick a day</div>
                  <div className="text-xs text-muted-foreground">
                    AI and calendar stay in sync.
                  </div>
                </div>

                <Calendar
                  mode="single"
                  selected={new Date(`${selectedDate}T12:00:00`)}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectedDate(toYYYYMMDD(d));
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Event count (subtle) */}
            <div className="rounded-full bg-muted/12 px-3 py-1 text-xs text-muted-foreground">
              {loading ? "Loading…" : `${events.length} event${events.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="rounded-2xl press soft-hover"
            onClick={() => setSelectedDate(toYYYYMMDD(new Date()))}
          >
            Today
          </Button>

          <Button className="rounded-2xl press soft-hover" onClick={openNewEventDefault}>
            New event
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <CalendarView
        selectedDate={selectedDate}
        events={events}
        onSelectDate={(d) => setSelectedDate(d)}
        onSelectEvent={(e) => openEditEvent(e)}
        onMoveEvent={onMoveEvent}
        onResizeEvent={onResizeEvent}
        onSelectSlot={(start, end) => openCreateEvent(start, end)}
      />
    </div>
  );
}