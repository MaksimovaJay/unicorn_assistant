import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, workspace_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("events")
    .insert({
      workspace_id: profile.workspace_id,
      created_by: user.id,
      title: body.title,
      event_type: body.event_type ?? "meeting",
      status: body.status ?? "planned",
      start_at: body.start_at,
      end_at: body.end_at,
      all_day: body.all_day ?? false,
      description: body.description ?? null,
      location: body.location ?? null,
      meeting_link: body.meeting_link ?? null,
      notes: body.notes ?? null,
      contact_id: body.contact_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
