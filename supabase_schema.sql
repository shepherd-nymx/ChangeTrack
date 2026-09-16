-- ==============================================================================
-- ChangeTrack - Supabase PostgreSQL Schema & Security Policies
-- Digital, Tamper-Resistant Retail Transaction, Customer Multi-Change Ledger & WhatsApp Sync
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER', 'CUSTOMER');
CREATE TYPE change_status AS ENUM ('OUTSTANDING', 'COLLECTED', 'CANCELLED');
CREATE TYPE dispute_status AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED');
CREATE TYPE collection_method AS ENUM ('CHANGE_ID', 'PHONE', 'WHATSAPP_CONFIRM', 'QR_CODE', 'FULL_BALANCE_PAYOUT');
CREATE TYPE ledger_entry_type AS ENUM ('CHANGE_ADDED', 'CHANGE_COLLECTED', 'CHANGE_CANCELLED', 'MANUAL_ADJUSTMENT');

-- 3. SHOPS TABLE
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    branch_name TEXT,
    logo_url TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    whatsapp_notice TEXT,
    owner_passcode TEXT DEFAULT '1234',
    is_passcode_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EMPLOYEES / USERS TABLE
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    auth_user_id UUID, -- References auth.users if Supabase Auth is enabled
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'CASHIER',
    pin_hash TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CUSTOMERS TABLE (Persistent Customer Directory & Cumulative Balance Tracking)
-- Tracks each customer's accumulated change balance so multiple change events add on top of each other.
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    name TEXT,
    total_balance_owed NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_balance_owed >= 0),
    total_collected_lifetime NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_collected_lifetime >= 0),
    total_change_records_count INTEGER NOT NULL DEFAULT 0 CHECK (total_change_records_count >= 0),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_shop_customer_phone UNIQUE(shop_id, phone)
);

-- 6. TRANSACTIONS TABLE (POS Register Sales)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY, -- e.g. TX-10293
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    cashier_name TEXT NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    purchase_total NUMERIC(12, 2) NOT NULL CHECK (purchase_total >= 0),
    amount_received NUMERIC(12, 2) NOT NULL CHECK (amount_received >= purchase_total),
    change_calculated NUMERIC(12, 2) NOT NULL DEFAULT 0,
    change_given_now NUMERIC(12, 2) NOT NULL DEFAULT 0,
    change_owed NUMERIC(12, 2) NOT NULL DEFAULT 0,
    has_outstanding_change BOOLEAN NOT NULL DEFAULT FALSE,
    customer_phone TEXT,
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CHANGE RECORDS TABLE (Individual Change Slips)
-- Each customer can have multiple change records that stack together.
CREATE TABLE change_records (
    id TEXT PRIMARY KEY, -- e.g. CT-48291
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    cashier_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    cashier_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    amount_owed NUMERIC(12, 2) NOT NULL CHECK (amount_owed > 0),
    status change_status NOT NULL DEFAULT 'OUTSTANDING',
    qr_code_payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Collection Metadata
    collected_at TIMESTAMPTZ,
    collected_by_employee_id UUID REFERENCES employees(id) ON DELETE RESTRICT,
    collected_by_employee_name TEXT,
    collection_method collection_method,

    -- Cancellation Metadata (Admin Only)
    cancelled_at TIMESTAMPTZ,
    cancelled_by_employee_id UUID REFERENCES employees(id) ON DELETE RESTRICT,
    cancelled_by_employee_name TEXT,
    cancellation_reason TEXT
);

-- 8. CUSTOMER BALANCE LEDGER TABLE (Immutable balance evolution trail)
-- Records every single change addition (+ owed) and collection (- owed) to maintain an auditable timeline.
CREATE TABLE customer_balance_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    change_record_id TEXT REFERENCES change_records(id) ON DELETE SET NULL,
    transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
    previous_balance NUMERIC(12, 2) NOT NULL,
    amount_change NUMERIC(12, 2) NOT NULL, -- Positive for change added, negative for change collected
    new_balance NUMERIC(12, 2) NOT NULL,
    entry_type ledger_entry_type NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL DEFAULT 'CASHIER',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CHANGE COLLECTIONS AUDIT TABLE
