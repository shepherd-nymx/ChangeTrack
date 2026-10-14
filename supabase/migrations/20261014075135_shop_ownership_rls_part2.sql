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
  TO authenticated USING (shop_id IS NULL OR is_shop_owner(shop_id));

CREATE POLICY "insert_shop_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (shop_id IS NULL OR is_shop_owner(shop_id));

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
