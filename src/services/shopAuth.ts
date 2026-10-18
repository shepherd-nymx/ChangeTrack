import { supabaseService } from './supabase';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../legal/legalDocs';

interface AuthResult {
  success: boolean;
  needsVerification?: boolean;
  error?: string;
}

function friendlyAuthError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Wrong email or password. Please try again.';
  if (msg.includes('already registered')) return 'An account with this email already exists. Please sign in instead.';
  if (msg.includes('at least') && msg.toLowerCase().includes('password')) return 'Password must be at least 6 characters long.';
  if (msg.toLowerCase().includes('invalid email') || msg.toLowerCase().includes('email address')) return 'Please enter a valid email address.';
  if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  if (msg.toLowerCase().includes('accept the terms')) return msg;
  return msg;
}

class ShopAuthService {
  /**
   * Sign up a new shop account, create the shop row, and start a clean local portal
   * for it. The ownership column (owner_user_id) is filled automatically from the
   * freshly created session. A database trigger refuses shop creation unless this
   * account has recorded legal acceptance, and acceptance is written here.
   */
  async signUpShop(name: string, email: string, password: string, marketingOptIn: boolean): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) return { success: false, error: 'Cloud services are not configured on this device.' };

    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    if (!data.session || !data.user) {
      return { success: true, needsVerification: true };
    }

    const shopId = crypto.randomUUID();

    // Record legal acceptance BEFORE creating the shop: a database trigger
    // refuses shop creation until this account has an acceptance row.
    const { error: acceptanceError } = await client.from('legal_acceptances').insert({
      user_id: data.user.id,
      user_email: email,
      shop_id: shopId,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      marketing_consent: marketingOptIn,
      user_agent: navigator.userAgent
    });

    if (acceptanceError) {
      console.warn('[LegalAcceptance] failed to record:', acceptanceError.message);
      await client.auth.signOut();
      return { success: false, error: 'We could not record your acceptance of the Terms of Service. Please try again.' };
    }

    const { error: shopError } = await client.from('shops').insert({
      id: shopId,
      name,
      branch_name: 'Main Till',
      owner_name: name,
      phone: '',
      address: '',
      currency: 'USD',
      currency_symbol: '$',
      whatsapp_notice: 'Please present your Change ID or WhatsApp confirmation message to collect change within 30 days.'
    });

    if (shopError) {
      await client.auth.signOut();
      return { success: false, error: friendlyAuthError(shopError.message) };
    }

    const { storage } = await import('./storage');
    storage.initCleanLocalStore(shopId);

    this.sendWelcomeEmail(name, email);
    return { success: true };
  }

  /**
   * Fire-and-forget welcome email. Failures never block registration: the edge
   * function logs every attempt server-side and refuses to send twice.
   */
  private async sendWelcomeEmail(shopName: string, email: string): Promise<void> {
    try {
      const client = supabaseService.getClient();
      if (!client) return;
      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const url = `${(import.meta.env.VITE_SUPABASE_URL as string || '').trim()}/functions/v1/send-welcome-email`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shopName, email })
      });
      if (!response.ok) {
        console.warn('[WelcomeEmail] send failed with status', response.status);
      }
    } catch (e) {
      console.warn('[WelcomeEmail] send failed:', e);
    }
  }

  /**
   * Sign in and switch the local portal to the shop this account owns.
   * If the account has no shop row yet (e.g. created outside the app), one is created.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) return { success: false, error: 'Cloud services are not configured on this device.' };

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: friendlyAuthError(error.message) };

    const { data: shopRow } = await client
      .from('shops')
      .select('id')
      .maybeSingle();

    if (!shopRow) {
      const { data: user } = await client.auth.getUser();
      const shopId = crypto.randomUUID();
      const { error: shopError } = await client.from('shops').insert({
        id: shopId,
        name: 'My Shop',
        branch_name: 'Main Till',
        owner_name: 'Store Manager',
        phone: '',
        address: '',
        currency: 'USD',
        currency_symbol: '$'
      });
      if (shopError) return { success: false, error: friendlyAuthError(shopError.message) };

      const { storage } = await import('./storage');
      storage.initCleanLocalStore(shopId);
    } else {
      const { storage } = await import('./storage');
      storage.initCleanLocalStore(shopRow.id);
      await supabaseService.pullRemotePortalData(shopRow.id);
    }

    return { success: true };
  }

  async signOut(): Promise<void> {
    const client = supabaseService.getClient();
    if (client) await client.auth.signOut();
  }

  async getSessionUser(): Promise<{ id: string; email?: string } | null> {
    const client = supabaseService.getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) return null;
    return data.session?.user ?? null;
  }

  onAuthChange(cb: (signedIn: boolean) => void): () => void {
    const client = supabaseService.getClient();
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((event, session) => {
      (async () => {
        // Only flip on explicit events: transient INITIAL_SESSION / TOKEN_REFRESHED
        // emissions must never blank the app by toggling the auth gate.
        if (event === 'SIGNED_IN') cb(true);
        else if (event === 'SIGNED_OUT') cb(false);
        else if (event === 'INITIAL_SESSION' && session) cb(true);
      })();
    });
    return () => data.subscription.unsubscribe();
  }
}

export const shopAuth = new ShopAuthService();
