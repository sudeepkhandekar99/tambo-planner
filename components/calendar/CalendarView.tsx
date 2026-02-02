"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views, type SlotInfo } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";

import type { EventRow } from "@/lib/eventsClient";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type RBCEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    memo?: string | null;
    source: "manual" | "ai";
  };
};

const DnDCalendar = withDragAndDrop(Calendar) as any;

/* Simple event block */
function EventBlock({ event }: { event: RBCEvent }) {
  const hasMemo = !!event.resource?.memo;
  const isAI = event.resource?.source === "ai";

  return (
    <div className="space-y-0.5">
      <div className="text-sm font-medium leading-tight truncate">
        {event.title}
      </div>

      <div className="flex items-center gap-1 text-[11px] opacity-70">
        <span>{isAI ? "AI" : "Manual"}</span>
        {hasMemo && <span>•</span>}
        {hasMemo && <span>note</span>}
      </div>
    </div>
  );
}

export function CalendarView({
  selectedDate,
  events,
  onSelectDate,
  onSelectEvent,
  onMoveEvent,
  onResizeEvent,
  onSelectSlot,
}: {
  selectedDate: string;
  events: EventRow[];
  onSelectDate: (d: string) => void;
  onSelectEvent: (e: EventRow) => void;
  onMoveEvent: (params: { id: string; start: Date; end: Date }) => void;
  onResizeEvent: (params: { id: string; start: Date; end: Date }) => void;
  onSelectSlot?: (start: Date, end: Date) => void;
}) {
  const rbcEvents: RBCEvent[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start_ts),
        end: new Date(e.end_ts),
        resource: {
          memo: e.memo ?? undefined,
          source: e.source,
        },
      })),
    [events]
  );

  const dateObj = useMemo(
    () => new Date(`${selectedDate}T12:00:00`),
    [selectedDate]
  );

  return (
    <div className="h-[560px] overflow-hidden rounded-[28px] bg-background/50 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
      <DnDCalendar
        localizer={localizer}
        defaultView={Views.DAY}
        views={[Views.DAY]}
        date={dateObj}
        onNavigate={(date: Date) =>
          onSelectDate(date.toISOString().slice(0, 10))
        }
        events={rbcEvents}
        startAccessor={(e: RBCEvent) => e.start}
        endAccessor={(e: RBCEvent) => e.end}
        selectable
        onSelectSlot={(slot: SlotInfo) => {
          const action = (slot as any).action;
          if (action && action !== "select") return;

          onSelectSlot?.(slot.start as Date, slot.end as Date);
        }}
        onSelectEvent={(evt: RBCEvent) => {
          const found = events.find((x) => x.id === evt.id);
          if (found) onSelectEvent(found);
        }}
        onEventDrop={({ event, start, end }: any) =>
          onMoveEvent({
            id: String(event.id),
            start: start as Date,
            end: end as Date,
          })
        }
        onEventResize={({ event, start, end }: any) =>
          onResizeEvent({
            id: String(event.id),
            start: start as Date,
            end: end as Date,
          })
        }
        resizable
        step={30}
        timeslots={2}
        toolbar={false}
        style={{ height: "100%" }}
        eventPropGetter={(event: RBCEvent) => {
          const isAI = event.resource?.source === "ai";
          return {
            className: isAI ? "rbc-ai-event" : "rbc-manual-event",
          };
        }}
        components={{
          event: EventBlock,
        }}
      />
    </div>
  );
}