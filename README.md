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
