import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.rpc("get_profile_for_user", { p_user_id: userId });
  return data?.[0] ?? null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json() as {
    full_name: string;
    telegram?: string;
    phone?: string;
    email?: string;
  };

  if (!body.full_name) {
    return NextResponse.json({ error: "full_name required" }, { status: 400 });
  }

  // Dedup by telegram — return existing contact without creating a duplicate
  if (body.telegram) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", profile.workspace_id)
      .eq("telegram", body.telegram)
      .maybeSingle();

    if (existing) return NextResponse.json(existing, { status: 200 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      workspace_id: profile.workspace_id,
      full_name: body.full_name,
      telegram: body.telegram ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      notes: null,
      favorite: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
