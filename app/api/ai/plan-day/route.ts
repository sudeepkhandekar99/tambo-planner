import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chargeTokens } from "@/lib/tokenCharge";

function supabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ message: "Missing auth token" }, { status: 401 });
  }

  const sb = supabaseAnon();
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData.user) {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }

  const userId = userData.user.id;

  // Parse request body (MVP)
  const body = await req.json().catch(() => ({}));
  const selectedDate = body?.selectedDate ?? null;
  const prompt = body?.prompt ?? "";

  // Charge tokens for this action
  try {
    await chargeTokens({
      userId,
      action: "plan_day",
      meta: { selectedDate, promptLength: String(prompt).length },
    });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Token charge failed" }, { status: 402 });
  }

  // TODO: Mock “AI plan” response (swap with Tambo later)
  const mock = {
    mode: "daily_planning",
    proposed_blocks: [
      { title: "Deep work", start: "09:00", end: "11:00", memo: "Focus block" },
      { title: "Admin + email", start: "11:00", end: "11:30", memo: "" },
      { title: "Lunch", start: "12:30", end: "13:00", memo: "" },
      { title: "Gym", start: "18:00", end: "19:00", memo: "Consistency > intensity" },
    ],
    warnings: ["Remember buffer time between blocks."],
  };

  return NextResponse.json(mock);
}