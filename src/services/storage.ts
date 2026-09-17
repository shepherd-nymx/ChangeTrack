import {
  Shop,
  Employee,
  Transaction,
  ChangeRecord,
  AuditLog,
  WhatsAppMessage,
  Dispute,
  WhatsAppConfig,
  DashboardStats,
  Customer,
  CustomerBalanceLedgerEntry
} from '../types';
import {
  INITIAL_SHOP,
  INITIAL_EMPLOYEES,
  INITIAL_TRANSACTIONS,
  INITIAL_CHANGE_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WHATSAPP_MESSAGES,
  INITIAL_DISPUTES,
  INITIAL_WHATSAPP_CONFIG,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_LEDGER
} from '../data/initialData';
import {
  sendWhatsAppNotification,
  buildWhatsAppDirectLink,
  generateRecordChangeMessage,
  generateCollectedChangeMessage,
  generateMultiCollectMessage,
  createWhatsAppRedirectLog
} from './whatsapp';

const KEYS = {
  SHOP: 'changetrack_shop',
  EMPLOYEES: 'changetrack_employees',
  TRANSACTIONS: 'changetrack_transactions',
  CHANGE_RECORDS: 'changetrack_records',
  AUDIT_LOGS: 'changetrack_audit_logs',
  WHATSAPP_MSGS: 'changetrack_wa_msgs',
  DISPUTES: 'changetrack_disputes',
  WHATSAPP_CONFIG: 'changetrack_wa_config',
  CURRENT_USER: 'changetrack_current_user',
  CUSTOMERS: 'changetrack_customers',
  CUSTOMER_LEDGER: 'changetrack_customer_ledger'
};

