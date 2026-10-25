# Vin Tracker

**Public repository:** [edetankings/Vin-Tracker](https://github.com/edetankings/Vin-Tracker)

A personal task and learning tracker built with React 19, TanStack Start, Vite,
Tailwind CSS and GSAP. Profiles, tasks, notes and categories are saved locally in
this browser. There is no signup server, Google login, API key or database to configure.

## Features

- Daily task planning, priorities and custom categories.
- Calendar views, completion rates, streaks and progress charts.
- Searchable learning notes with editing and deletion.
- Responsive desktop sidebar and phone navigation.
- Light, dark and system themes, plus browser task reminders.
- Local persistence and JSON backup export/restore.

## Run locally

Use Node.js 22.18+ (Node 24 recommended).

```sh
git clone https://github.com/edetankings/Vin-Tracker.git
cd Vin-Tracker
npm ci --legacy-peer-deps
npm run dev
```

Open `http://localhost:8080`, choose Get started, and enter your name. No `.env`
file is required. Existing ignored environment files are unused and can be kept
as private records.

## Your saved data

Data survives page reloads and browser restarts on the same browser and origin.
It does not sync to other devices or browsers. `localhost`, `127.0.0.1`, different
ports, and a deployed domain each have separate browser storage. Clearing site
data, using temporary private browsing, or losing the device can remove the data.

Use Settings → Your data → Export my data to save a JSON backup of your profile,
tasks, notes and custom categories. Restore backup can load that file in another
browser or restore it after a reset; restoration requires explicit confirmation
before replacing current data. Keep backups somewhere safe. Browser storage is
not an authenticated account or an encrypted vault.

Storage errors are shown instead of pretending changes were saved. Invalid or
unsupported stored data is not silently overwritten. Editing, completion,
calendar/progress views and reminders continue to use the same task fields.
Other open tabs update when local data changes.

The former backend's schema/configuration records are preserved in
`docs/previous-backend`. No remote account, table, policy, credential or data was
deleted. Records from a former remote account are not automatically imported;
access/export from that service would be needed to recover them.

## Verification

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run preview
```

Local storage tests cover profile setup, task/note edits and deletion, backup
restoration, invalid data protection and failed writes. The linter may report existing Fast Refresh warnings.

## Hosting

The existing Cloudflare build target remains through Nitro. The build generates
`.output/public` and the worker in `.output/server`. Keep your current hosting
account and domain. Building does not deploy. The app stores its data in the
visitor's browser; the worker does not host an authentication service or database.

## What belongs in Git

The `.gitignore` keeps local environment files and credentials, dependencies,
build output, caches, Cloudflare development state, logs, test/coverage artifacts,
editor files and personal `vin-tracker-export-*.json` backups out of new commits.
The `.env.example` template, source code, lockfiles and archived migration records
remain tracked. Personal backups belong outside the repository.

Ignore rules do not remove files already committed or erase Git history. Check
`git status` and review staged files before pushing. Use placeholders in examples,
and never commit private keys or real personal exports. GitHub repository
visibility controls access to source and history; it does not upload or synchronize
the data saved in your browser.

## Contributing

Create a branch, make your change and run the verification commands above before
opening a pull request. Do not include browser exports or private environment
files in issues, pull requests or screenshots. Include a short explanation of the
change and how you checked it. Commit authorship should reflect the person making
the change; this project does not add automatic co-author attribution.
