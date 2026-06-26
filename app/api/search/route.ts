import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.rpc("get_profile_for_user", { p_user_id: userId });
  return data?.[0] ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ contacts: [], events: [], tasks: [] });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const wid = profile.workspace_id;
  const like = `%${q}%`;

  const [{ data: contacts }, { data: events }, { data: tasks }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name, telegram, phone")
      .eq("workspace_id", wid)
      .or(`full_name.ilike.${like},telegram.ilike.${like},phone.ilike.${like}`)
      .limit(5),
    supabase
      .from("events")
      .select("id, title, start_at, event_type")
      .eq("workspace_id", wid)
      .ilike("title", like)
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, status")
      .eq("workspace_id", wid)
      .ilike("title", like)
      .limit(5),
  ]);

  return NextResponse.json({
    contacts: contacts ?? [],
    events: events ?? [],
    tasks: tasks ?? [],
  });
}
