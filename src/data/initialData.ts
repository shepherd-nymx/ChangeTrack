import { Shop, Employee, ChangeRecord, Transaction, AuditLog, WhatsAppMessage, Dispute, WhatsAppConfig, Customer, CustomerBalanceLedgerEntry } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    shopId: 'shop-abc-001',
    phone: '+263771234567',
    name: 'John Ndlovu',
    totalBalanceOwed: 2.50,
    totalCollectedLifetime: 0.00,
    totalRecordsCount: 1,
    lastActivityAt: '2026-09-16T12:30:00.000Z',
    createdAt: '2026-09-10T08:00:00.000Z'
  },
  {
    id: 'cust-002',
    shopId: 'shop-abc-001',
    phone: '+263719876543',
    name: 'Grace Mutasa',
    totalBalanceOwed: 0.00,
    totalCollectedLifetime: 1.20,
    totalRecordsCount: 1,
    lastActivityAt: '2026-09-16T15:15:00.000Z',
    createdAt: '2026-09-12T09:00:00.000Z'
  },
  {
    id: 'cust-003',
    shopId: 'shop-abc-001',
    phone: '+263785551212',
    name: 'Kelvin Sibanda',
    totalBalanceOwed: 5.00,
    totalCollectedLifetime: 0.00,
    totalRecordsCount: 1,
    lastActivityAt: '2026-09-16T11:15:00.000Z',
    createdAt: '2026-09-14T10:00:00.000Z'
  }
];

export const INITIAL_CUSTOMER_LEDGER: CustomerBalanceLedgerEntry[] = [
  {
    id: 'cble-001',
    shopId: 'shop-abc-001',
    customerId: 'cust-001',
    customerPhone: '+263771234567',
    changeRecordId: 'CT-48291',
    transactionId: 'TX-10293',
    previousBalance: 0.00,
    amountChange: 2.50,
    newBalance: 2.50,
    type: 'CHANGE_ADDED',
    timestamp: '2026-09-16T12:30:00.000Z',
    actorName: 'John Phiri',
    notes: 'Change slip created'
  },
  {
    id: 'cble-002',
    shopId: 'shop-abc-001',
    customerId: 'cust-002',
    customerPhone: '+263719876543',
    changeRecordId: 'CT-39104',
    transactionId: 'TX-10288',
    previousBalance: 0.00,
    amountChange: 1.20,
    newBalance: 1.20,
    type: 'CHANGE_ADDED',
    timestamp: '2026-09-16T09:45:00.000Z',
    actorName: 'Sarah Choto',
    notes: 'Change slip created'
  },
  {
    id: 'cble-003',
    shopId: 'shop-abc-001',
    customerId: 'cust-002',
    customerPhone: '+263719876543',
    changeRecordId: 'CT-39104',
    transactionId: 'TX-10288',
    previousBalance: 1.20,
    amountChange: -1.20,
    newBalance: 0.00,
    type: 'CHANGE_COLLECTED',
    timestamp: '2026-09-16T15:15:00.000Z',
    actorName: 'John Phiri',
    notes: 'Change collected at till via Change ID'
  },
  {
    id: 'cble-004',
    shopId: 'shop-abc-001',
    customerId: 'cust-003',
    customerPhone: '+263785551212',
    changeRecordId: 'CT-51820',
    transactionId: 'TX-10285',
    previousBalance: 0.00,
    amountChange: 5.00,
    newBalance: 5.00,
    type: 'CHANGE_ADDED',
    timestamp: '2026-09-16T11:15:00.000Z',
    actorName: 'John Phiri',
    notes: 'Change slip created'
  }
];

