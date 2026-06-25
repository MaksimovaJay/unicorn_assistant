import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.rpc("get_profile_for_user", { p_user_id: userId });
  return data?.[0] ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("workspace_id", profile.workspace_id)
    .gte("start_at", todayStart.toISOString())
    .lte("start_at", todayEnd.toISOString())
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
