/*
# Legal acceptance records (v1)

1. New table
   - `legal_acceptances`: one row per acceptance event. Append-only — no UPDATE or
     DELETE policies, so historical acceptance records are preserved.

2. Security
   - RLS enabled. Users may read/insert only their own acceptance rows.
   - A trigger guard rejects any insert whose user_id is not the current auth user,
     so one account can never record acceptance on behalf of another.
   - A trigger on `shops` refuses shop creation unless the acting auth user already
     has at least one acceptance row — this blocks bypassing the consent flow by
     calling the API directly.
*/

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  shop_id uuid,
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  user_agent text
);

ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_acceptances" ON legal_acceptances FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_acceptances" ON legal_acceptances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Append-only: no UPDATE or DELETE policies are created.

-- Guard: an account may only record its own acceptance.
CREATE OR REPLACE FUNCTION guard_acceptance_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acceptance can only be recorded for the signed-in account.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS acceptance_owner_guard ON legal_acceptances;
CREATE TRIGGER acceptance_owner_guard
  BEFORE INSERT ON legal_acceptances
  FOR EACH ROW EXECUTE FUNCTION guard_acceptance_owner();

-- Enforcement: shops cannot be created until the user has accepted the terms.
CREATE OR REPLACE FUNCTION require_acceptance_before_shop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM legal_acceptances WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must read and accept the Terms of Service and Privacy Policy before creating a shop account.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shops_require_acceptance ON shops;
CREATE TRIGGER shops_require_acceptance
  BEFORE INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION require_acceptance_before_shop();
