// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.117.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "email, password, Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonBody(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Caller credentials arrive as headers so they never touch the URL or logs.
function readCreds(req: Request): { email: string; password: string } | null {
  const email = (req.headers.get("x-admin-email") || "").trim().toLowerCase();
  const password = req.headers.get("x-admin-password") || "";
  if (!email || !password) return null;
  return { email, password };
}

const DB_TABLES = [
  "shops",
  "employees",
  "customers",
  "transactions",
  "change_records",
  "customer_balance_ledger",
  "change_collections",
  "whatsapp_messages",
  "audit_logs",
  "disputes",
  "welcome_emails",
  "legal_acceptances",
] as const;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonBody({ error: "Method not allowed" }, 405);
    }

    const creds = readCreds(req);
    if (!creds) {
      return jsonBody({ error: "Credentials required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify credentials against real authentication on the server.
    const { data: signIn, error: signInError } = await admin.auth.signInWithPassword({
      email: creds.email,
      password: creds.password
    });
    if (signInError || !signIn?.user) {
      return jsonBody({ error: "Access denied" }, 401);
    }

    // Only this authorised administrator account may unlock the portal.
    const AUTHORISED_EMAIL = "futurepulse@gmail.com";
    if ((signIn.user.email || "").toLowerCase() !== AUTHORISED_EMAIL) {
      return jsonBody({ error: "Access denied" }, 401);
    }

    // Gather a database overview (counts per table).
    const counts: Record<string, number> = {};
    for (const table of DB_TABLES) {
      const { count, error } = await admin
        .from(table)
        .select("*", { count: "exact", head: true });
      counts[table] = error ? -1 : (count ?? 0);
    }

    // Recent activity sample from the audit log.
    const { data: recent, error: recentError } = await admin
      .from("audit_logs")
      .select("timestamp, action, entity_type, entity_id, actor_name, actor_role, details")
      .order("timestamp", { ascending: false })
      .limit(25);

    return jsonBody({
      ok: true,
      generated_at: new Date().toISOString(),
      counts,
      recent_activity: recentError ? [] : (recent ?? []),
      viewer: { email: signIn.user.email }
    });
  } catch (err: any) {
    return jsonBody({ error: err?.message || "Unexpected server error" }, 500);
  }
});
