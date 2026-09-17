export type UserRole = 'ADMIN' | 'CASHIER' | 'CUSTOMER';

export type ChangeStatus = 'OUTSTANDING' | 'COLLECTED' | 'CANCELLED';

export type DisputeStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';

export interface Shop {
  id: string;
  name: string;
  branchName?: string;
  ownerName?: string;
  logoUrl?: string;
  phone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  whatsappNotice: string;
  ownerPasscode?: string;
  isPasscodeRequired?: boolean;
}

export interface Employee {
  id: string;
  shopId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CASHIER';
  pin: string; // 4-digit till access PIN
  active: boolean;
  avatarColor: string;
}

export interface Customer {
  id: string;
  shopId: string;
  phone: string;
  name?: string;
  totalBalanceOwed: number; // Cumulative running balance currently owed to customer
  totalAmountOwed?: number; // Backward compatibility alias
  totalCollectedLifetime: number;
  totalAmountCollected?: number; // Backward compatibility alias
  totalRecordsCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerBalanceLedgerEntry {
  id: string;
  shopId: string;
  customerId: string;
  customerPhone: string;
  changeRecordId?: string;
  transactionId?: string;
  previousBalance: number;
  amountChange: number; // positive for newly added change, negative for collected change
  newBalance: number;
  type: 'CHANGE_ADDED' | 'CHANGE_COLLECTED' | 'CHANGE_CANCELLED' | 'MANUAL_ADJUSTMENT';
  timestamp: string;
  actorName: string;
  notes?: string;
}

export interface Transaction {
  id: string; // e.g. TX-10293
  shopId: string;
  cashierId: string;
  cashierName: string;
  purchaseTotal: number;
  amountReceived: number;
  changeCalculated: number;
  changeGivenNow: number;
  changeOwed: number; // recorded as outstanding
  hasOutstandingChange: boolean;
  changeRecordId?: string;
  customerPhone?: string;
  customerName?: string;
  createdAt: string;
  notes?: string;
}

export interface ChangeRecord {
  id: string; // e.g. CT-48291
  transactionId: string;
  shopId: string;
  shopName: string;
  cashierId: string;
  cashierName: string;
  customerPhone: string;
  customerName?: string;
  amountOwed: number;
  status: ChangeStatus;
  createdAt: string; // ISO string
  qrCodePayload: string; // string or verification token
  notes?: string;
  
  // Populated when collected
  collectedAt?: string;
  collectedByEmployeeId?: string;
  collectedByEmployeeName?: string;
  collectionMethod?: 'CHANGE_ID' | 'PHONE' | 'WHATSAPP_CONFIRM' | 'QR_CODE';

  // Populated if cancelled / voided by Admin
  cancelledAt?: string;
  cancelledByEmployeeId?: string;
  cancelledByEmployeeName?: string;
  cancellationReason?: string;
}

export interface AuditLog {
  id: string;
  shopId: string;
  timestamp: string;
  action: 'TRANSACTION_CREATED' | 'CHANGE_RECORDED' | 'CHANGE_COLLECTED' | 'CHANGE_CANCELLED' | 'CHANGE_REVERSED' | 'DISPUTE_OPENED' | 'DISPUTE_RESOLVED' | 'WHATSAPP_SENT' | 'SETTINGS_UPDATED' | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_DELETED';
  entityType: 'TRANSACTION' | 'CHANGE_RECORD' | 'DISPUTE' | 'SETTINGS' | 'EMPLOYEE';
  entityId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppMessage {
  id: string;
  changeId: string;
  customerPhone: string;
  type: 'CHANGE_RECORDED' | 'CHANGE_COLLECTED';
  shopName: string;
  amount: number;
  previousBalance?: number;
  cumulativeTotalBalanceOwed?: number;
  messageText: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED' | 'PENDING';
  sentAt: string;
  deliveredAt?: string;
  metaMessageId?: string;
}

export interface Dispute {
  id: string;
  shopId: string;
  transactionId: string;
  changeId?: string;
  customerPhone: string;
  customerName?: string;
  claimedAmount: number;
  actualAmountRecorded?: number;
  description: string;
  status: DisputeStatus;
  openedAt: string;
  openedByEmployeeId: string;
  openedByEmployeeName: string;
  resolvedAt?: string;
  resolvedByEmployeeId?: string;
  resolvedByEmployeeName?: string;
  resolutionNotes?: string;
}

export interface WhatsAppConfig {
  isEnabled: boolean;
  defaultCountryCode: string;
  autoOpenRedirectOnRecord: boolean;
  autoOpenRedirectOnCollect: boolean;
  customCollectionInstructions?: string;
  // Legacy optional fields for data backward compatibility
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  businessSenderNumber?: string;
  autoSendOnCreate?: boolean;
  autoSendOnCollect?: boolean;
  fallbackSmsEnabled?: boolean;
}

export interface DashboardStats {
  todaySales: number;
  todayTransactionsCount: number;
  totalOutstandingChange: number;
  totalOutstandingRecordsCount: number;
  todayChangeCollected: number;
  todayChangeCollectedCount: number;
  activeDisputesCount: number;
  totalChangeRecordedAllTime: number;
  totalChangeCollectedAllTime: number;
}