class StorageService {
  private load<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
    }
    return defaultValue;
  }

  private save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // --- Shop ---
  getShop(): Shop {
    const shop = this.load<Shop>(KEYS.SHOP, INITIAL_SHOP);
    return {
      ...INITIAL_SHOP,
      ...shop,
      ownerName: shop.ownerName || INITIAL_SHOP.ownerName || 'Tariro Moyo',
      ownerPasscode: shop.ownerPasscode !== undefined ? shop.ownerPasscode : '1234',
      isPasscodeRequired: shop.isPasscodeRequired !== undefined ? shop.isPasscodeRequired : true
    };
  }

  updateShop(shop: Shop): Shop {
    this.save(KEYS.SHOP, shop);

    // If ownerName is set, keep the primary ADMIN employee in sync
    if (shop.ownerName && shop.ownerName.trim()) {
      const employees = this.getEmployees();
      const adminIndex = employees.findIndex(e => e.role === 'ADMIN');
      if (adminIndex !== -1 && employees[adminIndex].name !== shop.ownerName.trim()) {
        employees[adminIndex].name = shop.ownerName.trim();
        this.save(KEYS.EMPLOYEES, employees);
      }
    }

    return shop;
  }

  getAdminName(): string {
    const shop = this.getShop();
    if (shop.ownerName && shop.ownerName.trim()) return shop.ownerName.trim();
    const admin = this.getEmployees().find(e => e.role === 'ADMIN');
    return admin?.name || 'Tariro Moyo';
  }

  updateAdminName(newName: string, actor?: Employee): { success: boolean; newName?: string; error?: string } {
    const cleanName = newName.trim();
    if (!cleanName) {
      return { success: false, error: 'Administrator name cannot be blank.' };
    }

    const shop = this.getShop();
    const oldName = shop.ownerName || 'Shop Administrator';
    shop.ownerName = cleanName;
    this.save(KEYS.SHOP, shop);

    const employees = this.getEmployees();
    let admin = employees.find(e => e.id === actor?.id && e.role === 'ADMIN');
    if (!admin) {
      admin = employees.find(e => e.role === 'ADMIN');
    }
    if (admin) {
      admin.name = cleanName;
      this.save(KEYS.EMPLOYEES, employees);
    }

    this.addAuditLog({
      shopId: shop.id,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: admin?.id || 'admin',
      actorId: actor?.id || 'admin',
      actorName: cleanName,
      actorRole: 'ADMIN',
      details: `Administrator name changed from "${oldName}" to "${cleanName}".`
    });

    return { success: true, newName: cleanName };
  }

  // --- Employees ---
  getEmployees(): Employee[] {
    return this.load<Employee[]>(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find(e => e.id === id);
  }

  addEmployee(emp: Omit<Employee, 'id'>, actor?: Employee): Employee {
    const employees = this.getEmployees();
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`
    };
    employees.push(newEmp);
    this.save(KEYS.EMPLOYEES, employees);

    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'EMPLOYEE_CREATED',
      entityType: 'EMPLOYEE',
      entityId: newEmp.id,
      actorId: actor?.id || 'admin',
      actorName: actor?.name || 'Shop Owner',
      actorRole: actor?.role || 'ADMIN',
      details: `New staff operator created: ${newEmp.name} (${newEmp.role}, ${newEmp.email}). Till access enabled.`
    });

    return newEmp;
  }

  updateEmployee(
    id: string, 
    updates: Partial<Omit<Employee, 'id' | 'shopId'>>,
    actor?: Employee
  ): { success: boolean; employee?: Employee; error?: string } {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) {
      return { success: false, error: 'Staff member not found.' };
    }

    const currentEmp = employees[index];

    // Safety check: If demoting or deactivating the last active Admin, prevent lock-out
    if (
      (updates.role === 'CASHIER' && currentEmp.role === 'ADMIN') ||
      (updates.active === false && currentEmp.active && currentEmp.role === 'ADMIN')
    ) {
      const remainingActiveAdmins = employees.filter(e => e.id !== id && e.role === 'ADMIN' && e.active);
      if (remainingActiveAdmins.length === 0) {
        return { 
          success: false, 
          error: 'Cannot demote or suspend the only active Administrator. At least one active Administrator must remain.' 
        };
      }
    }

    const updatedEmp: Employee = {
      ...currentEmp,
      ...updates
    };

    employees[index] = updatedEmp;
    this.save(KEYS.EMPLOYEES, employees);

    const shop = this.getShop();

    // If an Admin employee was updated with a new name, keep shop.ownerName in sync
    if ((currentEmp.role === 'ADMIN' || updates.role === 'ADMIN') && updates.name && updates.name.trim()) {
      if (shop.ownerName !== updates.name.trim()) {
        shop.ownerName = updates.name.trim();
        this.save(KEYS.SHOP, shop);
      }
    }

    const changesSummary = Object.entries(updates)
      .map(([k, v]) => `${k}: ${k === 'pin' ? '••••' : v}`)
      .join(', ');

    this.addAuditLog({
      shopId: shop.id,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: id,
      actorId: actor?.id || 'admin',
      actorName: actor?.name || 'Shop Owner',
      actorRole: actor?.role || 'ADMIN',
      details: `Staff member ${updatedEmp.name} (${id}) updated by ${actor?.name || 'Owner'}. Updated fields: [${changesSummary}].`
    });

    return { success: true, employee: updatedEmp };
  }

  deleteEmployee(
    id: string,
    actor?: Employee
  ): { success: boolean; error?: string } {
    const employees = this.getEmployees();
    const target = employees.find(e => e.id === id);
    if (!target) {
      return { success: false, error: 'Staff member not found.' };
    }

    // Safety check: Cannot delete the last Administrator
    if (target.role === 'ADMIN') {
      const otherAdmins = employees.filter(e => e.id !== id && e.role === 'ADMIN');
      if (otherAdmins.length === 0) {
        return {
          success: false,
          error: 'Cannot delete the only remaining Administrator. Promote another staff member to Administrator first.'
        };
      }
    }

    const remaining = employees.filter(e => e.id !== id);
    this.save(KEYS.EMPLOYEES, remaining);

    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'EMPLOYEE_DELETED',
      entityType: 'EMPLOYEE',
      entityId: id,
      actorId: actor?.id || 'admin',
      actorName: actor?.name || 'Shop Owner',
      actorRole: actor?.role || 'ADMIN',
      details: `Staff member ${target.name} (${target.role}, ${target.email}) deleted from system by ${actor?.name || 'Owner'}. Historical transaction and audit records remain intact.`
    });

    return { success: true };
  }

  toggleEmployeeStatus(id: string, actor?: Employee): Employee[] {
    const employees = this.getEmployees();
    const target = employees.find(e => e.id === id);
    if (!target) return employees;

    // If attempting to suspend the last active Admin, prevent it
    if (target.active && target.role === 'ADMIN') {
      const otherActiveAdmins = employees.filter(e => e.id !== id && e.role === 'ADMIN' && e.active);
      if (otherActiveAdmins.length === 0) {
        return employees;
      }
    }

    const newActive = !target.active;
    const updated = employees.map(emp => 
      emp.id === id ? { ...emp, active: newActive } : emp
    );
    this.save(KEYS.EMPLOYEES, updated);

    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'EMPLOYEE_UPDATED',
      entityType: 'EMPLOYEE',
      entityId: id,
      actorId: actor?.id || 'admin',
      actorName: actor?.name || 'Shop Owner',
      actorRole: actor?.role || 'ADMIN',
      details: `Staff member ${target.name} till access status changed to ${newActive ? 'ACTIVE' : 'SUSPENDED'}.`
    });

    return updated;
  }

  // --- Transactions ---
  getTransactions(): Transaction[] {
    return this.load<Transaction[]>(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  // --- Change Records ---
  getChangeRecords(): ChangeRecord[] {
    return this.load<ChangeRecord[]>(KEYS.CHANGE_RECORDS, INITIAL_CHANGE_RECORDS);
  }

  getChangeRecordById(id: string): ChangeRecord | undefined {
    const cleanId = id.trim().toUpperCase();
    return this.getChangeRecords().find(r => r.id.toUpperCase() === cleanId);
  }

  searchRecordsByPhone(phone: string): ChangeRecord[] {
    const cleanQuery = phone.replace(/[^0-9]/g, '');
    if (!cleanQuery) return [];
    return this.getChangeRecords().filter(r => {
      const p = r.customerPhone.replace(/[^0-9]/g, '');
      return p.includes(cleanQuery);
    });
  }

  // --- Customers & Multi-Change Ledger ---
  getCustomers(): Customer[] {
    const customers = this.load<Customer[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    return customers.map(c => ({
      ...c,
      totalBalanceOwed: c.totalBalanceOwed ?? c.totalAmountOwed ?? 0,
      totalCollectedLifetime: c.totalCollectedLifetime ?? c.totalAmountCollected ?? 0
    }));
  }

  getCustomerByPhone(phone: string): Customer | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return undefined;
    return this.getCustomers().find(c => c.phone.replace(/[^0-9]/g, '') === cleanPhone);
  }

  getCustomerLedger(customerPhoneOrId: string): CustomerBalanceLedgerEntry[] {
    const ledger = this.load<CustomerBalanceLedgerEntry[]>(KEYS.CUSTOMER_LEDGER, INITIAL_CUSTOMER_LEDGER);
    const cleanPhone = customerPhoneOrId.replace(/[^0-9]/g, '');
    return ledger.filter(entry => 
      entry.customerId === customerPhoneOrId || 
      (cleanPhone && entry.customerPhone.replace(/[^0-9]/g, '') === cleanPhone)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  syncCustomerAddChange(
    phone: string,
    name: string | undefined,
    amount: number,
    changeId: string,
    txId: string,
    actorName: string
  ): { customer: Customer; previousBalance: number; newBalance: number } {
    const customers = this.getCustomers();
    const ledger = this.load<CustomerBalanceLedgerEntry[]>(KEYS.CUSTOMER_LEDGER, INITIAL_CUSTOMER_LEDGER);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const now = new Date().toISOString();
    const shop = this.getShop();

    let customerIndex = customers.findIndex(c => c.phone.replace(/[^0-9]/g, '') === cleanPhone);
    let customer: Customer;
    let previousBalance = 0;

    if (customerIndex !== -1) {
      customer = { ...customers[customerIndex] };
      previousBalance = customer.totalBalanceOwed || 0;
      if (name && (!customer.name || customer.name === 'Valued Customer')) {
        customer.name = name;
      }
    } else {
      customer = {
        id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        shopId: shop.id,
        phone,
        name: name || 'Valued Customer',
        totalBalanceOwed: 0,
        totalCollectedLifetime: 0,
        totalRecordsCount: 0,
        lastActivityAt: now,
        createdAt: now
      };
      customerIndex = customers.length;
      customers.push(customer);
    }

    const newBalance = Math.round((previousBalance + amount) * 100) / 100;
    customer.totalBalanceOwed = newBalance;
    customer.totalAmountOwed = newBalance;
    customer.totalRecordsCount = (customer.totalRecordsCount || 0) + 1;
    customer.lastActivityAt = now;
    customer.updatedAt = now;

    customers[customerIndex] = customer;
    this.save(KEYS.CUSTOMERS, customers);

    // Record in customer balance ledger
    const ledgerEntry: CustomerBalanceLedgerEntry = {
      id: `cble-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId: shop.id,
      customerId: customer.id,
      customerPhone: customer.phone,
      changeRecordId: changeId,
      transactionId: txId,
      previousBalance,
      amountChange: amount,
      newBalance,
      type: 'CHANGE_ADDED',
      timestamp: now,
      actorName,
      notes: `Change slip ${changeId} added ($${amount.toFixed(2)})`
    };
    ledger.unshift(ledgerEntry);
    this.save(KEYS.CUSTOMER_LEDGER, ledger);

    return { customer, previousBalance, newBalance };
  }

  syncCustomerCollectChange(
    phone: string,
    amount: number,
    changeId: string,
    txId: string,
    actorName: string
  ): { customer?: Customer; previousBalance: number; remainingBalance: number } {
    const customers = this.getCustomers();
    const ledger = this.load<CustomerBalanceLedgerEntry[]>(KEYS.CUSTOMER_LEDGER, INITIAL_CUSTOMER_LEDGER);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const now = new Date().toISOString();
    const shop = this.getShop();

    const customerIndex = customers.findIndex(c => c.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (customerIndex === -1) {
      return { previousBalance: amount, remainingBalance: 0 };
    }

    const customer = { ...customers[customerIndex] };
    const previousBalance = customer.totalBalanceOwed || 0;
    const remainingBalance = Math.max(0, Math.round((previousBalance - amount) * 100) / 100);

    customer.totalBalanceOwed = remainingBalance;
    customer.totalAmountOwed = remainingBalance;
    customer.totalCollectedLifetime = (customer.totalCollectedLifetime || 0) + amount;
    customer.totalAmountCollected = customer.totalCollectedLifetime;
    customer.lastActivityAt = now;
    customer.updatedAt = now;

    customers[customerIndex] = customer;
    this.save(KEYS.CUSTOMERS, customers);

    const ledgerEntry: CustomerBalanceLedgerEntry = {
      id: `cble-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId: shop.id,
      customerId: customer.id,
      customerPhone: customer.phone,
      changeRecordId: changeId,
      transactionId: txId,
      previousBalance,
      amountChange: -amount,
      newBalance: remainingBalance,
      type: 'CHANGE_COLLECTED',
      timestamp: now,
      actorName,
      notes: `Change ${changeId} collected ($${amount.toFixed(2)})`
    };
    ledger.unshift(ledgerEntry);
    this.save(KEYS.CUSTOMER_LEDGER, ledger);

    return { customer, previousBalance, remainingBalance };
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.load<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.save(KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  // --- WhatsApp Messages ---
  getWhatsAppMessages(): WhatsAppMessage[] {
    return this.load<WhatsAppMessage[]>(KEYS.WHATSAPP_MSGS, INITIAL_WHATSAPP_MESSAGES);
  }

  getWhatsAppConfig(): WhatsAppConfig {
    return this.load<WhatsAppConfig>(KEYS.WHATSAPP_CONFIG, INITIAL_WHATSAPP_CONFIG);
  }

  updateWhatsAppConfig(config: WhatsAppConfig): WhatsAppConfig {
    this.save(KEYS.WHATSAPP_CONFIG, config);
    return config;
  }

  // --- Disputes ---
  getDisputes(): Dispute[] {
    return this.load<Dispute[]>(KEYS.DISPUTES, INITIAL_DISPUTES);
  }

  createDispute(data: {
    transactionId: string;
    changeId?: string;
    customerPhone: string;
    customerName?: string;
    claimedAmount: number;
    description: string;
    employee: Employee;
  }): Dispute {
    const disputes = this.getDisputes();
    const newDispute: Dispute = {
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      shopId: data.employee.shopId,
      transactionId: data.transactionId,
      changeId: data.changeId,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      claimedAmount: data.claimedAmount,
      description: data.description,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      openedByEmployeeId: data.employee.id,
      openedByEmployeeName: data.employee.name
    };
    disputes.unshift(newDispute);
    this.save(KEYS.DISPUTES, disputes);

    this.addAuditLog({
      shopId: data.employee.shopId,
      action: 'DISPUTE_OPENED',
      entityType: 'DISPUTE',
      entityId: newDispute.id,
      actorId: data.employee.id,
      actorName: data.employee.name,
      actorRole: data.employee.role,
      details: `Dispute logged for customer ${data.customerPhone}: Claimed $${data.claimedAmount.toFixed(2)}. Details: ${data.description}`
    });

    return newDispute;
  }

  resolveDispute(disputeId: string, employee: Employee, resolutionNotes: string, status: 'RESOLVED' | 'REJECTED'): Dispute | undefined {
    const disputes = this.getDisputes();
    const target = disputes.find(d => d.id === disputeId);
    if (!target) return undefined;

    target.status = status;
    target.resolvedAt = new Date().toISOString();
    target.resolvedByEmployeeId = employee.id;
    target.resolvedByEmployeeName = employee.name;
    target.resolutionNotes = resolutionNotes;

    this.save(KEYS.DISPUTES, disputes);

    this.addAuditLog({
      shopId: employee.shopId,
      action: 'DISPUTE_RESOLVED',
      entityType: 'DISPUTE',
      entityId: disputeId,
      actorId: employee.id,
      actorName: employee.name,
      actorRole: employee.role,
      details: `Dispute ${disputeId} marked ${status} by ${employee.name}. Resolution: ${resolutionNotes}`
    });

    return target;
  }

  // --- Till Actions: Process Transaction & Change ---

  // 1. Give change now (no outstanding balance)
  processCashSaleGivenNow(params: {
    purchaseTotal: number;
    amountReceived: number;
    employee: Employee;
    customerPhone?: string;
    customerName?: string;
    notes?: string;
  }): { transaction: Transaction } {
    const change = Math.round((params.amountReceived - params.purchaseTotal) * 100) / 100;
    const txId = `TX-${Math.floor(10000 + Math.random() * 90000)}`;
    const shop = this.getShop();

    const transaction: Transaction = {
      id: txId,
      shopId: shop.id,
      cashierId: params.employee.id,
      cashierName: params.employee.name,
      purchaseTotal: params.purchaseTotal,
      amountReceived: params.amountReceived,
      changeCalculated: change,
      changeGivenNow: change,
      changeOwed: 0,
      hasOutstandingChange: false,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      createdAt: new Date().toISOString(),
      notes: params.notes || 'Full change dispensed immediately at till'
    };

    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    this.save(KEYS.TRANSACTIONS, transactions);

    this.addAuditLog({
      shopId: shop.id,
      action: 'TRANSACTION_CREATED',
      entityType: 'TRANSACTION',
      entityId: txId,
      actorId: params.employee.id,
      actorName: params.employee.name,
      actorRole: params.employee.role,
      details: `Cash sale ${txId}: Total $${params.purchaseTotal.toFixed(2)}, Received $${params.amountReceived.toFixed(2)}, Change $${change.toFixed(2)} given immediately.`
    });

    return { transaction };
  }

  // 2. Record change as OUTSTANDING
  async processRecordChange(params: {
    purchaseTotal: number;
    amountReceived: number;
    customerPhone: string;
    customerName?: string;
    employee: Employee;
    notes?: string;
  }): Promise<{ 
    transaction: Transaction; 
    changeRecord: ChangeRecord; 
    waMessage?: WhatsAppMessage;
    waDirectLink?: string;
    waMessageText?: string;
  }> {
    const changeOwed = Math.round((params.amountReceived - params.purchaseTotal) * 100) / 100;
    const txId = `TX-${Math.floor(10000 + Math.random() * 90000)}`;
    const changeId = `CT-${Math.floor(10000 + Math.random() * 90000)}`;
    const shop = this.getShop();
    const now = new Date().toISOString();

    const qrPayload = JSON.stringify({
      id: changeId,
      amount: changeOwed,
      shop: shop.name,
      phone: params.customerPhone,
      created: now
    });

    const changeRecord: ChangeRecord = {
      id: changeId,
      transactionId: txId,
      shopId: shop.id,
      shopName: shop.name,
      cashierId: params.employee.id,
      cashierName: params.employee.name,
      customerPhone: params.customerPhone,
      customerName: params.customerName || 'Valued Customer',
      amountOwed: changeOwed,
      status: 'OUTSTANDING',
      createdAt: now,
      qrCodePayload: qrPayload,
      notes: params.notes
    };

    const transaction: Transaction = {
      id: txId,
      shopId: shop.id,
      cashierId: params.employee.id,
      cashierName: params.employee.name,
      purchaseTotal: params.purchaseTotal,
      amountReceived: params.amountReceived,
      changeCalculated: changeOwed,
      changeGivenNow: 0,
      changeOwed: changeOwed,
      hasOutstandingChange: true,
      changeRecordId: changeId,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      createdAt: now,
      notes: params.notes
    };

    // Save transaction
    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    this.save(KEYS.TRANSACTIONS, transactions);

    // Save change record
    const records = this.getChangeRecords();
    records.unshift(changeRecord);
    this.save(KEYS.CHANGE_RECORDS, records);

    // Audit logs
    this.addAuditLog({
      shopId: shop.id,
      action: 'TRANSACTION_CREATED',
      entityType: 'TRANSACTION',
      entityId: txId,
      actorId: params.employee.id,
      actorName: params.employee.name,
      actorRole: params.employee.role,
      details: `Transaction ${txId} created with outstanding change $${changeOwed.toFixed(2)}.`
    });

    this.addAuditLog({
      shopId: shop.id,
      action: 'CHANGE_RECORDED',
      entityType: 'CHANGE_RECORD',
      entityId: changeId,
      actorId: params.employee.id,
      actorName: params.employee.name,
      actorRole: params.employee.role,
      details: `Change Record ${changeId} created: $${changeOwed.toFixed(2)} owed to ${params.customerPhone} (${params.customerName || 'Customer'}).`
    });

    // Automatically sync and add to customer running balance
    const { customer, previousBalance, newBalance } = this.syncCustomerAddChange(
      params.customerPhone,
      params.customerName,
      changeOwed,
      changeId,
      txId,
      params.employee.name
    );

    // Prepare ChangeTrack WhatsApp redirect with updated cumulative balance
    const waConfig = this.getWhatsAppConfig();
    const defaultCountryCode = waConfig.defaultCountryCode || '+263';
    const waMessageText = generateRecordChangeMessage(
      shop,
      changeRecord,
      newBalance,
      previousBalance,
      waConfig.customCollectionInstructions
    );
    const waDirectLink = buildWhatsAppDirectLink(params.customerPhone, waMessageText, defaultCountryCode);

    // Create local WhatsApp redirect log
    const waMessage = createWhatsAppRedirectLog(changeRecord, shop, 'CHANGE_RECORDED', waMessageText);
    const msgs = this.getWhatsAppMessages();
    msgs.unshift(waMessage);
    this.save(KEYS.WHATSAPP_MSGS, msgs);

    this.addAuditLog({
      shopId: shop.id,
      action: 'WHATSAPP_SENT',
      entityType: 'CHANGE_RECORD',
      entityId: changeId,
      actorId: params.employee.id,
      actorName: 'WhatsApp Redirect',
      actorRole: 'SYSTEM',
      details: `WhatsApp redirect prepared for ${changeId} to ${params.customerPhone}. Total balance owed: $${newBalance.toFixed(2)}.`
    });

    return { 
      transaction, 
      changeRecord, 
      waMessage, 
      waDirectLink, 
      waMessageText 
    };
  }

  // 3. Collect change (Anti-fraud verification)
  async collectChange(params: {
    changeId: string;
    employee: Employee;
    method: 'CHANGE_ID' | 'PHONE' | 'WHATSAPP_CONFIRM' | 'QR_CODE';
  }): Promise<{
    success: boolean;
    error?: 'NOT_FOUND' | 'ALREADY_COLLECTED' | 'CANCELLED';
    record?: ChangeRecord;
    waMessage?: WhatsAppMessage;
    remainingCustomerBalance?: number;
    waDirectLink?: string;
    waMessageText?: string;
  }> {
    const records = this.getChangeRecords();
    const cleanId = params.changeId.trim().toUpperCase();
    const recordIndex = records.findIndex(r => r.id.toUpperCase() === cleanId);

    if (recordIndex === -1) {
      return { success: false, error: 'NOT_FOUND' };
    }

    const record = records[recordIndex];

    // CRITICAL FRAUD CHECK: Already collected?
    if (record.status === 'COLLECTED') {
      return {
        success: false,
        error: 'ALREADY_COLLECTED',
        record
      };
    }

    if (record.status === 'CANCELLED') {
      return {
        success: false,
        error: 'CANCELLED',
        record
      };
    }

    // Process collection
    const now = new Date().toISOString();
    const updatedRecord: ChangeRecord = {
      ...record,
      status: 'COLLECTED',
      collectedAt: now,
      collectedByEmployeeId: params.employee.id,
      collectedByEmployeeName: params.employee.name,
      collectionMethod: params.method
    };

    records[recordIndex] = updatedRecord;
    this.save(KEYS.CHANGE_RECORDS, records);

    // Update corresponding transaction hasOutstandingChange flag
    const transactions = this.getTransactions();
    const txIndex = transactions.findIndex(t => t.id === record.transactionId);
    if (txIndex !== -1) {
      transactions[txIndex].hasOutstandingChange = false;
      this.save(KEYS.TRANSACTIONS, transactions);
    }

    // Sync customer balance deduction
    const { remainingBalance } = this.syncCustomerCollectChange(
      record.customerPhone,
      record.amountOwed,
      record.id,
      record.transactionId,
      params.employee.name
    );

    // Add immutable audit log
    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'CHANGE_COLLECTED',
      entityType: 'CHANGE_RECORD',
      entityId: record.id,
      actorId: params.employee.id,
      actorName: params.employee.name,
      actorRole: params.employee.role,
      details: `Change Record ${record.id} ($${record.amountOwed.toFixed(2)}) collected by customer ${record.customerPhone}. Remaining balance: $${remainingBalance.toFixed(2)}. Verified via ${params.method} by ${params.employee.name}.`
    });

    // Prepare WhatsApp collection confirmation redirect
    const waConfig = this.getWhatsAppConfig();
    const defaultCountryCode = waConfig.defaultCountryCode || '+263';
    const waMessageText = generateCollectedChangeMessage(
      shop, 
      updatedRecord, 
      remainingBalance
    );
    const waDirectLink = buildWhatsAppDirectLink(record.customerPhone, waMessageText, defaultCountryCode);

    const waMessage = createWhatsAppRedirectLog(updatedRecord, shop, 'CHANGE_COLLECTED', waMessageText);
    const msgs = this.getWhatsAppMessages();
    msgs.unshift(waMessage);
    this.save(KEYS.WHATSAPP_MSGS, msgs);

    this.addAuditLog({
      shopId: shop.id,
      action: 'WHATSAPP_SENT',
      entityType: 'CHANGE_RECORD',
      entityId: record.id,
      actorId: params.employee.id,
      actorName: 'WhatsApp Redirect',
      actorRole: 'SYSTEM',
      details: `Collection confirmation WhatsApp redirect prepared for ${record.customerPhone} for ${record.id}. Remaining balance: $${remainingBalance.toFixed(2)}.`
    });

    return {
      success: true,
      record: updatedRecord,
      waMessage,
      remainingCustomerBalance: remainingBalance,
      waDirectLink,
      waMessageText
    };
  }

  // 3b. Settle full accumulated customer balance at once
  async collectFullCustomerBalance(params: {
    phone: string;
    employee: Employee;
    method: 'CHANGE_ID' | 'PHONE' | 'WHATSAPP_CONFIRM' | 'QR_CODE';
  }): Promise<{
    success: boolean;
    collectedRecords: ChangeRecord[];
    totalAmountCollected: number;
    waMessage?: WhatsAppMessage;
    waDirectLink?: string;
    waMessageText?: string;
    error?: string;
  }> {
    const cleanPhone = params.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      return { success: false, collectedRecords: [], totalAmountCollected: 0, error: 'INVALID_PHONE' };
    }

    const records = this.getChangeRecords();
    const outstandingForCustomer = records.filter(r => 
      r.customerPhone.replace(/[^0-9]/g, '') === cleanPhone && r.status === 'OUTSTANDING'
    );

    if (outstandingForCustomer.length === 0) {
      return { success: false, collectedRecords: [], totalAmountCollected: 0, error: 'NO_OUTSTANDING_BALANCE' };
    }

    const now = new Date().toISOString();
    let totalCollected = 0;
    const collectedIds: string[] = [];

    outstandingForCustomer.forEach(rec => {
      totalCollected += rec.amountOwed;
      collectedIds.push(rec.id);
      rec.status = 'COLLECTED';
      rec.collectedAt = now;
      rec.collectedByEmployeeId = params.employee.id;
      rec.collectedByEmployeeName = params.employee.name;
      rec.collectionMethod = params.method;
    });

    totalCollected = Math.round(totalCollected * 100) / 100;
    this.save(KEYS.CHANGE_RECORDS, records);

    // Update transactions
    const transactions = this.getTransactions();
    transactions.forEach(t => {
      if (t.changeRecordId && collectedIds.includes(t.changeRecordId)) {
        t.hasOutstandingChange = false;
      }
    });
    this.save(KEYS.TRANSACTIONS, transactions);

    // Sync Customer balance to 0.00
    this.syncCustomerCollectChange(
      params.phone,
      totalCollected,
      collectedIds.join(', '),
      'MULTI_COLLECT',
      params.employee.name
    );

    // Audit log
    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'CHANGE_COLLECTED',
      entityType: 'CHANGE_RECORD',
      entityId: collectedIds.join(', '),
      actorId: params.employee.id,
      actorName: params.employee.name,
      actorRole: params.employee.role,
      details: `Full customer balance payout: $${totalCollected.toFixed(2)} across ${collectedIds.length} change slips for ${params.phone}. Settled by ${params.employee.name}.`
    });

    // Prepare WhatsApp multi-collect confirmation redirect
    const waConfig = this.getWhatsAppConfig();
    const defaultCountryCode = waConfig.defaultCountryCode || '+263';
    const customer = this.getCustomerByPhone(params.phone);
    const waMessageText = generateMultiCollectMessage(
      shop,
      outstandingForCustomer,
      totalCollected,
      params.employee.name,
      params.phone,
      customer?.name
    );
    const waDirectLink = buildWhatsAppDirectLink(params.phone, waMessageText, defaultCountryCode);

    let waMessage: WhatsAppMessage | undefined;
    if (outstandingForCustomer[0]) {
      const dummyRecord: ChangeRecord = {
        ...outstandingForCustomer[0],
        id: collectedIds.length > 1 ? `${collectedIds[0]} (+${collectedIds.length - 1} slips)` : collectedIds[0],
        amountOwed: totalCollected,
        collectedAt: now,
        collectedByEmployeeName: params.employee.name
      };
      waMessage = createWhatsAppRedirectLog(dummyRecord, shop, 'CHANGE_COLLECTED', waMessageText);
      const msgs = this.getWhatsAppMessages();
      msgs.unshift(waMessage);
      this.save(KEYS.WHATSAPP_MSGS, msgs);
    }

    return {
      success: true,
      collectedRecords: outstandingForCustomer,
      totalAmountCollected: totalCollected,
      waMessage,
      waDirectLink,
      waMessageText
    };
  }

  // 4. Admin Only: Void / Cancel change record
  cancelChangeRecord(params: {
    changeId: string;
    adminEmployee: Employee;
    reason: string;
  }): { success: boolean; error?: string; record?: ChangeRecord } {
    if (params.adminEmployee.role !== 'ADMIN') {
      return { success: false, error: 'PERMISSION_DENIED: Only Shop Administrators can cancel or void change records.' };
    }

    const records = this.getChangeRecords();
    const cleanId = params.changeId.trim().toUpperCase();
    const recordIndex = records.findIndex(r => r.id.toUpperCase() === cleanId);

    if (recordIndex === -1) {
      return { success: false, error: 'Record not found' };
    }

    const record = records[recordIndex];
    const now = new Date().toISOString();

    const updatedRecord: ChangeRecord = {
      ...record,
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledByEmployeeId: params.adminEmployee.id,
      cancelledByEmployeeName: params.adminEmployee.name,
      cancellationReason: params.reason
    };

    records[recordIndex] = updatedRecord;
    this.save(KEYS.CHANGE_RECORDS, records);

    // Audit log
    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'CHANGE_CANCELLED',
      entityType: 'CHANGE_RECORD',
      entityId: record.id,
      actorId: params.adminEmployee.id,
      actorName: params.adminEmployee.name,
      actorRole: params.adminEmployee.role,
      details: `Change Record ${record.id} ($${record.amountOwed.toFixed(2)}) CANCELLED by Admin ${params.adminEmployee.name}. Reason: "${params.reason}".`
    });

    return { success: true, record: updatedRecord };
  }

  // 5. Admin Only: Dispute Correction / Reversal with audit trail
  reverseCollection(params: {
    changeId: string;
    adminEmployee: Employee;
    reason: string;
  }): { success: boolean; error?: string; record?: ChangeRecord } {
    if (params.adminEmployee.role !== 'ADMIN') {
      return { success: false, error: 'Only Administrators can reverse a collection record.' };
    }

    const records = this.getChangeRecords();
    const cleanId = params.changeId.trim().toUpperCase();
    const recordIndex = records.findIndex(r => r.id.toUpperCase() === cleanId);

    if (recordIndex === -1) {
      return { success: false, error: 'Record not found' };
    }

    const record = records[recordIndex];
    if (record.status !== 'COLLECTED') {
      return { success: false, error: 'Record is not currently in COLLECTED status' };
    }

    const prevCollector = record.collectedByEmployeeName;
    const prevCollectedAt = record.collectedAt;

    const updatedRecord: ChangeRecord = {
      ...record,
      status: 'OUTSTANDING',
      collectedAt: undefined,
      collectedByEmployeeId: undefined,
      collectedByEmployeeName: undefined,
      notes: `${record.notes || ''} [ADMIN REVERSAL on ${new Date().toLocaleDateString()}: ${params.reason}]`
    };

    records[recordIndex] = updatedRecord;
    this.save(KEYS.CHANGE_RECORDS, records);

    // Audit log
    const shop = this.getShop();
    this.addAuditLog({
      shopId: shop.id,
      action: 'CHANGE_REVERSED',
      entityType: 'CHANGE_RECORD',
      entityId: record.id,
      actorId: params.adminEmployee.id,
      actorName: params.adminEmployee.name,
      actorRole: params.adminEmployee.role,
      details: `ADMIN REVERSAL of Change Record ${record.id}: Reverted from COLLECTED (originally collected by ${prevCollector} at ${prevCollectedAt}) to OUTSTANDING. Reason: ${params.reason}`
    });

    return { success: true, record: updatedRecord };
  }

  // --- Statistics Calculation ---
  getDashboardStats(): DashboardStats {
    const transactions = this.getTransactions();
    const records = this.getChangeRecords();
    const disputes = this.getDisputes();

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's transactions
    const todayTxs = transactions.filter(t => t.createdAt.startsWith(todayStr));
    const todaySales = todayTxs.reduce((sum, t) => sum + t.purchaseTotal, 0);

    // Outstanding change
    const outstandingRecords = records.filter(r => r.status === 'OUTSTANDING');
    const totalOutstandingChange = outstandingRecords.reduce((sum, r) => sum + r.amountOwed, 0);

    // Collected today
    const collectedTodayRecords = records.filter(r => 
      r.status === 'COLLECTED' && r.collectedAt && r.collectedAt.startsWith(todayStr)
    );
    const todayChangeCollected = collectedTodayRecords.reduce((sum, r) => sum + r.amountOwed, 0);

    // Active disputes
    const activeDisputes = disputes.filter(d => d.status === 'OPEN' || d.status === 'INVESTIGATING');

    // All time
    const totalChangeRecordedAllTime = records.reduce((sum, r) => sum + r.amountOwed, 0);
    const totalChangeCollectedAllTime = records
      .filter(r => r.status === 'COLLECTED')
      .reduce((sum, r) => sum + r.amountOwed, 0);

    return {
      todaySales,
      todayTransactionsCount: todayTxs.length,
      totalOutstandingChange,
      totalOutstandingRecordsCount: outstandingRecords.length,
      todayChangeCollected,
      todayChangeCollectedCount: collectedTodayRecords.length,
      activeDisputesCount: activeDisputes.length,
      totalChangeRecordedAllTime,
      totalChangeCollectedAllTime
    };
  }

  // Reset to factory demo data if needed
  resetToDemoData(): void {
    localStorage.removeItem(KEYS.SHOP);
    localStorage.removeItem(KEYS.EMPLOYEES);
    localStorage.removeItem(KEYS.TRANSACTIONS);
    localStorage.removeItem(KEYS.CHANGE_RECORDS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.WHATSAPP_MSGS);
    localStorage.removeItem(KEYS.DISPUTES);
    localStorage.removeItem(KEYS.WHATSAPP_CONFIG);
    localStorage.removeItem(KEYS.CUSTOMERS);
    localStorage.removeItem(KEYS.CUSTOMER_LEDGER);
  }
}

export const storage = new StorageService();
