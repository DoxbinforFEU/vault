# vaultie

React + Vite + Tailwind PWA. Student data is kept in `localStorage` and mirrored to Supabase (`budgets` table).

## Setup
```bash
npm install
cp .env.example .env     # fill in your Supabase URL + anon key
# Supabase → SQL Editor: run supabase/schema.sql
# Supabase → Authentication → Users: add the admin email + password
npm run dev
```
- Student app: `http://localhost:5173/`
- Admin dashboard: `http://localhost:5173/admin.html`

## Structure
```
index.html / admin.html      two entry pages
public/sw.js                 service worker
supabase/schema.sql          table definition
src/
  main.jsx, App.jsx          student app entry
  screens/                   Dashboard, History, QuickAdd, Settings, Help, Welcome
  components/                shared UI (Modal, charts, nav, editors, icons)
  lib/                       budget, insights, ringFormat, store, supabase client
  data/seed.js               defaults for new accounts
  admin/                     admin entry, pages/, components/, lib/
```

## Admin dashboard (`/admin.html`)
Pages: **Overview** (stats, charts, retention, budget health, alerts), **Activity** (10 users/page, search, sort, status + date-range filters, CSV), **Users** (directory, bulk select / export / delete / mark test), **User detail** (nickname + notes, charts, edit or remove transactions, CSV).
- After pulling updates, re-run `supabase/schema.sql` (adds `nickname`, `notes`, `is_test`, realtime).
- No Row Level Security yet — add it before launch. Admin edits can be overwritten by a student's device on its next save.

## Deploy
GitHub Pages workflow builds on push to `main`. Add repo secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
