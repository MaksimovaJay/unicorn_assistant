import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { OCHNY_PARTICIPANTS, ONLINE_PARTICIPANTS } from "./participants.local";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated — open the app and log in first" }, { status: 401 });

  // Get workspace_id from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const workspace_id = profile.workspace_id;

  const SESSION_TITLE = "Тренинг Дарьи Ли";

  // Find or create session
  const { data: existingSession } = await supabase
    .from("booking_sessions")
    .select("id")
    .eq("workspace_id", workspace_id)
    .ilike("title", `%${SESSION_TITLE}%`)
    .maybeSingle();

  let session_id: string;
  if (existingSession) {
    session_id = existingSession.id;
  } else {
    const { data: newSession, error } = await supabase
      .from("booking_sessions")
      .insert({ workspace_id, title: SESSION_TITLE, session_date: "2025-05-27", created_by: user.id })
      .select("id")
      .single();
    if (error || !newSession) return NextResponse.json({ error: error?.message ?? "Failed to create session" }, { status: 500 });
    session_id = newSession.id;
  }

  // Create groups
  const { data: ochnyGroup, error: og1Err } = await supabase
    .from("booking_groups")
    .insert({ session_id, name: "Очный", position: 0 })
    .select("id")
    .single();
  if (og1Err) return NextResponse.json({ error: `Очный group: ${og1Err.message}` }, { status: 500 });

  const { data: onlineGroup, error: og2Err } = await supabase
    .from("booking_groups")
    .insert({ session_id, name: "Онлайн", position: 1 })
    .select("id")
    .single();
  if (og2Err) return NextResponse.json({ error: `Онлайн group: ${og2Err.message}` }, { status: 500 });

  const results: string[] = [];

  // Insert participants
  for (const p of OCHNY_PARTICIPANTS) {
    const { error } = await supabase.from("booking_participants").insert({ group_id: ochnyGroup.id, receipt_url: null, ...p });
    results.push(error ? `✗ ${p.full_name}: ${error.message}` : `✓ [Очный] ${p.full_name}`);
  }

  for (const p of ONLINE_PARTICIPANTS) {
    const { error } = await supabase.from("booking_participants").insert({ group_id: onlineGroup.id, receipt_url: null, ...p });
    results.push(error ? `✗ ${p.full_name}: ${error.message}` : `✓ [Онлайн] ${p.full_name}`);
  }

  return NextResponse.json({ success: true, session_id, results });
}