CREATE TABLE change_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_record_id TEXT NOT NULL REFERENCES change_records(id) ON DELETE RESTRICT,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    collected_by_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL,
    customer_phone TEXT NOT NULL,
    verification_method collection_method NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WHATSAPP MESSAGES LOG TABLE
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_id TEXT NOT NULL REFERENCES change_records(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    type TEXT NOT NULL, -- 'CHANGE_RECORDED' | 'CHANGE_COLLECTED'
    shop_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    previous_balance NUMERIC(12, 2),
    cumulative_total_balance_owed NUMERIC(12, 2),
    message_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT', -- 'DELIVERED', 'SENT', 'FAILED'
    meta_message_id TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS (Immutable History)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_id UUID REFERENCES employees(id),
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    details TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 12. DISPUTES TABLE
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    change_id TEXT REFERENCES change_records(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    claimed_amount NUMERIC(12, 2) NOT NULL,
    actual_amount_recorded NUMERIC(12, 2),
    description TEXT NOT NULL,
    status dispute_status NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_by_employee_id UUID NOT NULL REFERENCES employees(id),
    opened_by_employee_name TEXT NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_employee_id UUID REFERENCES employees(id),
    resolved_by_employee_name TEXT,
    resolution_notes TEXT
);

-- ==============================================================================
-- INDEXES FOR INSTANT PHONE & BALANCE LOOKUPS
-- ==============================================================================
CREATE INDEX idx_customers_phone ON customers(shop_id, phone);
CREATE INDEX idx_customers_balance ON customers(shop_id, total_balance_owed);
CREATE INDEX idx_change_records_phone ON change_records(shop_id, customer_phone);
CREATE INDEX idx_change_records_status ON change_records(shop_id, status);
CREATE INDEX idx_customer_balance_ledger_customer ON customer_balance_ledger(customer_id, created_at DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ==============================================================================
-- AUTOMATED BALANCE SYNCHRONIZATION TRIGGER
-- Automatically adds new change on top of customer balance or deducts when collected
-- ==============================================================================
CREATE OR REPLACE FUNCTION sync_customer_balance_on_change_record()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id UUID;
    v_prev_balance NUMERIC(12, 2) := 0.00;
    v_new_balance NUMERIC(12, 2) := 0.00;
BEGIN
    -- 1. Ensure customer profile exists in database
    INSERT INTO customers (shop_id, phone, name, total_balance_owed, total_collected_lifetime, total_change_records_count, last_activity_at)
    VALUES (NEW.shop_id, NEW.customer_phone, NEW.customer_name, 0.00, 0.00, 0, NOW())
    ON CONFLICT (shop_id, phone) DO UPDATE
    SET 
        name = COALESCE(EXCLUDED.name, customers.name),
        last_activity_at = NOW()
    RETURNING id, total_balance_owed INTO v_customer_id, v_prev_balance;

    -- Attach customer_id to the change_records row
    NEW.customer_id := v_customer_id;

    -- 2. CASE A: NEW OUTSTANDING CHANGE RECORD INSERTED (Add on top of balance owed)
    IF TG_OP = 'INSERT' AND NEW.status = 'OUTSTANDING' THEN
        v_new_balance := v_prev_balance + NEW.amount_owed;

        -- Update customer's cumulative running balance
        UPDATE customers
        SET 
            total_balance_owed = v_new_balance,
            total_change_records_count = total_change_records_count + 1,
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = v_customer_id;

        -- Log to customer balance ledger
        INSERT INTO customer_balance_ledger (
            shop_id, customer_id, customer_phone, change_record_id, transaction_id,
            previous_balance, amount_change, new_balance, entry_type, actor_name
        ) VALUES (
            NEW.shop_id, v_customer_id, NEW.customer_phone, NEW.id, NEW.transaction_id,
            v_prev_balance, NEW.amount_owed, v_new_balance, 'CHANGE_ADDED', NEW.cashier_name
        );

    -- 3. CASE B: CHANGE RECORD MARKED COLLECTED (Deduct from balance owed, add to lifetime collected)
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'OUTSTANDING' AND NEW.status = 'COLLECTED' THEN
        v_new_balance := GREATEST(0.00, v_prev_balance - NEW.amount_owed);

        UPDATE customers
        SET 
            total_balance_owed = v_new_balance,
            total_collected_lifetime = total_collected_lifetime + NEW.amount_owed,
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = v_customer_id;

        INSERT INTO customer_balance_ledger (
            shop_id, customer_id, customer_phone, change_record_id, transaction_id,
            previous_balance, amount_change, new_balance, entry_type, actor_name
        ) VALUES (
            NEW.shop_id, v_customer_id, NEW.customer_phone, NEW.id, NEW.transaction_id,
            v_prev_balance, -NEW.amount_owed, v_new_balance, 'CHANGE_COLLECTED', COALESCE(NEW.collected_by_employee_name, 'Cashier')
        );

    -- 4. CASE C: CHANGE RECORD CANCELLED/VOIDED BY ADMIN (Remove from balance owed)
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'OUTSTANDING' AND NEW.status = 'CANCELLED' THEN
        v_new_balance := GREATEST(0.00, v_prev_balance - NEW.amount_owed);

        UPDATE customers
        SET 
            total_balance_owed = v_new_balance,
            last_activity_at = NOW(),
            updated_at = NOW()
        WHERE id = v_customer_id;

        INSERT INTO customer_balance_ledger (
            shop_id, customer_id, customer_phone, change_record_id, transaction_id,
            previous_balance, amount_change, new_balance, entry_type, actor_name, notes
        ) VALUES (
            NEW.shop_id, v_customer_id, NEW.customer_phone, NEW.id, NEW.transaction_id,
            v_prev_balance, -NEW.amount_owed, v_new_balance, 'CHANGE_CANCELLED', COALESCE(NEW.cancelled_by_employee_name, 'Admin'), NEW.cancellation_reason
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_customer_balance
BEFORE INSERT OR UPDATE OF status ON change_records
FOR EACH ROW
EXECUTE FUNCTION sync_customer_balance_on_change_record();

-- ==============================================================================
-- IMMUTABILITY TRIGGER: PREVENT UNAUTHORIZED STATUS REVERSALS
-- ==============================================================================
CREATE OR REPLACE FUNCTION prevent_unauthorized_change_reversal()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COLLECTED' AND NEW.status = 'OUTSTANDING' THEN
        RAISE EXCEPTION 'FRAUD PREVENTION: Cannot revert a COLLECTED change record back to OUTSTANDING. Only Admin voiding is permitted.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_collected_records
BEFORE UPDATE ON change_records
FOR EACH ROW
EXECUTE FUNCTION prevent_unauthorized_change_reversal();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_balance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Allow shop staff to access data for their shop
CREATE POLICY shop_customers_all ON customers
    FOR ALL USING (shop_id = (current_setting('app.current_shop_id', true))::uuid);

CREATE POLICY shop_ledger_all ON customer_balance_ledger
    FOR ALL USING (shop_id = (current_setting('app.current_shop_id', true))::uuid);

CREATE POLICY shop_change_records_all ON change_records
    FOR ALL USING (shop_id = (current_setting('app.current_shop_id', true))::uuid);

CREATE POLICY shop_transactions_all ON transactions
    FOR ALL USING (shop_id = (current_setting('app.current_shop_id', true))::uuid);
