import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  return setupWorkspace("User", "Unicorn Assistant");
}

export async function POST(request: Request) {
  const { fullName, workspaceName } = await request.json();
  return setupWorkspace(fullName, workspaceName);
}

async function setupWorkspace(fullName: string, workspaceName: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const safeName =
    (fullName || "").trim().slice(0, 100) ||
    user.email?.split("@")[0] ||
    "User";

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    return NextResponse.json({ success: true });
  }

  const { data: workspaceData, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name: workspaceName || "Unicorn Assistant",
      timezone: "UTC",
      currency: "USD",
      owner_id: user.id,
    })
    .select()
    .single();

  if (wsError || !workspaceData) {
    return NextResponse.json({ error: wsError?.message }, { status: 500 });
  }

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
