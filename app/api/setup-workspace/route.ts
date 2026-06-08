import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { fullName, workspaceName } = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const safeName =
    (fullName || "").trim().slice(0, 100) ||
    user.email?.split("@")[0] ||
    "User";

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
    .insert({ name: workspaceName || "Unicorn Assistant", timezone: "UTC", currency: "USD" })
    .select()
    .single();

  if (wsError || !workspaceData) {
    return NextResponse.json({ error: wsError?.message }, { status: 500 });
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    workspace_id: workspaceData.id,
    full_name: safeName,
    role: "owner",
    avatar_url: null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, workspaceId: workspaceData.id });
}
