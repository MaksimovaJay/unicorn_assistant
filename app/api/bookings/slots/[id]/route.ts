import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowed = ["slot_time", "end_time", "status", "client_name", "client_phone", "client_telegram", "notes"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("booking_slots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calendar sync + auto-contact when slot becomes occupied
  if (data.status === "occupied" && data.client_name && !data.calendar_event_id) {
    try {
      const { data: session } = await supabase
        .from("booking_sessions")
        .select("session_date, workspace_id")
        .eq("id", data.session_id)
        .single();

      if (session) {
        // slot_time from Supabase is "HH:MM:SS"; may be "HH:MM" — normalise
        const timeStr = data.slot_time.length === 5
          ? `${data.slot_time}:00`
          : data.slot_time;
        const startAt = new Date(`${session.session_date}T${timeStr}+03:00`);
        if (isNaN(startAt.getTime())) throw new Error(`Invalid slot_time: ${data.slot_time}`);
        const endTimeStr = data.end_time
          ? (data.end_time.length === 5 ? `${data.end_time}:00` : data.end_time)
          : null;
        const endAt = endTimeStr
          ? new Date(`${session.session_date}T${endTimeStr}+03:00`)
          : new Date(startAt.getTime() + 60 * 60 * 1000);

        const { data: event } = await supabase
          .from("events")
          .insert({
            workspace_id: session.workspace_id,
            title: `Консультация — ${data.client_name}`,
            event_type: "consultation",
            status: "confirmed",
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            all_day: false,
            created_by: user.id,
            description: null,
            location: null,
            meeting_link: null,
            notes: null,
            contact_id: null,
            telegram: data.client_telegram ?? null,
          })
          .select("id")
          .single();

        if (event) {
          await supabase
            .from("booking_slots")
            .update({ calendar_event_id: event.id })
            .eq("id", data.id);
        }

        // Auto-contact when client has a telegram
        if (data.client_telegram) {
          const { data: existing } = await supabase
            .from("contacts")
            .select("id")
            .eq("workspace_id", session.workspace_id)
            .eq("telegram", data.client_telegram)
            .maybeSingle();

          if (!existing) {
            await supabase.from("contacts").insert({
              workspace_id: session.workspace_id,
              full_name: data.client_name,
              telegram: data.client_telegram,
              phone: data.client_phone ?? null,
              email: null,
              notes: null,
              favorite: false,
            });
          }
        }
      }
    } catch (e) {
      console.error("[slot sync] calendar/contact error:", e);
    }
  }

  // Calendar sync when slot becomes free — delete the linked event
  if (data.status === "free" && data.calendar_event_id) {
    try {
      await supabase.from("events").delete().eq("id", data.calendar_event_id);
      await supabase
        .from("booking_slots")
        .update({ calendar_event_id: null })
        .eq("id", data.id);
    } catch (e) {
      console.error("[slot sync] delete event error:", e);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("booking_slots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
