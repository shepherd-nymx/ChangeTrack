import { supabaseService } from './supabase';

export interface ShopSubscription {
  shopId: string;
  monthlyFee: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

export type SubscriptionState = 'ACTIVE' | 'EXPIRING' | 'EXPIRED';

/** The warning banner appears this many days before the period ends. */
export const EXPIRY_WARNING_DAYS = 3;

class SubscriptionService {
  /**
   * Load the signed-in shop's subscription row. Returns undefined when the
   * check could not run (offline / not configured / db error) so callers can
   * fail open instead of locking shops out over a transient failure.
   */
  async getSubscription(shopId: string): Promise<ShopSubscription | null | undefined> {
    const client = supabaseService.getClient();
    if (!client) return undefined;
    const { data, error } = await client
      .from('shop_subscriptions')
      .select('shop_id, monthly_fee, currency, period_start, period_end')
      .eq('shop_id', shopId)
      .maybeSingle();
    if (error) return undefined;
    if (!data) return null;
    return {
      shopId: data.shop_id,
      monthlyFee: Number(data.monthly_fee) || 0,
      currency: data.currency || 'USD',
      periodStart: data.period_start,
      periodEnd: data.period_end
    };
  }

  /** Try to reactivate the shop with a confirmed activation key. Returns the new period end on success. */
  async redeemKey(key: string): Promise<{ success: boolean; periodEnd?: string; error?: string }> {
    const client = supabaseService.getClient();
    if (!client) return { success: false, error: 'Cloud services are not configured on this device.' };
    const { data, error } = await client.rpc('redeem_activation_key', { p_key: key });
    if (error) {
      const msg = error.message || 'The key could not be accepted.';
      return { success: false, error: msg.replace(/^.*Exception: /, '') };
    }
    return { success: true, periodEnd: data ?? undefined };
  }

  /** Derive the current subscription state from a period end timestamp. */
  stateFor(sub: ShopSubscription | null | undefined): SubscriptionState {
    if (!sub) return 'EXPIRED';
    const end = new Date(sub.periodEnd).getTime();
    const now = Date.now();
    if (end <= now) return 'EXPIRED';
    if (end - now <= EXPIRY_WARNING_DAYS * 864e5) return 'EXPIRING';
    return 'ACTIVE';
  }

  /** Whole days remaining until expiry (0 when expired). */
  daysLeft(sub: ShopSubscription): number {
    const end = new Date(sub.periodEnd).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 864e5));
  }
}

export const subscriptionService = new SubscriptionService();
