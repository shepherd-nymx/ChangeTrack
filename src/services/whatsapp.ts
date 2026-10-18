import { WhatsAppConfig, WhatsAppMessage, ChangeRecord, Shop, Transaction } from '../types';

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a phone number for the WhatsApp universal wa.me link.
 * Strips all non-digit characters. If number starts with 0 (local prefix),
 * strips the 0 and attaches the default country code digits.
 */
export function formatPhoneForWhatsApp(phone: string, defaultCountryCode = '+263'): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (!clean) return '';

  const countryDigits = defaultCountryCode.replace(/[^0-9]/g, '');

  if (clean.startsWith('0')) {
    clean = countryDigits + clean.substring(1);
  } else if (!clean.startsWith(countryDigits) && clean.length <= 10) {
    clean = countryDigits + clean;
  }

  return clean;
}

/**
 * Builds the direct WhatsApp redirect link: https://wa.me/<number>?text=<prefilled_message>
 * Requires NO Meta API, tokens, webhooks, or third-party services.
 */
export function buildWhatsAppDirectLink(phone: string, text: string, defaultCountryCode = '+263'): string {
  const cleanPhone = formatPhoneForWhatsApp(phone, defaultCountryCode);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Safely attempts to open WhatsApp in a new tab/window directly.
 * Returns the window instance or null if blocked.
 */
export function openWhatsAppDirect(phone: string, text: string, defaultCountryCode = '+263'): Window | null {
  const link = buildWhatsAppDirectLink(phone, text, defaultCountryCode);
  try {
    return window.open(link, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.warn('Could not open WhatsApp window directly:', err);
    return null;
  }
}

/**
 * Builds the direct customer link to access ONLY their digital QR code voucher.
 * This link allows the customer to open their QR code on any smartphone screen
 * so the till cashier can scan it and mark change collected.
 */
export function buildCustomerVoucherUrl(
  record: ChangeRecord,
  shop: Shop,
  customBaseUrl?: string
): string {
  let baseUrl = '';
  if (customBaseUrl && customBaseUrl.trim()) {
    baseUrl = customBaseUrl.trim().replace(/\/+$/, '');
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    baseUrl = window.location.origin;
  }

  const params = new URLSearchParams();
  params.set('pass', record.id);
  params.set('amt', record.amountOwed.toFixed(2));
  params.set('cur', shop.currencySymbol || '$');
  params.set('shop', shop.name);

  return baseUrl ? `${baseUrl}/?${params.toString()}` : `/?${params.toString()}`;
}

/**
 * Generates the WhatsApp pre-filled message when change is recorded.
 * Contains:
 * - Shop name
 * - Change amount
 * - Unique Change ID
 * - Link to customer-only QR code pass for till scanning
 * - Date/time
 * - Collection instructions
 * - (Optional running balance if customer has prior balance)
 */
export function generateRecordChangeMessage(
  shop: Shop,
  record: ChangeRecord,
  cumulativeTotalBalanceOwed?: number,
  previousBalance?: number,
  customInstructions?: string,
  customCustomerAppUrl?: string
): string {
  const formattedDate = formatDateTime(record.createdAt);
  const currency = shop.currencySymbol || '$';
  const customerName = record.customerName && record.customerName !== 'Valued Customer'
    ? record.customerName
    : 'Valued Customer';

  const customerPassUrl = buildCustomerVoucherUrl(record, shop, customCustomerAppUrl);

  let balanceSection = '';
  if (cumulativeTotalBalanceOwed !== undefined && cumulativeTotalBalanceOwed > 0) {
    balanceSection = `\n\n💰 *Total Balance Owed to You: ${currency}${cumulativeTotalBalanceOwed.toFixed(2)}*`;
    if (previousBalance && previousBalance > 0) {
      balanceSection += `\n_(Previous balance ${currency}${previousBalance.toFixed(2)} + New change ${currency}${record.amountOwed.toFixed(2)})_`;
    }
  }

  let changeDetailsSection = `💵 *Change Amount Due:* *${currency}${record.amountOwed.toFixed(2)}*`;

  if (record.isPartialChange && record.partialCashGivenNow !== undefined && record.totalChangeCalculated !== undefined) {
    changeDetailsSection = `💵 *Total Change Due:* *${currency}${record.totalChangeCalculated.toFixed(2)}*
💵 *Cash Handed to You Now:* *${currency}${record.partialCashGivenNow.toFixed(2)}*
🔖 *Remaining Change Owed:* *${currency}${record.amountOwed.toFixed(2)}*`;
  } else if (record.isDirectRegistration) {
    changeDetailsSection = `💵 *Direct Change Registered:* *${currency}${record.amountOwed.toFixed(2)}*`;
  }

  const instructions = customInstructions?.trim() ||
`• Tap your QR Pass link above on your phone to display your QR code for the till operator.
• Or present this Change ID (*${record.id}*) at any till checkout.
• Our cashier will scan your QR code and immediately hand over your cash change.
• Keep this WhatsApp confirmation for your records.`;

  const noteLine = record.notes ? `\n📝 *Notes:* ${record.notes}` : '';

  return `*${shop.name.toUpperCase()}*
*DIGITAL CHANGE RECEIPT*

Hello ${customerName},
Your change has been recorded securely.

${changeDetailsSection}
🔖 *Change ID:* *${record.id}*
📅 *Date & Time:* ${formattedDate}
🏬 *Store:* ${shop.name}${shop.branchName ? ` (${shop.branchName})` : ''}
📌 *Status:* Outstanding${balanceSection}${noteLine}

📱 *YOUR DIGITAL CHANGE QR CODE PASS:*
${customerPassUrl}
_(Tap the link above on your phone to show your QR code to the cashier at the till)_

*Collection Instructions:*
${instructions}

Thank you for shopping with ${shop.name}!`;
}

/**
 * Generates the WhatsApp pre-filled collection confirmation message.
 */
export function generateCollectedChangeMessage(
  shop: Shop,
  record: ChangeRecord,
  remainingBalanceOwed?: number,
  customNote?: string,
  customCustomerAppUrl?: string
): string {
  const formattedDate = formatDateTime(record.collectedAt || new Date().toISOString());
  const currency = shop.currencySymbol || '$';
  const customerName = record.customerName && record.customerName !== 'Valued Customer'
    ? record.customerName
    : 'Valued Customer';

  const customerPassUrl = buildCustomerVoucherUrl(record, shop, customCustomerAppUrl);

  let balanceSection = '';
  if (remainingBalanceOwed !== undefined) {
    if (remainingBalanceOwed > 0) {
      balanceSection = `\n\n💰 *Remaining Balance Owed: ${currency}${remainingBalanceOwed.toFixed(2)}*`;
    } else {
      balanceSection = `\n\n✅ *All Your Change Has Been Fully Settled!*
Remaining Balance: *${currency}0.00*`;
    }
  }

  const note = customNote?.trim() ? `\n\n_${customNote}_` : '';

  return `*${shop.name.toUpperCase()}*
*CHANGE COLLECTION CONFIRMATION*

Hello ${customerName},
Your change has been successfully collected and paid out in cash.

💵 *Amount Collected:* *${currency}${record.amountOwed.toFixed(2)}*
🔖 *Change ID:* *${record.id}*
📅 *Collection Date & Time:* ${formattedDate}
👤 *Cashier:* ${record.collectedByEmployeeName || 'Till Cashier'}
✅ *Status:* COLLECTED / PAID OUT${balanceSection}${note}

📱 *Digital Pass Receipt:*
${customerPassUrl}

*Collection Summary:*
• This Change ID (*${record.id}*) is now closed and marked collected in our ChangeTrack system.
• Cash handed over at ${shop.name}.

Thank you for shopping with ${shop.name}!`;
}

/**
 * Generates the WhatsApp pre-filled message when multiple change slips or full balance is collected.
 */
export function generateMultiCollectMessage(
  shop: Shop,
  records: ChangeRecord[],
  totalAmount: number,
  cashierName: string,
  customerPhone: string,
  customerName?: string
): string {
  const formattedDate = formatDateTime(new Date().toISOString());
  const currency = shop.currencySymbol || '$';
  const name = customerName && customerName !== 'Valued Customer' ? customerName : 'Valued Customer';
  const idsList = records.map(r => `• *${r.id}*: ${currency}${r.amountOwed.toFixed(2)}`).join('\n');

  return `*${shop.name.toUpperCase()}*
*FULL BALANCE PAYOUT CONFIRMATION*

Hello ${name},
Your cumulative outstanding change balance has been fully settled in cash.

💵 *Total Payout Amount:* *${currency}${totalAmount.toFixed(2)}*
📅 *Settled Date & Time:* ${formattedDate}
👤 *Cashier:* ${cashierName}
✅ *Status:* ALL CHANGE FULLY PAID (Remaining: *${currency}0.00*)

*Settled Change Slips (${records.length}):*
${idsList}

All listed change records are now closed in our ChangeTrack system.

Thank you for shopping with ${shop.name}!`;
}

/**
 * Generates the WhatsApp pre-filled message for an instant full-cash handover.
 * Used when the cashier dispenses the full change at the till ("Give Change Now").
 */
export function generateInstantCashMessage(
  shop: Shop,
  transaction: Transaction,
  cashierName: string
): string {
  const formattedDate = formatDateTime(transaction.createdAt);
  const currency = shop.currencySymbol || '$';
  const customerName = transaction.customerName && transaction.customerName !== 'Valued Customer'
    ? transaction.customerName
    : 'Valued Customer';

  return `*${shop.name.toUpperCase()}*
*CHANGE PAID IN FULL — CONFIRMATION*

Hello ${customerName},
Your change was handed to you in cash, in full, at the till.

💵 *Change Paid in Cash:* *${currency}${transaction.changeCalculated.toFixed(2)}*
🧾 *Transaction ID:* *${transaction.id}*
🛒 *Purchase Total:* ${currency}${transaction.purchaseTotal.toFixed(2)}
💵 *Cash Tendered:* ${currency}${transaction.amountReceived.toFixed(2)}
📅 *Date & Time:* ${formattedDate}
🏬 *Store:* ${shop.name}${shop.branchName ? ` (${shop.branchName})` : ''}
👤 *Cashier:* ${cashierName}
✅ *Status:* FULLY PAID — Nothing further owed

This transaction is now closed in our ChangeTrack system. No change is owed to you.

Thank you for shopping with ${shop.name}!`;
}

/**
 * Creates a local audit log record of the WhatsApp redirect prepared for the customer.
 * NO external API or third-party call is made.
 */
export function createWhatsAppRedirectLog(
  record: ChangeRecord,
  shop: Shop,
  type: 'CHANGE_RECORDED' | 'CHANGE_COLLECTED',
  messageText: string
): WhatsAppMessage {
  const messageId = `wa-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  return {
    id: messageId,
    changeId: record.id,
    customerPhone: record.customerPhone,
    type,
    shopName: shop.name,
    amount: record.amountOwed,
    messageText,
    status: 'SENT',
    sentAt: now,
    deliveredAt: now,
    metaMessageId: `redirect_${Date.now()}`
  };
}

/**
 * Backward-compatible wrapper that generates message and records redirect log.
 */
export async function sendWhatsAppNotification(
  config: WhatsAppConfig,
  shop: Shop,
  record: ChangeRecord,
  type: 'CHANGE_RECORDED' | 'CHANGE_COLLECTED',
  cumulativeTotalBalanceOwed?: number,
  previousBalance?: number
): Promise<WhatsAppMessage> {
  const text = type === 'CHANGE_RECORDED'
    ? generateRecordChangeMessage(shop, record, cumulativeTotalBalanceOwed, previousBalance, config.customCollectionInstructions, config.customCustomerAppUrl)
    : generateCollectedChangeMessage(shop, record, cumulativeTotalBalanceOwed, undefined, config.customCustomerAppUrl);

  return createWhatsAppRedirectLog(record, shop, type, text);
}