export const INITIAL_SHOP: Shop = {
  id: 'shop-abc-001',
  name: 'ABC Tuckshop & Supermarket',
  branchName: 'Main Terminal Till #1',
  ownerName: 'Tariro Moyo',
  logoUrl: '',
  phone: '+263 77 200 1122',
  address: '42 Market Way, Central Avenue',
  currency: 'USD',
  currencySymbol: '$',
  whatsappNotice: 'Please present your Change ID or WhatsApp confirmation message to collect change within 30 days.',
  ownerPasscode: '1234',
  isPasscodeRequired: true
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-admin-1',
    shopId: 'shop-abc-001',
    name: 'Tariro Moyo',
    email: 'tariro@abctuckshop.com',
    role: 'ADMIN',
    pin: '1234',
    active: true,
    avatarColor: 'bg-ink-700'
  },
  {
    id: 'emp-cashier-2',
    shopId: 'shop-abc-001',
    name: 'John Phiri',
    email: 'john@abctuckshop.com',
    role: 'CASHIER',
    pin: '2222',
    active: true,
    avatarColor: 'bg-brand-600'
  },
  {
    id: 'emp-cashier-3',
    shopId: 'shop-abc-001',
    name: 'Sarah Choto',
    email: 'sarah@abctuckshop.com',
    role: 'CASHIER',
    pin: '3333',
    active: true,
    avatarColor: 'bg-amber-600'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-10293',
    shopId: 'shop-abc-001',
    cashierId: 'emp-cashier-2',
    cashierName: 'John Phiri',
    purchaseTotal: 17.50,
    amountReceived: 20.00,
    changeCalculated: 2.50,
    changeGivenNow: 0,
    changeOwed: 2.50,
    hasOutstandingChange: true,
    changeRecordId: 'CT-48291',
    customerPhone: '+263771234567',
    customerName: 'John Ndlovu',
    createdAt: '2026-09-16T12:30:00.000Z',
    notes: '2x Bread ($2.00), 1x Cooking Oil 2L ($6.50), Sugar 2kg ($4.00), Drinks ($5.00)'
  },
  {
    id: 'TX-10288',
    shopId: 'shop-abc-001',
    cashierId: 'emp-cashier-3',
    cashierName: 'Sarah Choto',
    purchaseTotal: 8.80,
    amountReceived: 10.00,
    changeCalculated: 1.20,
    changeGivenNow: 0,
    changeOwed: 1.20,
    hasOutstandingChange: false, // was collected
    changeRecordId: 'CT-39104',
    customerPhone: '+263719876543',
    customerName: 'Grace Mutasa',
    createdAt: '2026-09-16T09:45:00.000Z',
    notes: 'Milk ($1.80), Eggs 1 Dozen ($4.50), Biscuits ($2.50)'
  },
  {
    id: 'TX-10285',
    shopId: 'shop-abc-001',
    cashierId: 'emp-cashier-2',
    cashierName: 'John Phiri',
    purchaseTotal: 15.00,
    amountReceived: 20.00,
    changeCalculated: 5.00,
    changeGivenNow: 0,
    changeOwed: 5.00,
    hasOutstandingChange: true,
    changeRecordId: 'CT-51820',
    customerPhone: '+263785551212',
    customerName: 'Kelvin Sibanda',
    createdAt: '2026-09-16T11:15:00.000Z',
    notes: 'Rice 5kg ($11.00), Flour 2kg ($4.00)'
  },
  {
    id: 'TX-10280',
    shopId: 'shop-abc-001',
    cashierId: 'emp-admin-1',
    cashierName: 'Tariro Moyo',
    purchaseTotal: 19.20,
    amountReceived: 20.00,
    changeCalculated: 0.80,
    changeGivenNow: 0.80,
    changeOwed: 0,
    hasOutstandingChange: false,
    customerPhone: '+263734448899',
    customerName: 'Anesu Banda',
    createdAt: '2026-09-15T16:20:00.000Z',
    notes: 'Change given immediately in coins'
  }
];

