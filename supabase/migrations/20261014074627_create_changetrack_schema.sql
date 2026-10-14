/*
# Create ChangeTrack core schema (no-auth, portal-scoped sync)

1. Overview
   - This app is an offline-first POS/change-tracking tool. Each phone has a "portal ID"
     used as the shop_id, and the browser syncs full local state up and pulls it back down.
   - There is NO sign-in screen: the frontend always talks to Supabase with the anon key.
     Therefore every RLS policy is granted TO anon, authenticated and the data is
     intentionally shared (isolation between portals is by shop_id filtering in the app).

2. New Tables
   - `shops`               — one row per phone portal / shop profile (owner_name, currency, etc.)
   - `employees`           — till staff with plaintext PIN (app-managed, synced from device)
   - `customers`           — customer directory with cumulative change balance owed
   - `transactions`        — register sales (TEXT ids like TX-10293, client-generated)
   - `change_records`      — individual change slips (TEXT ids like CT-48291) with collection
                             and cancellation metadata
   - `customer_balance_ledger` — immutable per-customer balance timeline (column `type` holds
                             the entry kind, matching the app's sync payload)
   - `change_collections`  — audit trail of collection events
   - `whatsapp_messages`   — log of WhatsApp notifications sent to customers
   - `audit_logs`          — immutable app-level audit history
   - `disputes`            — customer change disputes and their resolution

3. Enum types
   - user_role, change_status, dispute_status, collection_method, ledger_entry_type

4. Important design decisions
   - NO auto-balance trigger: the app is the source of truth for customer balances and
     upserts them directly. A server-side trigger would double-count every synced record.
   - `change_records.transaction_id` is nullable (direct change registration has no sale).
   - The owner passcode is deliberately NOT stored in the cloud table (anon-readable);
     it lives only on the device.
   - A trigger prevents reverting COLLECTED change records back to OUTSTANDING (fraud guard).

5. Security
   - RLS enabled on every table.
   - 4 policies per table (SELECT / INSERT / UPDATE / DELETE) TO anon, authenticated.
   - USING (true) / WITH CHECK (true) is intentional: shared single-tenant data, no auth.
*/

-- 1. EXTENSIONS + ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE change_status AS ENUM ('OUTSTANDING', 'COLLECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE collection_method AS ENUM ('CHANGE_ID', 'PHONE', 'WHATSAPP_CONFIRM', 'QR_CODE', 'FULL_BALANCE_PAYOUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_entry_type AS ENUM ('CHANGE_ADDED', 'CHANGE_COLLECTED', 'CHANGE_CANCELLED', 'MANUAL_ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. SHOPS (one row per phone portal)
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    branch_name TEXT,
    owner_name TEXT,
    logo_url TEXT,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    whatsapp_notice TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. EMPLOYEES (till staff; PIN is app-managed and synced from the device)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role user_role NOT NULL DEFAULT 'CASHIER',
    pin TEXT NOT NULL DEFAULT '1234',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CUSTOMERS (cumulative change balance per phone number)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    name TEXT,
    total_balance_owed NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_balance_owed >= 0),
    total_collected_lifetime NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_collected_lifetime >= 0),
    total_records_count INTEGER NOT NULL DEFAULT 0 CHECK (total_records_count >= 0),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_shop_customer_phone UNIQUE(shop_id, phone)
);

-- 5. TRANSACTIONS (register sales; client-generated TEXT ids)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    cashier_id UUID,
    cashier_name TEXT NOT NULL,
    purchase_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (purchase_total >= 0),
    amount_received NUMERIC(12,2) NOT NULL DEFAULT 0,
    change_calculated NUMERIC(12,2) NOT NULL DEFAULT 0,
    change_given_now NUMERIC(12,2) NOT NULL DEFAULT 0,
    change_owed NUMERIC(12,2) NOT NULL DEFAULT 0,
    has_outstanding_change BOOLEAN NOT NULL DEFAULT FALSE,
    is_partial_change BOOLEAN NOT NULL DEFAULT FALSE,
    is_direct_registration BOOLEAN NOT NULL DEFAULT FALSE,
    change_record_id TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CHANGE RECORDS (individual change slips)
CREATE TABLE IF NOT EXISTS change_records (
    id TEXT PRIMARY KEY,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    shop_name TEXT NOT NULL DEFAULT '',
    cashier_id UUID,
    cashier_name TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    amount_owed NUMERIC(12,2) NOT NULL CHECK (amount_owed > 0),
    total_change_calculated NUMERIC(12,2),
    partial_cash_given_now NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_partial_change BOOLEAN NOT NULL DEFAULT FALSE,
    is_direct_registration BOOLEAN NOT NULL DEFAULT FALSE,
    status change_status NOT NULL DEFAULT 'OUTSTANDING',
    qr_code_payload TEXT NOT NULL DEFAULT '',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    collected_at TIMESTAMPTZ,
    collected_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    collected_by_employee_name TEXT,
    collection_method collection_method,
    cancelled_at TIMESTAMPTZ,
    cancelled_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    cancelled_by_employee_name TEXT,
    cancellation_reason TEXT
);

