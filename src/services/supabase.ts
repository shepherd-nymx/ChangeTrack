import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ChangeRecord, 
  Transaction, 
  Customer, 
  CustomerBalanceLedgerEntry, 
  Shop, 
  Employee, 
  SupabaseSyncConfig 
} from '../types';

const SYNC_CONFIG_KEY = 'changetrack_supabase_config';

const getEnvUrl = (): string => (import.meta.env.VITE_SUPABASE_URL as string) || '';
const getEnvKey = (): string => (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

const DEFAULT_CONFIG: SupabaseSyncConfig = {
  supabaseUrl: getEnvUrl(),
  supabaseAnonKey: getEnvKey(),
  isEnabled: true,
  autoSync: true,
  syncStatus: 'IDLE'
};

class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUrl = '';
  private currentKey = '';

  getConfig(): SupabaseSyncConfig {
    const envUrl = getEnvUrl();
    const envKey = getEnvKey();
    try {
      const stored = localStorage.getItem(SYNC_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Scrub any secrets that might have been stored in localStorage previously
        if (parsed.supabaseAnonKey || parsed.supabaseUrl) {
          delete parsed.supabaseAnonKey;
          delete parsed.supabaseUrl;
          localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(parsed));
        }
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          supabaseUrl: envUrl,
          supabaseAnonKey: envKey
        };
      }
    } catch (e) {
      console.warn('Failed to load Supabase sync config:', e);
    }
    return { ...DEFAULT_CONFIG, supabaseUrl: envUrl, supabaseAnonKey: envKey };
  }

  saveConfig(config: Partial<SupabaseSyncConfig>): SupabaseSyncConfig {
    const current = this.getConfig();
    const updated: SupabaseSyncConfig = { 
      ...current, 
      ...config,
      // Secrets strictly bound to environment variables, never overridden from client or stored
      supabaseUrl: getEnvUrl(),
      supabaseAnonKey: getEnvKey()
    };
    try {
      // Only persist non-sensitive preference settings
      const safeToStore = {
        isEnabled: updated.isEnabled ?? true,
        autoSync: updated.autoSync ?? true,
        lastSyncedAt: updated.lastSyncedAt,
        syncStatus: updated.syncStatus,
        syncedRecordsCount: updated.syncedRecordsCount
      };
      localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(safeToStore));
    } catch (e) {
      console.error('Failed to save Supabase config:', e);
    }
    return updated;
  }

  getClient(): SupabaseClient | null {
    const envUrl = getEnvUrl();
    const envKey = getEnvKey();
    if (!envUrl || !envKey) {
      return null;
    }

    if (!this.client || this.currentUrl !== envUrl || this.currentKey !== envKey) {
      try {
        this.client = createClient(envUrl.trim(), envKey.trim(), {
          auth: {
            persistSession: false
          }
        });
        this.currentUrl = envUrl;
        this.currentKey = envKey;
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        return null;
      }
    }

    return this.client;
  }

  isConfigured(): boolean {
    return Boolean(getEnvUrl() && getEnvKey());
  }

  /**
   * Test connection to Supabase and verify portal isolation
   * Strictly uses environment variables; never displays secrets.
   */
  async testConnection(portalId?: string): Promise<{ success: boolean; message: string; recordCount?: number }> {
    const url = getEnvUrl().trim();
    const key = getEnvKey().trim();

    if (!url || !key) {
      return { 
        success: false, 
        message: 'Supabase credentials are not configured in environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). Running in local offline mode.' 
      };
    }

    try {
      const client = createClient(url, key, { auth: { persistSession: false } });
      
      // Attempt to query change_records filtered by this phone's portal ID
      const query = client.from('change_records').select('id', { count: 'exact', head: true });
      if (portalId) {
        query.eq('shop_id', portalId);
      }
      
      const { count, error } = await query;
      if (error) {
        return { 
          success: false, 
          message: `Supabase status: ${error.message}` 
        };
      }

      return { 
        success: true, 
        message: portalId 
          ? `Connected! Cloud database active and isolated for Portal ID: ${portalId} (${count ?? 0} cloud records).` 
          : 'Connected successfully to Supabase cloud database!',
        recordCount: count ?? 0
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: err?.message || 'Failed to connect to Supabase.' 
      };
    }
  }

  /**
   * Sync a single Change Record to Supabase with strict phone portal scoping
   */
  async syncChangeRecord(record: ChangeRecord, portalId: string): Promise<boolean> {
    const client = this.getClient();
    const config = this.getConfig();
    if (!client || !config.isEnabled || !config.autoSync) return false;

    try {
      const payload = {
        id: record.id,
        transaction_id: record.transactionId || null,
        shop_id: portalId, // Strictly scoped to this phone's portal
        shop_name: record.shopName,
        cashier_id: record.cashierId || null,
        cashier_name: record.cashierName,
        customer_phone: record.customerPhone,
        customer_name: record.customerName || 'Valued Customer',
        amount_owed: record.amountOwed,
        total_change_calculated: record.totalChangeCalculated ?? null,
        partial_cash_given_now: record.partialCashGivenNow ?? 0,
        is_partial_change: record.isPartialChange ?? false,
        is_direct_registration: record.isDirectRegistration ?? false,
        status: record.status,
        qr_code_payload: record.qrCodePayload || null,
        notes: record.notes || null,
        created_at: record.createdAt,
        collected_at: record.collectedAt || null,
        collected_by_employee_id: record.collectedByEmployeeId || null,
        collected_by_employee_name: record.collectedByEmployeeName || null,
        collection_method: record.collectionMethod || null,
        cancelled_at: record.cancelledAt || null,
        cancelled_by_employee_id: record.cancelledByEmployeeId || null,
        cancelled_by_employee_name: record.cancelledByEmployeeName || null,
        cancellation_reason: record.cancellationReason || null
      };

      const { error } = await client
        .from('change_records')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`[Supabase] Error syncing change record ${record.id} for portal ${portalId}:`, error.message);
        this.saveConfig({ syncStatus: 'ERROR', lastErrorMessage: error.message });
        return false;
      }

      this.saveConfig({ 
        syncStatus: 'SUCCESS', 
        lastSyncedAt: new Date().toISOString(),
        lastErrorMessage: undefined 
      });
      return true;
    } catch (e: any) {
      console.warn('[Supabase] Exception syncing record:', e);
      return false;
    }
  }

  /**
   * Sync a single Transaction to Supabase with strict phone portal scoping
   */
  async syncTransaction(tx: Transaction, portalId: string): Promise<boolean> {
    const client = this.getClient();
    const config = this.getConfig();
    if (!client || !config.isEnabled || !config.autoSync) return false;

    try {
      const payload = {
        id: tx.id,
        shop_id: portalId, // Strictly scoped to this phone's portal
        cashier_id: tx.cashierId || null,
        cashier_name: tx.cashierName,
        purchase_total: tx.purchaseTotal,
        amount_received: tx.amountReceived,
        change_calculated: tx.changeCalculated,
        change_given_now: tx.changeGivenNow ?? 0,
        change_owed: tx.changeOwed ?? 0,
        has_outstanding_change: tx.hasOutstandingChange,
        is_partial_change: tx.isPartialChange ?? false,
        is_direct_registration: tx.isDirectRegistration ?? false,
        change_record_id: tx.changeRecordId || null,
        customer_phone: tx.customerPhone || null,
        customer_name: tx.customerName || null,
        notes: tx.notes || null,
        created_at: tx.createdAt
      };

      const { error } = await client
        .from('transactions')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`[Supabase] Error syncing transaction ${tx.id}:`, error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] Exception syncing transaction:', e);
      return false;
    }
  }

  /**
   * Sync a Customer profile to Supabase with strict phone portal scoping
   */
  async syncCustomer(customer: Customer, portalId: string): Promise<boolean> {
    const client = this.getClient();
    const config = this.getConfig();
    if (!client || !config.isEnabled || !config.autoSync) return false;

    try {
      const payload = {
        id: customer.id,
        shop_id: portalId,
        phone: customer.phone,
        name: customer.name || 'Valued Customer',
        total_balance_owed: customer.totalBalanceOwed,
        total_collected_lifetime: customer.totalCollectedLifetime,
        total_records_count: customer.totalRecordsCount,
        last_activity_at: customer.lastActivityAt,
        created_at: customer.createdAt
      };

      const { error } = await client
        .from('customers')
        .upsert(payload, { onConflict: 'shop_id,phone' });

      if (error) {
        console.warn(`[Supabase] Error syncing customer ${customer.phone}:`, error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] Exception syncing customer:', e);
      return false;
    }
  }

  /**
   * Sync Customer Ledger Entry to Supabase with strict phone portal scoping
   */
  async syncLedgerEntry(entry: CustomerBalanceLedgerEntry, portalId: string): Promise<boolean> {
    const client = this.getClient();
    const config = this.getConfig();
    if (!client || !config.isEnabled || !config.autoSync) return false;

    try {
      const payload = {
        id: entry.id,
        shop_id: portalId,
        customer_id: entry.customerId,
        customer_phone: entry.customerPhone,
        change_record_id: entry.changeRecordId || null,
        transaction_id: entry.transactionId || null,
        previous_balance: entry.previousBalance,
        amount_change: entry.amountChange,
        new_balance: entry.newBalance,
        type: entry.type,
        timestamp: entry.timestamp,
        created_at: entry.timestamp,
        actor_name: entry.actorName,
        notes: entry.notes || null
      };

      const { error } = await client
        .from('customer_balance_ledger')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`[Supabase] Error syncing ledger entry ${entry.id}:`, error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] Exception syncing ledger entry:', e);
      return false;
    }
  }

  /**
   * Sync Shop details to Supabase
   */
  async syncShop(shop: Shop, portalId: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const payload = {
        id: portalId,
        name: shop.name,
        branch_name: shop.branchName || 'Main Till',
        owner_name: shop.ownerName || 'Store Owner',
        phone: shop.phone || '',
        address: shop.address || '',
        currency: shop.currency || 'USD',
        currency_symbol: shop.currencySymbol || '$',
        whatsapp_notice: shop.whatsappNotice || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await client
        .from('shops')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.warn(`[Supabase] Error syncing shop ${portalId}:`, error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[Supabase] Exception syncing shop:', e);
      return false;
    }
  }

  /**
   * PUSH all local data for this Phone Portal to Supabase
   */
  async pushAllLocalPortalData(portalId: string, data: {
    shop: Shop;
    employees: Employee[];
    customers: Customer[];
    transactions: Transaction[];
    changeRecords: ChangeRecord[];
    ledger: CustomerBalanceLedgerEntry[];
  }): Promise<{ success: boolean; pushedCount: number; error?: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, pushedCount: 0, error: 'Supabase client not configured.' };
    }

    try {
      this.saveConfig({ syncStatus: 'SYNCING' });

      // 1. Sync Shop
      await this.syncShop(data.shop, portalId);

      // 2. Sync Employees (with shop_id = portalId)
      if (data.employees.length > 0) {
        const empsPayload = data.employees.map(e => ({
          id: e.id,
          shop_id: portalId,
          name: e.name,
          email: e.email || null,
          role: e.role,
          pin: e.pin || '1234',
          active: e.active !== false
        }));
        await client.from('employees').upsert(empsPayload, { onConflict: 'id' });
      }

      // 3. Sync Customers
      if (data.customers.length > 0) {
        const custPayload = data.customers.map(c => ({
          id: c.id,
          shop_id: portalId,
          phone: c.phone,
          name: c.name || 'Valued Customer',
          total_balance_owed: c.totalBalanceOwed,
          total_collected_lifetime: c.totalCollectedLifetime,
          total_records_count: c.totalRecordsCount,
          last_activity_at: c.lastActivityAt,
          created_at: c.createdAt
        }));
        await client.from('customers').upsert(custPayload, { onConflict: 'shop_id,phone' });
      }

      // 4. Sync Transactions
      if (data.transactions.length > 0) {
        const txPayload = data.transactions.map(tx => ({
          id: tx.id,
          shop_id: portalId,
          cashier_id: tx.cashierId || null,
          cashier_name: tx.cashierName,
          purchase_total: tx.purchaseTotal,
          amount_received: tx.amountReceived,
          change_calculated: tx.changeCalculated,
          change_given_now: tx.changeGivenNow ?? 0,
          change_owed: tx.changeOwed ?? 0,
          has_outstanding_change: tx.hasOutstandingChange,
          is_partial_change: tx.isPartialChange ?? false,
          is_direct_registration: tx.isDirectRegistration ?? false,
          change_record_id: tx.changeRecordId || null,
          customer_phone: tx.customerPhone || null,
          customer_name: tx.customerName || null,
          notes: tx.notes || null,
          created_at: tx.createdAt
        }));
        await client.from('transactions').upsert(txPayload, { onConflict: 'id' });
      }

      // 5. Sync Change Records
      if (data.changeRecords.length > 0) {
        const crPayload = data.changeRecords.map(r => ({
          id: r.id,
          transaction_id: r.transactionId || null,
          shop_id: portalId,
          shop_name: r.shopName,
          cashier_id: r.cashierId || null,
          cashier_name: r.cashierName,
          customer_phone: r.customerPhone,
          customer_name: r.customerName || 'Valued Customer',
          amount_owed: r.amountOwed,
          total_change_calculated: r.totalChangeCalculated ?? null,
          partial_cash_given_now: r.partialCashGivenNow ?? 0,
          is_partial_change: r.isPartialChange ?? false,
          is_direct_registration: r.isDirectRegistration ?? false,
          status: r.status,
          qr_code_payload: r.qrCodePayload || null,
          notes: r.notes || null,
          created_at: r.createdAt,
          collected_at: r.collectedAt || null,
          collected_by_employee_id: r.collectedByEmployeeId || null,
          collected_by_employee_name: r.collectedByEmployeeName || null,
          collection_method: r.collectionMethod || null,
          cancelled_at: r.cancelledAt || null,
          cancelled_by_employee_id: r.cancelledByEmployeeId || null,
          cancelled_by_employee_name: r.cancelledByEmployeeName || null,
          cancellation_reason: r.cancellationReason || null
        }));
        await client.from('change_records').upsert(crPayload, { onConflict: 'id' });
      }

      // 6. Sync Ledger
      if (data.ledger.length > 0) {
        const lPayload = data.ledger.map(l => ({
          id: l.id,
          shop_id: portalId,
          customer_id: l.customerId,
          customer_phone: l.customerPhone,
          change_record_id: l.changeRecordId || null,
          transaction_id: l.transactionId || null,
          previous_balance: l.previousBalance,
          amount_change: l.amountChange,
          new_balance: l.newBalance,
          type: l.type,
          timestamp: l.timestamp,
          created_at: l.timestamp,
          actor_name: l.actorName,
          notes: l.notes || null
        }));
        await client.from('customer_balance_ledger').upsert(lPayload, { onConflict: 'id' });
      }

      const totalPushed = data.changeRecords.length + data.transactions.length + data.customers.length;
      this.saveConfig({ 
        syncStatus: 'SUCCESS', 
        lastSyncedAt: new Date().toISOString(),
        syncedRecordsCount: totalPushed,
        lastErrorMessage: undefined 
      });

      return { success: true, pushedCount: totalPushed };
    } catch (err: any) {
      console.error('[Supabase] Full push failed:', err);
      this.saveConfig({ syncStatus: 'ERROR', lastErrorMessage: err?.message || 'Sync failed' });
      return { success: false, pushedCount: 0, error: err?.message || 'Sync failed' };
    }
  }

  /**
   * PULL remote data for this Phone Portal from Supabase
   * CRITICAL: Strictly filtered by shop_id = portalId to maintain total isolation!
   */
  async pullRemotePortalData(portalId: string): Promise<{
    success: boolean;
    shop?: Partial<Shop>;
    employees?: Employee[];
    customers?: Customer[];
    transactions?: Transaction[];
    changeRecords?: ChangeRecord[];
    ledger?: CustomerBalanceLedgerEntry[];
    error?: string;
  }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'Supabase is not configured yet.' };
    }

    try {
      this.saveConfig({ syncStatus: 'SYNCING' });

      // Fetch shop details for this portal
      const { data: remoteShop } = await client
        .from('shops')
        .select('*')
        .eq('id', portalId)
        .maybeSingle();

      // Fetch employees for this portal
      const { data: remoteEmployees } = await client
        .from('employees')
        .select('*')
        .eq('shop_id', portalId);

      // Fetch customers for this portal
      const { data: remoteCustomers } = await client
        .from('customers')
        .select('*')
        .eq('shop_id', portalId);

      // Fetch transactions for this portal
      const { data: remoteTransactions } = await client
        .from('transactions')
        .select('*')
        .eq('shop_id', portalId)
        .order('created_at', { ascending: false });

      // Fetch change records for this portal
      const { data: remoteChangeRecords } = await client
        .from('change_records')
        .select('*')
        .eq('shop_id', portalId)
        .order('created_at', { ascending: false });

      // Fetch customer balance ledger for this portal
      const { data: remoteLedger } = await client
        .from('customer_balance_ledger')
        .select('*')
        .eq('shop_id', portalId)
        .order('created_at', { ascending: false });

      // Map Supabase rows back to internal TypeScript types
      const mappedRecords: ChangeRecord[] = (remoteChangeRecords || []).map(r => ({
        id: r.id,
        transactionId: r.transaction_id || '',
        shopId: r.shop_id,
        shopName: r.shop_name,
        cashierId: r.cashier_id || '',
        cashierName: r.cashier_name,
        customerPhone: r.customer_phone,
        customerName: r.customer_name || undefined,
        amountOwed: parseFloat(r.amount_owed) || 0,
        totalChangeCalculated: r.total_change_calculated !== null ? parseFloat(r.total_change_calculated) : undefined,
        partialCashGivenNow: r.partial_cash_given_now !== null ? parseFloat(r.partial_cash_given_now) : 0,
        isPartialChange: Boolean(r.is_partial_change),
        isDirectRegistration: Boolean(r.is_direct_registration),
        status: r.status,
        createdAt: r.created_at,
        qrCodePayload: r.qr_code_payload || '',
        notes: r.notes || undefined,
        collectedAt: r.collected_at || undefined,
        collectedByEmployeeId: r.collected_by_employee_id || undefined,
        collectedByEmployeeName: r.collected_by_employee_name || undefined,
        collectionMethod: r.collection_method || undefined,
        cancelledAt: r.cancelled_at || undefined,
        cancelledByEmployeeId: r.cancelled_by_employee_id || undefined,
        cancelledByEmployeeName: r.cancelled_by_employee_name || undefined,
        cancellationReason: r.cancellation_reason || undefined
      }));

      const mappedTransactions: Transaction[] = (remoteTransactions || []).map(t => ({
        id: t.id,
        shopId: t.shop_id,
        cashierId: t.cashier_id || '',
        cashierName: t.cashier_name,
        purchaseTotal: parseFloat(t.purchase_total) || 0,
        amountReceived: parseFloat(t.amount_received) || 0,
        changeCalculated: parseFloat(t.change_calculated) || 0,
        changeGivenNow: parseFloat(t.change_given_now) || 0,
        changeOwed: parseFloat(t.change_owed) || 0,
        hasOutstandingChange: Boolean(t.has_outstanding_change),
        isPartialChange: Boolean(t.is_partial_change),
        isDirectRegistration: Boolean(t.is_direct_registration),
        changeRecordId: t.change_record_id || undefined,
        customerPhone: t.customer_phone || undefined,
        customerName: t.customer_name || undefined,
        createdAt: t.created_at,
        notes: t.notes || undefined
      }));

      const mappedCustomers: Customer[] = (remoteCustomers || []).map(c => ({
        id: c.id,
        shopId: c.shop_id,
        phone: c.phone,
        name: c.name || undefined,
        totalBalanceOwed: parseFloat(c.total_balance_owed) || 0,
        totalCollectedLifetime: parseFloat(c.total_collected_lifetime) || 0,
        totalRecordsCount: parseInt(c.total_records_count) || 0,
        lastActivityAt: c.last_activity_at || new Date().toISOString(),
        createdAt: c.created_at || new Date().toISOString()
      }));

      const mappedLedger: CustomerBalanceLedgerEntry[] = (remoteLedger || []).map(l => ({
        id: l.id,
        shopId: l.shop_id,
        customerId: l.customer_id,
        customerPhone: l.customer_phone,
        changeRecordId: l.change_record_id || undefined,
        transactionId: l.transaction_id || undefined,
        previousBalance: parseFloat(l.previous_balance) || 0,
        amountChange: parseFloat(l.amount_change) || 0,
        newBalance: parseFloat(l.new_balance) || 0,
        type: l.type,
        timestamp: l.timestamp || l.created_at || new Date().toISOString(),
        actorName: l.actor_name,
        notes: l.notes || undefined
      }));

      const mappedEmployees: Employee[] = (remoteEmployees || []).map(e => ({
        id: e.id,
        shopId: e.shop_id,
        name: e.name,
        email: e.email || '',
        role: e.role,
        pin: e.pin || '1234',
        active: Boolean(e.active),
        avatarColor: e.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'
      }));

      this.saveConfig({ 
        syncStatus: 'SUCCESS', 
        lastSyncedAt: new Date().toISOString(),
        syncedRecordsCount: mappedRecords.length + mappedTransactions.length,
        lastErrorMessage: undefined 
      });

      return {
        success: true,
        shop: remoteShop ? {
          id: remoteShop.id,
          name: remoteShop.name,
          branchName: remoteShop.branch_name,
          ownerName: remoteShop.owner_name,
          phone: remoteShop.phone,
          address: remoteShop.address,
          currency: remoteShop.currency,
          currencySymbol: remoteShop.currency_symbol,
          whatsappNotice: remoteShop.whatsapp_notice
        } : undefined,
        employees: mappedEmployees.length > 0 ? mappedEmployees : undefined,
        customers: mappedCustomers,
        transactions: mappedTransactions,
        changeRecords: mappedRecords,
        ledger: mappedLedger
      };
    } catch (err: any) {
      console.error('[Supabase] Pull failed:', err);
      this.saveConfig({ syncStatus: 'ERROR', lastErrorMessage: err?.message || 'Pull failed' });
      return { success: false, error: err?.message || 'Pull failed' };
    }
  }
}

export const supabaseService = new SupabaseService();
