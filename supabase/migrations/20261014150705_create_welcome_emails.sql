/*
# Welcome email log table

1. New Tables
   - `welcome_emails` — records every welcome email attempt so a shop is only ever
     welcomed once, even if the user retries or the network drops.
     - `id` (uuid, primary key)
     - `user_id` (uuid) — the auth account that registered (from Supabase Auth)
     - `shop_id` (uuid) — the shop row created at registration
     - `email` (text) — the address the welcome email was sent to
     - `shop_name` (text) — snapshot of the shop name used in the email body
     - `status` (text) — 'PENDING', 'SENT', or 'FAILED'
     - `error` (text) — failure reason when status is FAILED
     - `created_at` (timestamptz) — when the attempt was first logged
     - `sent_at` (timestamptz) — when the email actually went out

2. Security
   - RLS enabled. The service role (used by the edge function) bypasses RLS and owns
     all reads/writes; signed-in shop owners may view only their own welcome-email
     record via user_id = auth.uid(). No anon access.
*/

CREATE TABLE IF NOT EXISTS welcome_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    shop_id uuid,
    email text NOT NULL,
    shop_name text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'PENDING',
    error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz
);

ALTER TABLE welcome_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_welcome_email" ON welcome_emails;
CREATE POLICY "select_own_welcome_email" ON welcome_emails FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_welcome_emails_user ON welcome_emails(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_welcome_emails_user_unique ON welcome_emails(user_id);