export const INITIAL_CHANGE_RECORDS: ChangeRecord[] = [
  {
    id: 'CT-48291',
    transactionId: 'TX-10293',
    shopId: 'shop-abc-001',
    shopName: 'ABC Tuckshop',
    cashierId: 'emp-cashier-2',
    cashierName: 'John Phiri',
    customerPhone: '+263771234567',
    customerName: 'John Ndlovu',
    amountOwed: 2.50,
    status: 'OUTSTANDING',
    createdAt: '2026-09-16T12:30:00.000Z',
    qrCodePayload: JSON.stringify({ id: 'CT-48291', amount: 2.50, shop: 'ABC Tuckshop', phone: '+263771234567' }),
    notes: 'Coin shortage in till at lunch rush.'
  },
  {
    id: 'CT-39104',
    transactionId: 'TX-10288',
    shopId: 'shop-abc-001',
    shopName: 'ABC Tuckshop',
    cashierId: 'emp-cashier-3',
    cashierName: 'Sarah Choto',
    customerPhone: '+263719876543',
    customerName: 'Grace Mutasa',
    amountOwed: 1.20,
    status: 'COLLECTED',
    createdAt: '2026-09-16T09:45:00.000Z',
    qrCodePayload: JSON.stringify({ id: 'CT-39104', amount: 1.20, shop: 'ABC Tuckshop', phone: '+263719876543' }),
    collectedAt: '2026-09-16T15:15:00.000Z',
    collectedByEmployeeId: 'emp-cashier-2',
    collectedByEmployeeName: 'John Phiri',
    collectionMethod: 'QR_CODE',
    notes: 'Collected in the afternoon with QR code scan.'
  },
  {
    id: 'CT-51820',
    transactionId: 'TX-10285',
    shopId: 'shop-abc-001',
    shopName: 'ABC Tuckshop',
    cashierId: 'emp-cashier-2',
    cashierName: 'John Phiri',
    customerPhone: '+263785551212',
    customerName: 'Kelvin Sibanda',
    amountOwed: 5.00,
    status: 'OUTSTANDING',
    createdAt: '2026-09-16T11:15:00.000Z',
    qrCodePayload: JSON.stringify({ id: 'CT-51820', amount: 5.00, shop: 'ABC Tuckshop', phone: '+263785551212' }),
    notes: 'No $5 bill available.'
  },
  {
    id: 'CT-22019',
    transactionId: 'TX-10280',
    shopId: 'shop-abc-001',
    shopName: 'ABC Tuckshop',
    cashierId: 'emp-cashier-3',
    cashierName: 'Sarah Choto',
    customerPhone: '+263734448899',
    customerName: 'Anesu Banda',
    amountOwed: 0.80,
    status: 'CANCELLED',
    createdAt: '2026-09-15T16:10:00.000Z',
    qrCodePayload: JSON.stringify({ id: 'CT-22019', amount: 0.80, shop: 'ABC Tuckshop', phone: '+263734448899' }),
    cancelledAt: '2026-09-15T16:15:00.000Z',
    cancelledByEmployeeId: 'emp-admin-1',
    cancelledByEmployeeName: 'Tariro Moyo',
    cancellationReason: 'Cashier found exact 80c change in auxiliary drawer right after customer stepped aside. Handed over in person.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    shopId: 'shop-abc-001',
    timestamp: '2026-09-16T12:30:00.000Z',
    action: 'TRANSACTION_CREATED',
    entityType: 'TRANSACTION',
    entityId: 'TX-10293',
    actorId: 'emp-cashier-2',
    actorName: 'John Phiri',
    actorRole: 'CASHIER',
    details: 'Transaction TX-10293 created: Total $17.50, Received $20.00, Change $2.50.'
  },
  {
    id: 'audit-002',
    shopId: 'shop-abc-001',
    timestamp: '2026-09-16T12:30:05.000Z',
    action: 'CHANGE_RECORDED',
    entityType: 'CHANGE_RECORD',
    entityId: 'CT-48291',
    actorId: 'emp-cashier-2',
    actorName: 'John Phiri',
    actorRole: 'CASHIER',
    details: 'Outstanding Change Record CT-48291 generated for $2.50 to +263771234567 (John Ndlovu).'
  },
  {
    id: 'audit-003',
    shopId: 'shop-abc-001',
    timestamp: '2026-09-16T12:30:08.000Z',
    action: 'WHATSAPP_SENT',
    entityType: 'CHANGE_RECORD',
    entityId: 'CT-48291',
    actorId: 'emp-cashier-2',
    actorName: 'System / WhatsApp API',
    actorRole: 'SYSTEM',
    details: 'WhatsApp notification dispatched to +263771234567: "Your change has been recorded. Amount: $2.50, Change ID: CT-48291"'
  },
  {
    id: 'audit-004',
    shopId: 'shop-abc-001',
    timestamp: '2026-09-16T15:15:00.000Z',
    action: 'CHANGE_COLLECTED',
    entityType: 'CHANGE_RECORD',
    entityId: 'CT-39104',
    actorId: 'emp-cashier-2',
    actorName: 'John Phiri',
    actorRole: 'CASHIER',
    details: 'Change Record CT-39104 ($1.20) verified via QR_CODE and marked COLLECTED for Grace Mutasa.'
  },
  {
    id: 'audit-005',
    shopId: 'shop-abc-001',
    timestamp: '2026-09-16T15:15:05.000Z',
    action: 'WHATSAPP_SENT',
    entityType: 'CHANGE_RECORD',
    entityId: 'CT-39104',
    actorId: 'emp-cashier-2',
    actorName: 'System / WhatsApp API',
    actorRole: 'SYSTEM',
    details: 'Collection confirmation WhatsApp sent to +263719876543: "Your change of $1.20 has been successfully collected. Change ID: CT-39104"'
  }
];

