import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { OCHNY_PARTICIPANTS, ONLINE_PARTICIPANTS } from "./seed-training-data.local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "public" },
  global: {
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  },
});

async function getWorkspaceId() {
  // Try profiles first
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("workspace_id, id")
    .limit(1)
    .single();

  if (!profErr && profile) {
    console.log("Profile found, workspace_id:", profile.workspace_id);
    return { workspace_id: profile.workspace_id, user_id: profile.id };
  }

  console.log("Profiles error:", profErr?.message);

  // Try booking_sessions as fallback
  const { data: session, error: sesErr } = await supabase
    .from("booking_sessions")
    .select("workspace_id, created_by")
    .limit(1)
    .single();

  if (!sesErr && session) {
    console.log("Got workspace_id from existing session:", session.workspace_id);
    return { workspace_id: session.workspace_id, user_id: session.created_by };
  }

  console.log("Sessions error:", sesErr?.message);
  return null;
}

async function main() {
  console.log("Connecting to Supabase...\n");

  const ctx = await getWorkspaceId();
  if (!ctx) {
    console.error("Could not determine workspace_id. Make sure the app has been set up.");
    process.exit(1);
  }

  const { workspace_id, user_id } = ctx;

  // Find or create session "Тренинг Дарьи Ли"
  const SESSION_TITLE = "Тренинг Дарьи Ли";

  let session_id;
  const { data: existingSession } = await supabase
    .from("booking_sessions")
    .select("id")
    .eq("workspace_id", workspace_id)
    .ilike("title", `%${SESSION_TITLE}%`)
    .maybeSingle();

  if (existingSession) {
    session_id = existingSession.id;
    console.log(`Session "${SESSION_TITLE}" already exists: ${session_id}`);
  } else {
    const { data: newSession, error: sErr } = await supabase
      .from("booking_sessions")
      .insert({
        workspace_id,
        title: SESSION_TITLE,
        session_date: "2025-05-27",
        created_by: user_id,
      })
      .select("id")
      .single();

    if (sErr) {
      console.error("Error creating session:", sErr.message);
      process.exit(1);
    }
    session_id = newSession.id;
    console.log(`Session "${SESSION_TITLE}" created: ${session_id}`);
  }

  // Create group "Очный"
  const { data: ochnyGroup, error: og1Err } = await supabase
    .from("booking_groups")
    .insert({ session_id, name: "Очный", position: 0 })
    .select("id")
    .single();

  if (og1Err) {
    console.error("Error creating 'Очный' group:", og1Err.message);
    process.exit(1);
  }
  console.log(`\nGroup 'Очный' created: ${ochnyGroup.id}`);

  // Create group "Онлайн"
  const { data: onlineGroup, error: og2Err } = await supabase
    .from("booking_groups")
    .insert({ session_id, name: "Онлайн", position: 1 })
    .select("id")
    .single();

  if (og2Err) {
    console.error("Error creating 'Онлайн' group:", og2Err.message);
    process.exit(1);
  }
  console.log(`Group 'Онлайн' created: ${onlineGroup.id}`);

  // Add participants to Очный
  console.log("\nAdding participants to 'Очный':");
  for (const p of OCHNY_PARTICIPANTS) {
    const { error } = await supabase
      .from("booking_participants")
      .insert({ group_id: ochnyGroup.id, ...p });
    if (error) console.error(`  ✗ ${p.full_name}: ${error.message}`);
    else console.log(`  ✓ ${p.full_name}`);
  }

  // Add participants to Онлайн
  console.log("\nAdding participants to 'Онлайн':");
  for (const p of ONLINE_PARTICIPANTS) {
    const { error } = await supabase
      .from("booking_participants")
      .insert({ group_id: onlineGroup.id, ...p });
    if (error) console.error(`  ✗ ${p.full_name}: ${error.message}`);
    else console.log(`  ✓ ${p.full_name}`);
  }

  console.log("\nDone!");
}

main();
