// Supabase Edge Function: whatsapp-webhook
// Handles verification handshake and delivery status callbacks from Meta Cloud API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Meta Webhook Verification Handshake (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const expectedToken = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "changetrack_meta_verify_token";

    if (mode === "subscribe" && token === expectedToken) {
      console.log("Meta Webhook Verified Successfully!");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Inbound Webhook Events (POST)
  if (req.method === "POST") {
    try {
      const data = await req.json();
      console.log("Received Meta WhatsApp Webhook Event:", JSON.stringify(data, null, 2));

      // Process statuses (sent, delivered, read, failed)
      const entry = data.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const statuses = value?.statuses;

      if (statuses && statuses.length > 0) {
        for (const statusObj of statuses) {
          console.log(`WhatsApp Message ${statusObj.id} status updated to: ${statusObj.status}`);
        }
      }

      return new Response(JSON.stringify({ status: "EVENT_RECEIVED" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("Webhook processing error:", err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});
