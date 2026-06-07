import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/types/database";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { fullName } = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Idempotent: skip if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    return NextResponse.json({ success: true });
  }

  // Create workspace
  const { data: workspaceData, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: "unicorn-assistant", timezone: "UTC", currency: "USD" } as never)
    .select()
    .single();

  if (wsError || !workspaceData) {
    return NextResponse.json({ error: wsError?.message }, { status: 500 });
  }

  const workspace = workspaceData as unknown as Workspace;

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    workspace_id: workspace.id,
    full_name: fullName || user.email?.split("@")[0] || "User",
    role: "owner",
    avatar_url: null,
  } as never);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, workspaceId: workspace.id });
}