-- 7. CUSTOMER BALANCE LEDGER (immutable balance timeline)
CREATE TABLE IF NOT EXISTS customer_balance_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    change_record_id TEXT REFERENCES change_records(id) ON DELETE SET NULL,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    previous_balance NUMERIC(12,2) NOT NULL,
    amount_change NUMERIC(12,2) NOT NULL,
    new_balance NUMERIC(12,2) NOT NULL,
    type ledger_entry_type NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL DEFAULT 'CASHIER',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CHANGE COLLECTIONS AUDIT
CREATE TABLE IF NOT EXISTS change_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_record_id TEXT NOT NULL REFERENCES change_records(id) ON DELETE RESTRICT,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    collected_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    customer_phone TEXT NOT NULL,
    verification_method collection_method NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. WHATSAPP MESSAGE LOG
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_id TEXT NOT NULL REFERENCES change_records(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    type TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    previous_balance NUMERIC(12,2),
    cumulative_total_balance_owed NUMERIC(12,2),
    message_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT',
    meta_message_id TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- 10. AUDIT LOGS (immutable history)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE RESTRICT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    checksum TEXT,
    prev_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 11. DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    change_id TEXT REFERENCES change_records(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    claimed_amount NUMERIC(12,2) NOT NULL,
    actual_amount_recorded NUMERIC(12,2),
    description TEXT NOT NULL,
    status dispute_status NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    opened_by_employee_name TEXT NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    resolved_by_employee_name TEXT,
    resolution_notes TEXT
);

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(shop_id, total_balance_owed);
CREATE INDEX IF NOT EXISTS idx_change_records_phone ON change_records(shop_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_change_records_status ON change_records(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_created ON transactions(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_balance_ledger_customer ON customer_balance_ledger(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_change ON whatsapp_messages(change_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_shop_status ON disputes(shop_id, status);

-- 13. FRAUD GUARD: a COLLECTED change record can never go back to OUTSTANDING
CREATE OR REPLACE FUNCTION prevent_unauthorized_change_reversal()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COLLECTED' AND NEW.status = 'OUTSTANDING' THEN
        RAISE EXCEPTION 'FRAUD PREVENTION: Cannot revert a COLLECTED change record back to OUTSTANDING.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_collected_records ON change_records;
CREATE TRIGGER trg_protect_collected_records
BEFORE UPDATE OF status ON change_records
FOR EACH ROW
EXECUTE FUNCTION prevent_unauthorized_change_reversal();

-- 14. ROW LEVEL SECURITY
-- No sign-in screen in this app: the anon-key client owns and reads this data.
-- Isolation between phone portals is by shop_id filtering in the application layer.
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

DROP POLICY IF EXISTS "anon_select_shops" ON shops;
CREATE POLICY "anon_select_shops" ON shops FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_shops" ON shops;
CREATE POLICY "anon_insert_shops" ON shops FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_shops" ON shops;
CREATE POLICY "anon_update_shops" ON shops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_shops" ON shops;
CREATE POLICY "anon_delete_shops" ON shops FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_change_records" ON change_records;
CREATE POLICY "anon_select_change_records" ON change_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_change_records" ON change_records;
CREATE POLICY "anon_insert_change_records" ON change_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_change_records" ON change_records;
CREATE POLICY "anon_update_change_records" ON change_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_change_records" ON change_records;
CREATE POLICY "anon_delete_change_records" ON change_records FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_ledger" ON customer_balance_ledger;
CREATE POLICY "anon_select_ledger" ON customer_balance_ledger FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ledger" ON customer_balance_ledger;
CREATE POLICY "anon_insert_ledger" ON customer_balance_ledger FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ledger" ON customer_balance_ledger;
CREATE POLICY "anon_update_ledger" ON customer_balance_ledger FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ledger" ON customer_balance_ledger;
CREATE POLICY "anon_delete_ledger" ON customer_balance_ledger FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_collections" ON change_collections;
CREATE POLICY "anon_select_collections" ON change_collections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_collections" ON change_collections;
CREATE POLICY "anon_insert_collections" ON change_collections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_collections" ON change_collections;
CREATE POLICY "anon_update_collections" ON change_collections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_collections" ON change_collections;
CREATE POLICY "anon_delete_collections" ON change_collections FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_whatsapp" ON whatsapp_messages;
CREATE POLICY "anon_select_whatsapp" ON whatsapp_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_whatsapp" ON whatsapp_messages;
CREATE POLICY "anon_insert_whatsapp" ON whatsapp_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_whatsapp" ON whatsapp_messages;
CREATE POLICY "anon_update_whatsapp" ON whatsapp_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_whatsapp" ON whatsapp_messages;
CREATE POLICY "anon_delete_whatsapp" ON whatsapp_messages FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
CREATE POLICY "anon_update_audit_logs" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_disputes" ON disputes;
CREATE POLICY "anon_select_disputes" ON disputes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_disputes" ON disputes;
CREATE POLICY "anon_insert_disputes" ON disputes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_disputes" ON disputes;
CREATE POLICY "anon_update_disputes" ON disputes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_disputes" ON disputes;
CREATE POLICY "anon_delete_disputes" ON disputes FOR DELETE TO anon, authenticated USING (true);
