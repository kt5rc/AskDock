AskDock Handoff

Project summary
- Next.js App Router + TypeScript + Tailwind + shadcn/ui
- Supabase Postgres (DB only; no Supabase Auth)
- Custom username/password auth, sessions stored in DB

Key decisions
- Roles: admin | user (system user exists for migrations)
- On user deletion: migrate memos/comments to system, add migration comment, prefix memo title with "[MIGRATED]"
- Display name max length: 40
- Basic password policy enforced
- Categories: env, frontend, backend, db, git, other, chat
- Owned filter: Open / Solved / Owned
- New ribbon: green if created_at < 24h; blue if latest comment < 24h; both show split ribbon

Routes / pages
- /login
- / (memos list)
- /memos/[id]
- /account (profile + change password)
- /admin/users (admin-only user management)

API routes
- Auth routes: login/logout/me/change-password
- Memo routes: list/create/update/delete + comments
- Account route: profile update
- Admin routes exist for user management (create/reset/delete/list)
- Counts route: memo counts for tabs (separate from list)

Key files
- lib/auth.ts: session validation
- lib/supabaseAdmin.ts: server-only Supabase client
- app/api/admin/users/route.ts: delete migration + MIGRATED prefix
- components/memo-card.tsx: activity ribbon + category color
- app/admin/users/page.tsx: create/reset/delete user
- app/page.tsx: SWR + debounced search + separate counts

Env vars
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- APP_SESSION_DAYS (default 14)
- APP_COOKIE_NAME (default sid)

Scripts
- npm run seed:users (requires .env.local)

Notes / gotchas
- system user must exist or admin delete will fail
- Deleting users: memos/comments migrate to system; migration comment inserted
- Display name update uses 40-char limit
- Memo list uses SWR; counts are fetched from a separate endpoint

Next steps (optional)
- Consider adding a "system" role if you want explicit separation (currently username-based)
- Add tests if desired
