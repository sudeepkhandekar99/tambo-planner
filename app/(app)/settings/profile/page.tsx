"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileRow = {
  id: string;
  name: string;
  avatar_color: string;
};

const AVATAR_COLORS = [
  { key: "mint", label: "Mint", className: "bg-accent/80" },
  { key: "sky", label: "Sky", className: "bg-secondary/80" },
  { key: "peach", label: "Peach", className: "bg-primary/50" },
  { key: "sand", label: "Sand", className: "bg-muted/70" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState("peach");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const avatarClass = useMemo(() => {
    const found = AVATAR_COLORS.find((c) => c.key === avatarColor);
    return found?.className ?? "bg-primary/50";
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
        setMsg(error.message);
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
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), avatar_color: avatarColor })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Saved.");
    setTimeout(() => setMsg(null), 1600);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Make it feel like yours.
        </p>
      </div>

      <Card className="soft-card p-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded-full bg-muted" />
            <div className="h-10 w-full rounded-2xl bg-muted" />
            <div className="h-4 w-1/4 rounded-full bg-muted" />
            <div className="h-10 w-full rounded-2xl bg-muted" />
          </div>
        ) : !profile ? (
          <div className="text-sm text-muted-foreground">No profile found.</div>
        ) : (
          <div className="space-y-6">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${avatarClass} shadow-sm soft-hover`}
              >
                <span className="font-display text-lg">✦</span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Preview</div>
                <div className="text-sm">
                  This shows up in your header and shared habits.
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-2xl bg-card/60 soft-hover focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Avatar color */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Avatar color</div>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => {
                  const active = c.key === avatarColor;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setAvatarColor(c.key)}
                      className={`rounded-full px-4 py-2 text-sm press soft-hover ${
                        active
                          ? "bg-primary/25 text-foreground"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {msg && (
              <div className="rounded-2xl bg-muted/40 px-3 py-2 text-sm text-foreground soft-hover">
                {msg}
              </div>
            )}

            <Button
              onClick={save}
              disabled={saving}
              className="rounded-2xl press soft-hover"
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}