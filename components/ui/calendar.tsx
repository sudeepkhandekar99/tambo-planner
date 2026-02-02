"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        // more breathing room + nicer surface
        "bg-card/80 backdrop-blur group/calendar p-4 rounded-[22px] shadow-sm",
        // keep your sizing variable
        "[--cell-size:2.25rem]",
        "[[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),

        // spacing between months (if ever multiple)
        months: cn("relative flex flex-col gap-4", defaultClassNames.months),

        // spacing inside month
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),

        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 px-1",
          defaultClassNames.nav
        ),

        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 rounded-full aria-disabled:opacity-40 soft-hover",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 rounded-full aria-disabled:opacity-40 soft-hover",
          defaultClassNames.button_next
        ),

        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),

        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),

        dropdown_root: cn(
          "border border-border/50 bg-background/50 rounded-xl px-2 py-1",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),

        // typography
        caption_label: cn(
          "select-none font-display tracking-tight",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),

        // spacing between header and grid
        table: "w-full border-collapse",

        weekdays: cn("flex gap-1", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.75rem] font-medium text-center",
          defaultClassNames.weekday
        ),

        // more spacing between rows
        week: cn("mt-2 flex w-full gap-1", defaultClassNames.week),

        week_number_header: cn("w-[--cell-size] select-none", defaultClassNames.week_number_header),
        week_number: cn("text-muted-foreground select-none text-[0.8rem]", defaultClassNames.week_number),

        // cell spacing handled by gap on week; keep day cell simple
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center",
          defaultClassNames.day
        ),

        range_start: cn("rounded-l-xl", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-xl", defaultClassNames.range_end),

        // TODAY: subtle pastel tint (not strong)
        today: cn(
          "rounded-xl data-[selected=true]:rounded-xl",
          defaultClassNames.today
        ),

        outside: cn(
          "text-muted-foreground/60 aria-selected:text-muted-foreground/60",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground/40 opacity-40", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
        ),

        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }
          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }
          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },

        DayButton: CalendarDayButton,

        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-[--cell-size] items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),

        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isSingleSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={isSingleSelected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={modifiers.today}
      className={cn(
        // base button: softer & rounded
        "h-[--cell-size] w-[--cell-size] rounded-xl font-normal press soft-hover",
        // remove loud focus ring; keep calm subtle outline
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        // lighter number look
        "text-sm",

        // selected single date: pastel filled
        "data-[selected-single=true]:bg-primary/30 data-[selected-single=true]:text-foreground",
        "data-[selected-single=true]:hover:bg-primary/35",

        // TODO: range styles (if i ever use range later)
        "data-[range-middle=true]:bg-accent/35 data-[range-middle=true]:text-foreground",
        "data-[range-start=true]:bg-primary/35 data-[range-start=true]:text-foreground",
        "data-[range-end=true]:bg-primary/35 data-[range-end=true]:text-foreground",

        // today: subtle border + tint (unless selected, where selected wins)
        "data-[today=true]:border data-[today=true]:border-primary/35 data-[today=true]:bg-accent/25",
        "data-[today=true]:text-foreground",

        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };