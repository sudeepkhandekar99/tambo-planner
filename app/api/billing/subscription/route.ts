import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseServer";

function supabaseAuthFromRequest(req: Request) {
  // We read the user's access token from Authorization header.
  // Client will send: Authorization: Bearer <access_token>
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Use anon key to validate JWT and fetch user
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return { supabaseAnon, token };
}

export async function GET(req: Request) {
  const { supabaseAnon, token } = supabaseAuthFromRequest(req);

  if (!token) {
    return NextResponse.json({ message: "Missing auth token" }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
  if (userErr || !userData.user) {
    return NextResponse.json({ message: "Invalid session" }, { status: 401 });
  }

  const userId = userData.user.id;

  // Reset period if needed (MVP lazy reset)
  const { error: resetErr } = await supabaseServer.rpc("reset_tokens_if_needed", {
    p_user_id: userId,
  });
  if (resetErr) {
    return NextResponse.json({ message: resetErr.message }, { status: 500 });
  }

  const { data, error } = await supabaseServer
    .from("subscriptions")
    .select(
      "user_id,plan,status,trial_ends_at,period_start,period_end,tokens_monthly_limit,tokens_used,updated_at"
    )
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}