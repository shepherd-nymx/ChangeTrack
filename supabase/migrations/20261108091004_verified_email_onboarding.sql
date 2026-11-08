-- Bring the empty production database up to the ownership model expected by the app.
-- Existing data, if present in another environment, is never assigned to guessed owners.
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_name text NOT NULL DEFAULT '';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS shops_one_per_owner ON public.shops(owner_user_id);
CREATE OR REPLACE FUNCTION public.is_shop_owner(p_shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id AND owner_user_id = (SELECT auth.uid()));
$$;
DO $$ DECLARE pol record; BEGIN
  FOR pol IN SELECT policyname,tablename FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('shops','employees','customers','transactions','change_records','customer_balance_ledger','change_collections','whatsapp_messages','audit_logs','disputes')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',pol.policyname,pol.tablename); END LOOP;
END $$;
/*
# Owner-scoped RLS policies (part 2, corrected)

1. Security
   - Owner-scoped policies on all ten tables via the is_shop_owner() helper from part 1.
   - whatsapp_messages has no shop_id column: its policies scope through the parent
     change record via EXISTS on change_records joined to shops.
   - audit_logs is append-only: SELECT + INSERT only (immutability by design).
*/

-- SHOPS
CREATE POLICY "select_own_shop" ON shops FOR SELECT
  TO authenticated USING (auth.uid() = owner_user_id);

CREATE POLICY "insert_own_shop" ON shops FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "update_own_shop" ON shops FOR UPDATE
  TO authenticated USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "delete_own_shop" ON shops FOR DELETE
  TO authenticated USING (auth.uid() = owner_user_id);

-- EMPLOYEES
CREATE POLICY "select_shop_employees" ON employees FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_employees" ON employees FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_employees" ON employees FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_employees" ON employees FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));

-- CUSTOMERS
CREATE POLICY "select_shop_customers" ON customers FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_customers" ON customers FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_customers" ON customers FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));

-- TRANSACTIONS
CREATE POLICY "select_shop_transactions" ON transactions FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_transactions" ON transactions FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_transactions" ON transactions FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));

-- CHANGE RECORDS
CREATE POLICY "select_shop_change_records" ON change_records FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_change_records" ON change_records FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_change_records" ON change_records FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_change_records" ON change_records FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));

-- CUSTOMER BALANCE LEDGER
CREATE POLICY "select_shop_ledger" ON customer_balance_ledger FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_ledger" ON customer_balance_ledger FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_ledger" ON customer_balance_ledger FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_ledger" ON customer_balance_ledger FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));

-- CHANGE COLLECTIONS
CREATE POLICY "select_shop_collections" ON change_collections FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_collections" ON change_collections FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_collections" ON change_collections FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_collections" ON change_collections FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));

-- WHATSAPP MESSAGES (scoped through parent change record)
CREATE POLICY "select_shop_whatsapp" ON whatsapp_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM change_records cr
      JOIN shops s ON s.id = cr.shop_id
      WHERE cr.id = change_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "insert_shop_whatsapp" ON whatsapp_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM change_records cr
      JOIN shops s ON s.id = cr.shop_id
      WHERE cr.id = change_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "update_shop_whatsapp" ON whatsapp_messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM change_records cr
      JOIN shops s ON s.id = cr.shop_id
      WHERE cr.id = change_id AND s.owner_user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM change_records cr
      JOIN shops s ON s.id = cr.shop_id
      WHERE cr.id = change_id AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "delete_shop_whatsapp" ON whatsapp_messages FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM change_records cr
      JOIN shops s ON s.id = cr.shop_id
      WHERE cr.id = change_id AND s.owner_user_id = auth.uid()
    )
  );

-- AUDIT LOGS (append-only)
CREATE POLICY "select_shop_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

-- DISPUTES
CREATE POLICY "select_shop_disputes" ON disputes FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

CREATE POLICY "insert_shop_disputes" ON disputes FOR INSERT
  TO authenticated WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "update_shop_disputes" ON disputes FOR UPDATE
  TO authenticated USING (is_shop_owner(shop_id))
  WITH CHECK (is_shop_owner(shop_id));

CREATE POLICY "delete_shop_disputes" ON disputes FOR DELETE
  TO authenticated USING (is_shop_owner(shop_id));
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

DROP POLICY IF EXISTS "select_own_acceptances" ON public.legal_acceptances;
CREATE POLICY "select_own_acceptances" ON legal_acceptances FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_acceptances" ON public.legal_acceptances;
CREATE POLICY "insert_own_acceptances" ON legal_acceptances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Append-only: no UPDATE or DELETE policies are created.

-- Guard: an account may only record its own acceptance.
CREATE OR REPLACE FUNCTION guard_acceptance_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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
SECURITY INVOKER
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

GRANT SELECT, INSERT ON public.legal_acceptances TO authenticated;
