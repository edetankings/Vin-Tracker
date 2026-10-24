# Vin Tracker

A personal task and progress tracker: plan tasks, complete them, and track consistency.
Built with React 19, TanStack Start, Vite, Tailwind CSS, GSAP, and Supabase.
The production build retains the existing Cloudflare target through Nitro.

## Local development

Use Node.js 22.18+ (Node 24 recommended). Install with:

```sh
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run dev
```

Keep an existing `.env` intact. Set the template variables to the existing Supabase
project values; no database migration or new project is required. Only public URL
and publishable key variables may use the `VITE_` prefix. Server handlers need the
corresponding unprefixed variables in the host's runtime environment. Never expose
a service role key in client variables. The legacy peer option avoids optional
peer auto-installation in this existing dependency graph; it was also used to
refresh the npm lockfile. Bun's public-registry lockfile remains available; it has
not been validated with Bun in this environment.

## Verification

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

The tests cover independent route error diagnostics in browser and SSR contexts.
They do not replace live account testing for sign-in, task CRUD, notes, reminders,
and progress. The repository still has existing formatting lint violations.

## Hosting

Keep the existing Cloudflare account, domain, Supabase project, and authentication
redirect configuration. `npm run build` generates `.output/public`, the Cloudflare
worker in `.output/server`, and Wrangler configuration through Nitro. Review that
generated configuration against the live worker before using your existing deploy
pipeline. `npm run preview` previews the production artifact. No deploy happens as
part of the build or verification commands above.

Before changing hosting integrations, verify direct ownership and billing access
to the existing hosting and backend accounts.

## Google sign-in

Google sign-in uses the existing Supabase Auth project and existing profile/task/note
ownership. It requires no new database schema or service role access.

1. In Google Auth Platform, create a Web OAuth client. Add each app origin under
   Authorized JavaScript origins. Add the callback URL shown in Supabase's Google
   provider settings (`https://<project-ref>.supabase.co/auth/v1/callback`) as an
   authorized redirect URI. This Google-to-Supabase callback is different from the
   app callback below.
2. Enable Google in Supabase Authentication and enter the Google Client ID and
   Client Secret there. The secret must never appear in frontend environment
   variables or source control. In Google's testing mode, add the Google accounts
   you will test with to its test-user list; configure production access before
   making the sign-in generally available.
3. In Supabase Authentication settings, enable **manual identity linking**. This
   lets existing anonymous users connect Google while retaining their user ID,
   profile, tasks and notes. If Google already belongs to another profile, the app
   displays the conflict; it does not merge accounts or move data automatically.
4. In Supabase URL Configuration, set the production Site URL and allow these app
   redirect URLs for each environment you actually use:
   - `https://<your-app-domain>/auth/callback`
   - `http://localhost:8080/auth/callback` (default development server)
   - `http://127.0.0.1:8185/auth/callback` (only when using that local preview)
5. Keep the Supabase endpoint reachable and the existing migrations applied.
   Start Google sign-in and finish it in the same browser/origin: the app uses PKCE
   and explicitly exchanges the one-time authorization code on `/auth/callback`.

The welcome screen offers Google sign-in and optional name-only signup. Existing
users connect Google under Settings → Profile. New Google users get a profile from
their Google display name; existing custom profile names are kept. Once connected,
the same Google account can retrieve its saved tasks and notes on another device.
A connected user can sign out without resetting their data. No code deployment or
Google/Supabase dashboard changes are performed by the local build.

Verify live Google sign-in, cancellation, anonymous account linking (same user ID
before and after), sign-out/sign-in and access from a second browser after the
provider and callback URLs are configured. Local automated tests use fixtures and
do not establish that the live provider is configured correctly.
