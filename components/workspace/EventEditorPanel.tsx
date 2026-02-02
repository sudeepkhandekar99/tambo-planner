"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createEvent, updateEvent, deleteEvent } from "@/lib/eventsClient";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateTimeLocalValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const min = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function parseDateTimeLocal(val: string) {
  return new Date(val);
}

export function EventEditorPanel() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const activeEvent = useAppStore((s) => s.activeEvent);
  const draftEvent = useAppStore((s) => s.draftEvent);
  const openAi = useAppStore((s) => s.openAi);
  const clearEventPanel = useAppStore((s) => s.clearEventPanel);

  const isEdit = !!activeEvent;

  const dateLabel = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  const sourceLabel = useMemo(() => {
    if (activeEvent?.source) return activeEvent.source;
    return "manual";
  }, [activeEvent]);

  const [title, setTitle] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeEvent) {
      setTitle(activeEvent.title);
      setStartLocal(dateTimeLocalValue(new Date(activeEvent.start_ts)));
      setEndLocal(dateTimeLocalValue(new Date(activeEvent.end_ts)));
      setMemo(activeEvent.memo ?? "");
      return;
    }

    if (draftEvent) {
      setTitle(draftEvent.title ?? "");
      setStartLocal(dateTimeLocalValue(draftEvent.start));
      setEndLocal(dateTimeLocalValue(draftEvent.end));
      setMemo(draftEvent.memo ?? "");
      return;
    }

    openAi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEvent, draftEvent]);

  async function onSave() {
    if (saving) return;
    setSaving(true);

    try {
      const t = title.trim();
      const start = parseDateTimeLocal(startLocal);
      const end = parseDateTimeLocal(endLocal);
      const m = memo.trim() ? memo.trim() : null;

      if (!t) throw new Error("Title is required.");
      if (isNaN(start.getTime())) throw new Error("Invalid start time.");
      if (isNaN(end.getTime())) throw new Error("Invalid end time.");
      if (end <= start) throw new Error("End must be after start.");

      if (activeEvent) {
        await updateEvent({
          id: activeEvent.id,
          title: t,
          start_ts: start.toISOString(),
          end_ts: end.toISOString(),
          memo: m,
        });
        toast.success("Event updated");
      } else {
        await createEvent({
          title: t,
          start_ts: start.toISOString(),
          end_ts: end.toISOString(),
          memo: m,
          source: "manual",
        });
        toast.success("Event created");
      }

      clearEventPanel();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!activeEvent || saving) return;
    setSaving(true);

    try {
      await deleteEvent(activeEvent.id);
      toast.success("Event deleted");
      clearEventPanel();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-2xl tracking-tight">
            {isEdit ? "Edit event" : "New event"}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/45 px-3 py-1 text-xs text-foreground/80 soft-hover">
              {dateLabel}
            </span>
            <span className="rounded-full bg-muted/18 px-3 py-1 text-xs text-muted-foreground soft-hover">
              source: {sourceLabel}
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="rounded-2xl press soft-hover"
          onClick={openAi}
        >
          Back
        </Button>
      </div>

      {/* Body scroll area */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full rounded-[26px] bg-background/45 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] overflow-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="title">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deep work, meeting, gym…"
                className="rounded-2xl bg-card/70 soft-hover focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Time</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" htmlFor="start">
                    Start
                  </Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                    className="rounded-2xl bg-card/70 soft-hover focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" htmlFor="end">
                    End
                  </Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                    className="rounded-2xl bg-card/70 soft-hover focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="memo">
                Notes
              </Label>
              <Textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Optional…"
                className="min-h-[200px] rounded-2xl bg-card/70 soft-hover focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div>
          {isEdit ? (
            <Button
              variant="secondary"
              className="rounded-2xl press soft-hover"
              onClick={onDelete}
              disabled={saving}
            >
              Delete
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="rounded-2xl press soft-hover"
            onClick={openAi}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            className="rounded-2xl press soft-hover"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}