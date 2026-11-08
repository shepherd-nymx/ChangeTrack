import { supabaseService } from './supabase';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../legal/legalDocs';

interface AuthResult {
  success: boolean;
  needsVerification?: boolean;
  needsSetup?: boolean;
  error?: string;
}

function friendlyAuthError(msg: string): string {
  if (msg.toLowerCase().includes('email not confirmed')) return 'Please confirm your email before signing in. Check your inbox and spam folder.';
  if (msg.includes('Invalid login')) return 'Wrong email or password. Please try again.';
  if (msg.includes('already registered')) return 'An account with this email already exists. Please sign in instead.';
  if (msg.includes('at least') && msg.toLowerCase().includes('password')) return 'Password must be at least 6 characters long.';
  if (msg.toLowerCase().includes('invalid email') || msg.toLowerCase().includes('email address')) return 'Please enter a valid email address.';
  if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) return 'Too many attempts. Please wait a moment and try again.';
  if (msg.toLowerCase().includes('accept the terms')) return msg;
  return msg;
}

class ShopAuthService {
  /** Request email confirmation; shop setup starts only after verification. */
  async signUpShop(name: string, email: string, password: string): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) return { success: false, error: 'Cloud services are not configured on this device.' };

    const { data, error } = await client.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { shop_name: name }
      }
    });
    if (error) return { success: false, error: friendlyAuthError(error.message) };
    // Confirmation is enforced by Supabase, never simulated in the browser.
    if (data.session) await client.auth.signOut();
    return { success: true, needsVerification: true };
  }

  async resendVerification(email: string): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) return { success: false, error: 'Cloud services are not configured.' };
    const { error } = await client.auth.resend({
      type: 'signup', email,
      options: { emailRedirectTo: `${window.location.origin}/` }
    });
    return error ? { success: false, error: friendlyAuthError(error.message) } : { success: true };
  }

  async getVerifiedUser() {
    const client = supabaseService.getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    return !error && data.user?.email_confirmed_at ? data.user : null;
  }

  async completeRegistration(name: string, marketingOptIn: boolean): Promise<AuthResult> {
    const client = supabaseService.getClient();
    const user = await this.getVerifiedUser();
    if (!client || !user) return { success: false, error: 'Confirm your email before creating your shop.' };
    const { data: existing, error: lookupError } = await client.from('shops').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (lookupError) return { success: false, error: lookupError.message };
    if (existing) return this.openPortal(existing.id);

    const shopId = crypto.randomUUID();

    // Record legal acceptance BEFORE creating the shop: a database trigger
    // refuses shop creation until this account has an acceptance row.
    const { error: acceptanceError } = await client.from('legal_acceptances').insert({
      user_id: user.id,
      user_email: user.email,
      shop_id: shopId,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      marketing_consent: marketingOptIn,
      user_agent: navigator.userAgent
    });

    if (acceptanceError) {
      console.warn('[LegalAcceptance] failed to record:', acceptanceError.message);
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
      return { success: false, error: friendlyAuthError(shopError.message) };
    }

    void this.sendWelcomeEmail(name, user.email ?? '');
    return this.openPortal(shopId);
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
   * A verified account without a shop must finish setup first.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = supabaseService.getClient();
    if (!client) return { success: false, error: 'Cloud services are not configured on this device.' };

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { success: false, needsVerification: error.code === 'email_not_confirmed' || error.message.toLowerCase().includes('email not confirmed'), error: friendlyAuthError(error.message) };
    const user = await this.getVerifiedUser();
    if (!user) {
      await client.auth.signOut();
      return { success: false, needsVerification: true, error: 'Please confirm your email before signing in.' };
    }
    const { data: shop, error: lookupError } = await client.from('shops').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (lookupError) return { success: false, error: lookupError.message };
    if (!shop) return { success: true, needsSetup: true };
    return this.openPortal(shop.id);
  }

  private async openPortal(shopId: string): Promise<AuthResult> {
    const { storage } = await import('./storage');
    storage.initCleanLocalStore(shopId);
    const result = await storage.pullCurrentPortalFromSupabase();
    if (!result.success) return { success: false, error: result.error || 'Could not load your shop. Please try again.' };
    return { success: true };
  }

  async signOut(): Promise<void> {
    const client = supabaseService.getClient();
    if (client) await client.auth.signOut();
  }

  /**
   * Latest legal acceptance for the signed-in user, or null if none exists.
   * Returns undefined when the check itself could not run (offline/db error) so
   * callers can fail open instead of locking users out.
   */
  async getLatestAcceptance(): Promise<{ terms_version: string; privacy_version: string } | null | undefined> {
    const client = supabaseService.getClient();
    if (!client) return undefined;
    const { data, error } = await client
      .from('legal_acceptances')
      .select('terms_version, privacy_version, accepted_at')
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return undefined;
    return data ? { terms_version: data.terms_version, privacy_version: data.privacy_version } : null;
  }

  /** Record renewed acceptance of the current document versions. */
  async recordRenewedAcceptance(marketingOptIn: boolean): Promise<boolean> {
    const client = supabaseService.getClient();
    if (!client) return false;
    const { data: userData } = await client.auth.getUser();
    const user = userData.user;
    if (!user) return false;

    const { data: shopRow } = await client.from('shops').select('id').maybeSingle();

    const { error } = await client.from('legal_acceptances').insert({
      user_id: user.id,
      user_email: user.email ?? '',
      shop_id: shopRow?.id ?? null,
      terms_version: CURRENT_TERMS_VERSION,
      privacy_version: CURRENT_PRIVACY_VERSION,
      marketing_consent: marketingOptIn,
      user_agent: navigator.userAgent
    });
    if (error) {
      console.warn('[LegalAcceptance] renewal failed:', error.message);
      return false;
    }
    return true;
  }

  async getSessionUser(): Promise<{ id: string; email?: string } | null> {
    const client = supabaseService.getClient();
    if (!client) return null;
    const user = await this.getVerifiedUser();
    if (!user) return null;
    const { data: shop, error } = await client.from('shops').select('id').eq('owner_user_id', user.id).maybeSingle();
    return !error && shop ? user : null;
  }

  onAuthChange(cb: (signedIn: boolean) => void): () => void {
    const client = supabaseService.getClient();
    if (!client) return () => {};
    // Sign-in is completed by the auth screen only after verification and setup.
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') cb(false);
    });
    return () => data.subscription.unsubscribe();
  }
}

export const shopAuth = new ShopAuthService();
