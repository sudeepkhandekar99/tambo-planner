"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAppStore } from "@/lib/appStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileRow = {
  id: string;
  name: string;
  avatar_color: string;
};

const COLORS = [
  { key: "peach", label: "Peach", chip: "bg-primary/25" },
  { key: "mint", label: "Mint", chip: "bg-accent/50" },
  { key: "sky", label: "Sky", chip: "bg-secondary/60" },
  { key: "sand", label: "Sand", chip: "bg-muted/60" },
];

export function ProfilePanel() {
  const openAi = useAppStore((s) => s.openAi);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState("peach");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const initials = useMemo(() => {
    const n = (name || profile?.name || "You").trim();
    const parts = n.split(" ").filter(Boolean);
    return (
      (parts[0]?.[0] || "Y") +
      (parts.length > 1 ? parts[parts.length - 1][0] : "")
    ).toUpperCase();
  }, [name, profile?.name]);

  const avatarClass = useMemo(() => {
    const found = COLORS.find((c) => c.key === avatarColor);
    return found?.chip ?? "bg-primary/25";
  }, [avatarColor]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,avatar_color")
        .eq("id", uid)
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      const p = data as ProfileRow;
      setProfile(p);
      setName(p.name || "");
      setAvatarColor(p.avatar_color || "peach");
      setLoading(false);
    }

    load();
  }, []);

  async function save() {
    if (!profile) return;
    if (saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim(), avatar_color: avatarColor })
        .eq("id", profile.id);

      if (error) throw new Error(error.message);

      toast.success("Profile saved");
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-2xl tracking-tight">Profile</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Your name and avatar.
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

      {/* Scroll body */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full rounded-[26px] bg-background/45 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] overflow-auto">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted" />
              <div className="h-4 w-1/2 rounded-full bg-muted" />
              <div className="h-10 w-full rounded-2xl bg-muted" />
            </div>
          ) : (
            <div className="space-y-7">
              {/* Avatar block */}
              <div className="flex items-center gap-4">
                <div
                  className={[
                    "flex h-16 w-16 items-center justify-center rounded-3xl",
                    avatarClass,
                    "shadow-sm soft-hover",
                  ].join(" ")}
                >
                  <span className="font-display text-xl">{initials}</span>
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-medium">Avatar</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    Shown in the sidebar and shared spaces later.
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-2xl bg-card/70 soft-hover focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Avatar color</div>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => {
                    const active = c.key === avatarColor;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setAvatarColor(c.key)}
                        className={[
                          "rounded-full px-4 py-2 text-sm press soft-hover",
                          active
                            ? "bg-primary/18 text-foreground ring-1 ring-primary/25"
                            : "bg-muted/14 text-muted-foreground hover:bg-muted/24 hover:text-foreground",
                        ].join(" ")}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save inside body so it’s reachable even on small screens */}
              <div className="pt-2">
                <Button
                  onClick={save}
                  disabled={saving || loading}
                  className="rounded-2xl press soft-hover"
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}