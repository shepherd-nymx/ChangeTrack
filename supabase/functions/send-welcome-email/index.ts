// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.117.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function buildWelcomeHtml(shopName: string, firstName: string): string {
  const displayShop = shopName || "your shop";
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#065f46);padding:32px 40px;">
              <span style="font-size:24px;">🪙</span>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Welcome to ChangeTrack!</h1>
              <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px;font-weight:600;">Retail Change Ledger</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:15px;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
                Your shop <strong>${displayShop}</strong> is registered and its private portal is ready to go.
              </p>
              <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
                Here's what you can do right away:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#334155;font-size:14px;line-height:1.9;">
                <li><strong>Record change</strong> owed to customers at the till</li>
                <li>Let customers collect by <strong>Change ID, phone, QR code or WhatsApp</strong></li>
                <li>Track every balance with an <strong>immutable audit trail</strong></li>
              </ul>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#059669;border-radius:12px;">
                    <a href="#" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Open your portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                ChangeTrack — digital, tamper-resistant change tracking for retail.<br/>
                You received this email because this address registered a shop.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendViaResend(
  apiKey: string,
  to: string,
  shopName: string,
  firstName: string
): Promise<{ ok: boolean; error?: string }> {
  const from = Deno.env.get("WELCOME_EMAIL_FROM") || "ChangeTrack <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Welcome to ChangeTrack — ${shopName} is ready!`,
      html: buildWelcomeHtml(shopName, firstName),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const body: any = await req.json().catch(() => ({}));
    const shopName: string = (body.shopName || "").toString().slice(0, 100);
    const email: string = (body.email || "").toString().trim().toLowerCase().slice(0, 200);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Identify the caller: valid session required
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sign in first, then we'll send your welcome email." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = userData.user;

    // Idempotency: one welcome email per account, ever
    const { data: existing } = await supabase
      .from("welcome_emails")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.status === "SENT" || existing?.status === "PENDING") {
      return new Response(
        JSON.stringify({ ok: true, skipped: true, message: "Welcome email already sent for this account." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let recordId: string;
    if (existing) {
      recordId = existing.id;
      await supabase.from("welcome_emails").update({ status: "PENDING", error: null }).eq("id", recordId);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("welcome_emails")
        .insert({
          user_id: user.id,
          email,
          shop_name: shopName,
          status: "PENDING",
        })
        .select("id")
        .single();
      if (insertError || !inserted) {
        return new Response(
          JSON.stringify({ error: insertError?.message || "Could not log the welcome email." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      recordId = inserted.id;
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      await supabase
        .from("welcome_emails")
        .update({ status: "FAILED", error: "Email service not configured (missing RESEND_API_KEY)." })
        .eq("id", recordId);
      return new Response(
        JSON.stringify({ ok: false, error: "Email service not configured yet. The registration itself succeeded." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = shopName.split(" ")[0] || "there";
    const result = await sendViaResend(resendKey, email, shopName, firstName);

    if (!result.ok) {
      await supabase
        .from("welcome_emails")
        .update({ status: "FAILED", error: result.error?.slice(0, 500) })
        .eq("id", recordId);
      return new Response(
        JSON.stringify({ ok: false, error: "Welcome email could not be sent. Registration still succeeded." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("welcome_emails")
      .update({ status: "SENT", sent_at: new Date().toISOString() })
      .eq("id", recordId);

    return new Response(
      JSON.stringify({ ok: true, message: "Welcome email sent!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
