"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export function CalendarView() {
  return (
    <div className="h-[640px] rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur">
      <Calendar
        localizer={localizer}
        defaultView={Views.DAY}
        views={[Views.DAY]}
        events={[]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
      />
    </div>
  );
}