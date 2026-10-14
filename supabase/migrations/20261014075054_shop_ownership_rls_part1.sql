/*
# Shop ownership + owner-scoped access (part 1: setup)

1. Modified tables
   - `shops`: adds `owner_user_id uuid NOT NULL DEFAULT auth.uid()` — the Supabase auth
     account that registered the shop. Default fills it from the session at insert time.

2. New function
   - `is_shop_owner(p_shop_id uuid)` — SECURITY DEFINER ownership check used by the
     owner-scoped policies added in part 2. Avoids recursive RLS on shops.

3. Security
   - Drops all existing open anon policies in preparation for owner-scoped policies.
*/

-- 1. Ownership column
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS owner_user_id uuid NOT NULL DEFAULT auth.uid();

UPDATE shops SET owner_user_id = id WHERE owner_user_id IS NULL;

-- 2. Ownership helper
CREATE OR REPLACE FUNCTION is_shop_owner(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops
    WHERE id = p_shop_id AND owner_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_shop_owner(uuid) TO anon, authenticated;

-- 3. Drop all existing policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 4. Re-enable RLS everywhere
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_balance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
