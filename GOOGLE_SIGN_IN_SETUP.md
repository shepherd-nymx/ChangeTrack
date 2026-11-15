# Activate Google sign-in

The app uses the existing Supabase Auth project, not a separate Google user database.

1. In Google Auth Platform create a Web application OAuth client. Configure the consent screen for external users and the scopes openid, email and profile. While in Testing, add your test users; publish the audience when ready for public sign-in.
2. Add your production origin: https://changetrack-vert.vercel.app (and any custom domain you actually use).
3. Add this exact authorized redirect URI:
   https://ejacymvlqlsxecnntsjb.supabase.co/auth/v1/callback
4. In https://supabase.com/dashboard/project/ejacymvlqlsxecnntsjb/auth/providers?provider=Google enable Google and save the client ID and secret. Keep the secret in Supabase, never VITE variables or source code.
5. In Supabase Authentication URL Configuration set the Site URL to https://changetrack-vert.vercel.app and allow https://changetrack-vert.vercel.app/ as a redirect. Add exact origins for any other domain or stable preview alias you intend to test.
6. Confirm Vercel has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for the intended environment, then deploy this branch.

## Verification

Test an existing owner with Google, a new Google user (shop name and explicit terms acceptance), cancelled sign-in, sign-out, and a second account on the same browser. Check the correct shop opens. Existing password users should use the same verified Google email to link their identities through Supabase's normal linking rules.

## PWA

The Vite plugin generates the manifest and worker. Registration happens once in main.tsx. Install prompt state is shared across all buttons, including the sign-in page. Static assets are precached; Supabase authentication and API responses are never cached by the worker. Only named legacy caches are deleted during activation. Updates wait until the existing app closes to avoid interrupting till work.

Build and serve with npm run build and npm run preview. Check manifest icons, install in Chrome/Edge, reopen in standalone mode, test shell loading offline, and reconnect before cloud sign-in or sync. iOS uses Safari > Share > Add to Home Screen. PWA installation does not itself publish an app to Google Play.
