// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.117.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "x-admin-email, x-admin-password, Content-Type, Authorization, X-Client-Info, Apikey",
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

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function generateKeyCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, b => KEY_ALPHABET[b % KEY_ALPHABET.length]);
  return `CT-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

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

    // ---- Subscription management actions --------------------------------
    let action = "overview";
    let payload: any = {};
    try {
      const body = await req.json();
      if (body && typeof body === "object") {
        action = body.action || "overview";
        payload = body;
      }
    } catch {
      // No JSON body: default to the read-only database overview.
    }

    if (action === "overview") {
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

      // Subscription status for every shop.
      const { data: subs } = await admin
        .from("shop_subscriptions")
        .select("shop_id, monthly_fee, currency, period_start, period_end, updated_at");
      const { data: keys } = await admin
        .from("activation_keys")
        .select("shop_id, key_code, fee_at_issue, status, created_at, confirmed_at, used_at")
        .order("created_at", { ascending: false });

      const subsByShop = new Map((subs ?? []).map(s => [s.shop_id, s]));
      const keysByShop = new Map<string, any[]>();
      for (const k of keys ?? []) {
        const list = keysByShop.get(k.shop_id) ?? [];
        list.push(k);
        keysByShop.set(k.shop_id, list);
      }

      const { data: shopRows } = await admin
        .from("shops")
        .select("id, name, branch_name, owner_name, created_at");
      const shops = (shopRows ?? []).map(s => {
        const sub = subsByShop.get(s.id) ?? null;
        const now = Date.now();
        const end = sub ? new Date(sub.period_end).getTime() : 0;
        const status = !sub || end <= now ? "EXPIRED" : end - now <= 3 * 864e5 ? "EXPIRING" : "ACTIVE";
        return {
          ...s,
          subscription: sub,
          status,
          days_left: sub ? Math.max(0, Math.ceil((end - now) / 864e5)) : 0,
          keys: keysByShop.get(s.id) ?? []
        };
      });

      return jsonBody({
        ok: true,
        generated_at: new Date().toISOString(),
        counts,
        recent_activity: recentError ? [] : (recent ?? []),
        shops,
        viewer: { email: signIn.user.email }
      });
    }

    if (action === "set_fee") {
      const { shop_id, fee, currency } = payload;
      if (!shop_id || fee === undefined || fee === null || Number(fee) < 0) {
        return jsonBody({ error: "A shop and a non-negative fee are required." }, 400);
      }
      const update: Record<string, unknown> = {
        monthly_fee: Number(fee),
        updated_at: new Date().toISOString()
      };
      if (currency) update.currency = String(currency).toUpperCase().slice(0, 4);
      const { error } = await admin.from("shop_subscriptions").update(update).eq("shop_id", shop_id);
      if (error) return jsonBody({ error: error.message }, 500);
      return jsonBody({ ok: true });
    }

    if (action === "generate_key") {
      const { shop_id, fee } = payload;
      if (!shop_id) return jsonBody({ error: "A shop is required." }, 400);
      let feeAtIssue: number | null = null;
      if (fee !== undefined && fee !== null && Number(fee) >= 0) feeAtIssue = Number(fee);
      else {
        const { data: sub } = await admin.from("shop_subscriptions").select("monthly_fee").eq("shop_id", shop_id).maybeSingle();
        feeAtIssue = sub?.monthly_fee ?? null;
      }
      const keyCode = generateKeyCode();
      const { error } = await admin.from("activation_keys").insert({
        shop_id,
        key_code: keyCode,
        fee_at_issue: feeAtIssue,
        status: "PENDING"
      });
      if (error) return jsonBody({ error: error.message }, 500);
      return jsonBody({ ok: true, key_code: keyCode });
    }

    if (action === "confirm_key") {
      const { key_code } = payload;
      if (!key_code) return jsonBody({ error: "A key code is required." }, 400);
      const { data, error } = await admin
        .from("activation_keys")
        .update({ status: "CONFIRMED", confirmed_at: new Date().toISOString() })
        .eq("key_code", String(key_code).toUpperCase().trim())
        .eq("status", "PENDING")
        .select();
      if (error) return jsonBody({ error: error.message }, 500);
      if (!data || data.length === 0) {
        return jsonBody({ error: "Key not found or already confirmed." }, 404);
      }
      return jsonBody({ ok: true });
    }

    if (action === "revoke_key") {
      const { key_code } = payload;
      if (!key_code) return jsonBody({ error: "A key code is required." }, 400);
      const { data, error } = await admin
        .from("activation_keys")
        .update({ status: "REVOKED" })
        .eq("key_code", String(key_code).toUpperCase().trim())
        .in("status", ["PENDING", "CONFIRMED"])
        .select();
      if (error) return jsonBody({ error: error.message }, 500);
      if (!data || data.length === 0) {
        return jsonBody({ error: "Key not found or can no longer be revoked." }, 404);
      }
      return jsonBody({ ok: true });
    }

    if (action === "extend") {
      // Manual goodwill extension by the administrator.
      const { shop_id, days } = payload;
      if (!shop_id || !days || Number(days) <= 0) {
        return jsonBody({ error: "A shop and a positive number of days are required." }, 400);
      }
      const { data: sub } = await admin.from("shop_subscriptions").select("period_end").eq("shop_id", shop_id).maybeSingle();
      if (!sub) return jsonBody({ error: "No subscription found for this shop." }, 404);
      const base = Math.max(Date.now(), new Date(sub.period_end).getTime());
      const newEnd = new Date(base + Number(days) * 864e5).toISOString();
      const { error } = await admin.from("shop_subscriptions").update({ period_end: newEnd, updated_at: newEnd }).eq("shop_id", shop_id);
      if (error) return jsonBody({ error: error.message }, 500);
      return jsonBody({ ok: true, period_end: newEnd });
    }

    return jsonBody({ error: "Unknown action" }, 400);
  } catch (err: any) {
    return jsonBody({ error: err?.message || "Unexpected server error" }, 500);
  }
});
