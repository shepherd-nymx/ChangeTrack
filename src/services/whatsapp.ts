import { WhatsAppConfig, WhatsAppMessage, ChangeRecord, Shop } from '../types';

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
 * Generates the WhatsApp pre-filled message when change is recorded.
 * Contains:
 * - Shop name
 * - Change amount
 * - Unique Change ID
 * - Date/time
 * - Collection instructions
 * - (Optional running balance if customer has prior balance)
 */
export function generateRecordChangeMessage(
  shop: Shop, 
  record: ChangeRecord, 
  cumulativeTotalBalanceOwed?: number,
  previousBalance?: number,
  customInstructions?: string
): string {
  const formattedDate = formatDateTime(record.createdAt);
  const currency = shop.currencySymbol || '$';
  const customerName = record.customerName && record.customerName !== 'Valued Customer'
    ? record.customerName
    : 'Valued Customer';

  let balanceSection = '';
  if (cumulativeTotalBalanceOwed !== undefined && cumulativeTotalBalanceOwed > 0) {
    balanceSection = `\n\n💰 *Total Balance Owed to You: ${currency}${cumulativeTotalBalanceOwed.toFixed(2)}*`;
    if (previousBalance && previousBalance > 0) {
      balanceSection += `\n_(Previous balance ${currency}${previousBalance.toFixed(2)} + New change ${currency}${record.amountOwed.toFixed(2)})_`;
    }
  }

  const instructions = customInstructions?.trim() || 
`• Present this Change ID (*${record.id}*) or show this WhatsApp message at any till checkout.
• Our cashier will verify your Change ID and hand over your cash change on your next visit.
• Keep this WhatsApp confirmation for your records.`;

  return `*${shop.name.toUpperCase()}*
*DIGITAL CHANGE RECEIPT*

Hello ${customerName},
Your change has been recorded securely.

💵 *Change Amount Due:* *${currency}${record.amountOwed.toFixed(2)}*
🔖 *Change ID:* *${record.id}*
📅 *Date & Time:* ${formattedDate}
🏬 *Store:* ${shop.name}${shop.branchName ? ` (${shop.branchName})` : ''}
📌 *Status:* Outstanding${balanceSection}

*Collection Instructions:*
${instructions}

Thank you for shopping with ${shop.name}!`;
}

/**
 * Generates the WhatsApp pre-filled collection confirmation message.
 * Contains:
 * - Shop name
 * - Change amount collected
 * - Unique Change ID
 * - Date/time
 * - Cashier name
 * - Status: COLLECTED
 * - Collection confirmation / instructions
 */
export function generateCollectedChangeMessage(
  shop: Shop, 
  record: ChangeRecord,
  remainingBalanceOwed?: number,
  customNote?: string
): string {
  const formattedDate = formatDateTime(record.collectedAt || new Date().toISOString());
  const currency = shop.currencySymbol || '$';
  const customerName = record.customerName && record.customerName !== 'Valued Customer'
    ? record.customerName
    : 'Valued Customer';

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
    ? generateRecordChangeMessage(shop, record, cumulativeTotalBalanceOwed, previousBalance, config.customCollectionInstructions)
    : generateCollectedChangeMessage(shop, record, cumulativeTotalBalanceOwed);

  return createWhatsAppRedirectLog(record, shop, type, text);
}
