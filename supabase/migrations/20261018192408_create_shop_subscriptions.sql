/*
# Monthly subscription keys for shops

1. New Tables
   - `shop_subscriptions` — one row per shop holding the billing state:
     - `id` (uuid, primary key)
     - `shop_id` (uuid, unique, references shops, cascade delete)
     - `monthly_fee` (numeric, the fee the administrator sets per shop; default 0)
     - `currency` (text, display currency; default 'USD')
     - `period_start` / `period_end` (timestamptz, the current billing month window)
     - `created_at` / `updated_at` (timestamps)
   - `activation_keys` — renewal keys issued by the administrator:
     - `id` (uuid, primary key)
     - `shop_id` (uuid, references shops, cascade delete)
     - `key_code` (text, unique, the code the shop types in)
     - `fee_at_issue` (numeric, fee shown to the shop when the key was issued)
     - `status` (text: PENDING -> CONFIRMED -> USED, or REVOKED)
     - `created_at`, `confirmed_at`, `used_at` (audit timestamps)

2. Functions
   - `create_default_subscription()` — trigger on shops insert that starts the
     shop's first free month automatically at registration.
   - `redeem_activation_key(p_key text)` — SECURITY DEFINER: the signed-in shop
     owner submits a key; it must belong to their shop and be CONFIRMED. On
     success the billing period is extended by one month and the key is marked
     USED (single-use). Returns the new period end.

3. Security
   - RLS enabled on both new tables.
   - `shop_subscriptions`: owner can SELECT their own row only.
   - `activation_keys`: NO client policies — shops can never read or list keys;
     redemption happens only through the SECURITY DEFINER function, and the
     administrator works through the service-role edge function.
   - Existing shops are backfilled with a subscription starting from their
     original registration date.
*/

CREATE TABLE IF NOT EXISTS shop_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    monthly_fee numeric(12,2) NOT NULL DEFAULT 0,
    currency text NOT NULL DEFAULT 'USD',
    period_start timestamptz NOT NULL DEFAULT now(),
    period_end timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activation_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    key_code text NOT NULL UNIQUE,
    fee_at_issue numeric(12,2),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','USED','REVOKED')),
    created_at timestamptz DEFAULT now(),
    confirmed_at timestamptz,
    used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_activation_keys_shop ON activation_keys(shop_id, status);

ALTER TABLE shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_keys ENABLE ROW LEVEL SECURITY;

-- Owner can read (not write) their own subscription row.
DROP POLICY IF EXISTS "select_own_subscription" ON shop_subscriptions;
CREATE POLICY "select_own_subscription" ON shop_subscriptions FOR SELECT
  TO authenticated USING (is_shop_owner(shop_id));

-- activation_keys intentionally has no client policies.

-- Backfill existing shops from their registration date.
INSERT INTO shop_subscriptions (shop_id, monthly_fee, currency, period_start, period_end)
SELECT s.id, 0, 'USD', s.created_at, s.created_at + interval '1 month'
FROM shops s
WHERE NOT EXISTS (SELECT 1 FROM shop_subscriptions sub WHERE sub.shop_id = s.id);

-- New shops start their first month at sign-up.
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO shop_subscriptions (shop_id, monthly_fee, currency, period_start, period_end)
  VALUES (NEW.id, 0, 'USD', now(), now() + interval '1 month')
  ON CONFLICT (shop_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_create_default_subscription ON shops;
CREATE TRIGGER trg_create_default_subscription AFTER INSERT ON shops
FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Single-use key redemption, scoped to the signed-in owner's shop.
CREATE OR REPLACE FUNCTION redeem_activation_key(p_key text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_key activation_keys%ROWTYPE;
  v_new_end timestamptz;
BEGIN
  SELECT id INTO v_shop_id FROM shops WHERE owner_user_id = auth.uid() LIMIT 1;
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop is linked to this account.';
  END IF;

  SELECT * INTO v_key FROM activation_keys
    WHERE key_code = upper(trim(p_key)) AND shop_id = v_shop_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That key was not recognized for your shop.';
  END IF;

  IF v_key.status = 'USED' THEN
    RAISE EXCEPTION 'This key has already been used.';
  ELSIF v_key.status = 'REVOKED' THEN
    RAISE EXCEPTION 'This key has been cancelled by the administrator.';
  ELSIF v_key.status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'This key has not been confirmed by the administrator yet.';
  END IF;

  UPDATE shop_subscriptions
    SET period_end = GREATEST(now(), period_end) + interval '1 month',
        period_start = CASE WHEN period_end < now() THEN now() ELSE period_start END,
        updated_at = now()
    WHERE shop_id = v_shop_id
    RETURNING period_end INTO v_new_end;

  UPDATE activation_keys SET status = 'USED', used_at = now() WHERE id = v_key.id;

  RETURN v_new_end;
END $$;

GRANT EXECUTE ON FUNCTION redeem_activation_key(text) TO authenticated;