export const INITIAL_WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  {
    id: 'wa-msg-1',
    changeId: 'CT-48291',
    customerPhone: '+263771234567',
    type: 'CHANGE_RECORDED',
    shopName: 'ABC Tuckshop',
    amount: 2.50,
    messageText: `*ABC Tuckshop*\n\nYour change has been recorded.\n\nAmount: *$2.50*\nChange ID: *CT-48291*\nDate: 16 September 2026, 12:30 PM\nStatus: *OUTSTANDING*\n\nPlease present your Change ID or this WhatsApp message when collecting your change.\n\nThank you for shopping with us.`,
    status: 'DELIVERED',
    sentAt: '2026-09-16T12:30:08.000Z',
    deliveredAt: '2026-09-16T12:30:12.000Z',
    metaMessageId: 'wamid.HBgLMjYzNzcxMjM0NTY3FQIAERgSRTIxOTM5REI1ODAzQTcwMTQA'
  },
  {
    id: 'wa-msg-2',
    changeId: 'CT-39104',
    customerPhone: '+263719876543',
    type: 'CHANGE_COLLECTED',
    shopName: 'ABC Tuckshop',
    amount: 1.20,
    messageText: `*ABC Tuckshop*\n\nYour change of *$1.20* has been successfully collected.\n\nChange ID: *CT-39104*\nCollected: 16 September 2026, 3:15 PM\nCashier: John Phiri\nStatus: *COLLECTED*\n\nThank you for your business.`,
    status: 'DELIVERED',
    sentAt: '2026-09-16T15:15:05.000Z',
    deliveredAt: '2026-09-16T15:15:08.000Z',
    metaMessageId: 'wamid.HBgLMjYzNzE5ODc2NTQzFQIAERgSRjQ1OTA5REI1ODAzQTcwMTQA'
  }
];

export const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'disp-001',
    shopId: 'shop-abc-001',
    transactionId: 'TX-10293',
    changeId: 'CT-48291',
    customerPhone: '+263771234567',
    customerName: 'John Ndlovu',
    claimedAmount: 2.50,
    actualAmountRecorded: 2.50,
    description: 'Customer inquired whether their change was already cleared. Cashier checked system: Record CT-48291 is confirmed OUTSTANDING and ready for collection.',
    status: 'INVESTIGATING',
    openedAt: '2026-09-16T14:10:00.000Z',
    openedByEmployeeId: 'emp-cashier-3',
    openedByEmployeeName: 'Sarah Choto'
  }
];

export const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  isEnabled: true,
  defaultCountryCode: '+263',
  autoOpenRedirectOnRecord: true,
  autoOpenRedirectOnCollect: true,
  customCollectionInstructions: 'Present your Change ID or show this WhatsApp message at any till checkout. Valid for 30 days at all shop branches.',
  phoneNumberId: '',
  wabaId: '',
  accessToken: '',
  businessSenderNumber: '',
  autoSendOnCreate: true,
  autoSendOnCollect: true,
  fallbackSmsEnabled: false
};
