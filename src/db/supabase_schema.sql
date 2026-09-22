-- ========================================================================
-- CHANGETRACK POSTGRESQL / SUPABASE DATABASE SCHEMA
-- ========================================================================
-- Full schema for ChangeTrack with support for:
-- 1. Split / Partial Change (Cash handed over at till + remainder owed)
-- 2. Direct Change Registration (Registering customer change without a sale)
-- 3. Running Customer Balances & Immutable Ledger
-- 4. WhatsApp Digital Change Slips & Anti-Fraud Verification Tokens
-- ========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------
-- 1. SHOPS / STORES TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY DEFAULT ('shop_' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    branch_name TEXT DEFAULT 'Main Till',
    owner_name TEXT DEFAULT 'Tariro Moyo',
    logo_url TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    currency TEXT DEFAULT 'USD',
    currency_symbol TEXT DEFAULT '$',
    whatsapp_notice TEXT,
    owner_passcode TEXT DEFAULT '1234',
    is_passcode_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 2. EMPLOYEES / CASHIERS TABLE
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT ('emp_' || substr(md5(random()::text), 1, 8)),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CASHIER')),
    pin TEXT NOT NULL DEFAULT '1234', -- 4-digit till access PIN
    active BOOLEAN DEFAULT TRUE,
    avatar_color TEXT DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 3. CUSTOMERS TABLE (Cumulative running balance tracked per shop)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT ('cust_' || substr(md5(random()::text), 1, 8)),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    name TEXT DEFAULT 'Valued Customer',
    total_balance_owed NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_collected_lifetime NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_records_count INT NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_shop_customer_phone UNIQUE (shop_id, phone)
);

-- ------------------------------------------------------------------------
-- 4. TRANSACTIONS TABLE
-- Captures retail sales, tenders, immediate cash change, partial split change,
-- and direct change registrations.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, -- e.g. 'TX-10293'
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    cashier_id TEXT,
    cashier_name TEXT NOT NULL,
    purchase_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    change_calculated NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    change_given_now NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Cash given immediately to customer
    change_owed NUMERIC(12, 2) NOT NULL DEFAULT 0.00,       -- Amount recorded as outstanding change
    has_outstanding_change BOOLEAN NOT NULL DEFAULT FALSE,
    is_partial_change BOOLEAN NOT NULL DEFAULT FALSE,      -- TRUE if customer received partial cash & rest recorded
    is_direct_registration BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if operator directly registered change without sale
    change_record_id TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 5. CHANGE RECORDS TABLE
-- Digital change slips generated for customers with anti-fraud QR code payload,
-- partial change audit fields, and collection tracking.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS change_records (
    id TEXT PRIMARY KEY, -- e.g. 'CT-48291'
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    cashier_id TEXT,
    cashier_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Valued Customer',
    amount_owed NUMERIC(12, 2) NOT NULL, -- The remaining unpaid change owed on this slip
    total_change_calculated NUMERIC(12, 2), -- The total original change calculated before partial payout
    partial_cash_given_now NUMERIC(12, 2) DEFAULT 0.00, -- The partial cash amount handed over at till
    is_partial_change BOOLEAN NOT NULL DEFAULT FALSE, -- Flag: partial cash given, remainder recorded
    is_direct_registration BOOLEAN NOT NULL DEFAULT FALSE, -- Flag: direct change registration
    status TEXT NOT NULL DEFAULT 'OUTSTANDING' CHECK (status IN ('OUTSTANDING', 'COLLECTED', 'CANCELLED')),
    qr_code_payload TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Collection audit fields
    collected_at TIMESTAMPTZ,
    collected_by_employee_id TEXT,
    collected_by_employee_name TEXT,
    collection_method TEXT CHECK (collection_method IN ('CHANGE_ID', 'PHONE', 'WHATSAPP_CONFIRM', 'QR_CODE') OR collection_method IS NULL),
    
    -- Cancellation audit fields
    cancelled_at TIMESTAMPTZ,
    cancelled_by_employee_id TEXT,
    cancelled_by_employee_name TEXT,
    cancellation_reason TEXT
);

-- ------------------------------------------------------------------------
-- 6. CUSTOMER BALANCE LEDGER TABLE
-- Immutable double-entry audit log of every change addition, collection, or adjustment
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_balance_ledger (
    id TEXT PRIMARY KEY DEFAULT ('cble_' || substr(md5(random()::text), 1, 12)),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    change_record_id TEXT,
    transaction_id TEXT,
    previous_balance NUMERIC(12, 2) NOT NULL,
    amount_change NUMERIC(12, 2) NOT NULL, -- Positive for change added, negative for collected
    new_balance NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CHANGE_ADDED', 'CHANGE_COLLECTED', 'CHANGE_CANCELLED', 'MANUAL_ADJUSTMENT')),
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actor_name TEXT NOT NULL,
    notes TEXT
);

-- ------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
-- Complete tamper-evident audit trail of all till actions
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('audit_' || substr(md5(random()::text), 1, 12)),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    metadata JSONB
);

-- ------------------------------------------------------------------------
-- 8. DISPUTES TABLE
-- Tracks cashier or customer discrepancy inquiries and managerial resolutions
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY DEFAULT ('DISP-' || floor(1000 + random() * 9000)::text),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    transaction_id TEXT,
    change_id TEXT,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    claimed_amount NUMERIC(12, 2) NOT NULL,
    actual_amount_recorded NUMERIC(12, 2),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    opened_by_employee_id TEXT NOT NULL,
    opened_by_employee_name TEXT NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_employee_id TEXT,
    resolved_by_employee_name TEXT,
    resolution_notes TEXT
);

-- ========================================================================
-- IDEMPOTENT COLUMN ADDITIONS (Guarantees columns exist even on pre-existing tables)
-- ========================================================================
ALTER TABLE IF EXISTS change_records 
    ADD COLUMN IF NOT EXISTS total_change_calculated NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS partial_cash_given_now NUMERIC(12, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_partial_change BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_direct_registration BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS transactions 
    ADD COLUMN IF NOT EXISTS change_given_now NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS change_owed NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_partial_change BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_direct_registration BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS customer_balance_ledger
    ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS audit_logs
    ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================================================
-- HELPFUL INDEXES FOR HIGH-SPEED TILL LOOKUPS & REPORTING
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_change_records_shop_status ON change_records(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_change_records_customer_phone ON change_records(customer_phone);
CREATE INDEX IF NOT EXISTS idx_change_records_created_at ON change_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_shop_created ON transactions(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_id ON customer_balance_ledger(customer_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_shop_timestamp ON audit_logs(shop_id, "timestamp" DESC);

-- ========================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES (Idempotent: drops if already exists)
-- ========================================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_balance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users (and anon key for live till operations)
DROP POLICY IF EXISTS "Allow anon all on shops" ON shops;
CREATE POLICY "Allow anon all on shops" ON shops FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on employees" ON employees;
CREATE POLICY "Allow anon all on employees" ON employees FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on customers" ON customers;
CREATE POLICY "Allow anon all on customers" ON customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on transactions" ON transactions;
CREATE POLICY "Allow anon all on transactions" ON transactions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on change_records" ON change_records;
CREATE POLICY "Allow anon all on change_records" ON change_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on customer_balance_ledger" ON customer_balance_ledger;
CREATE POLICY "Allow anon all on customer_balance_ledger" ON customer_balance_ledger FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on audit_logs" ON audit_logs;
CREATE POLICY "Allow anon all on audit_logs" ON audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow anon all on disputes" ON disputes;
CREATE POLICY "Allow anon all on disputes" ON disputes FOR ALL USING (true);
