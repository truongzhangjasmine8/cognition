<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Acme Fin Tools: conventions for adding an internal tool

This repo is one Next.js app hosting many internal tools on a shared platform
layer in `src/platform/`. Every tool reuses the platform; never re-implement
auth, permissions, auditing or approvals inside an app.

## Adding a new tool (checklist)

1. **Data**: add models to `prisma/schema.prisma` (ids as `String @id`, money in
   integer cents, status as a string column). Add synthetic seed rows in
   `prisma/seed.ts` (no real PII, use `*@mail.example`). Run `npm run setup`.
2. **Permissions**: add `<slug>:view` plus the actions you need to `PERMISSIONS`
   in `src/platform/rbac.ts` and grant them per role in `ROLE_PERMISSIONS`.
   Keep "request" and "approve" as separate permissions.
3. **Register**: add an entry to `APPS` in `src/platform/apps.ts`. That is all
   the navigation and home page need.
4. **Pages**: `src/app/<slug>/page.tsx` (server component). First line of the
   page: `const user = await requireUser("<slug>:view")`. `searchParams` and
   `params` are Promises; await them. Read the flash with `readFlash(sp)` and
   render `<FlashBanner />`. Use only components from `src/platform/ui`.
5. **Mutations**: `src/app/<slug>/actions.ts` with `"use server"`. Every action
   is `withFlash(path, async () => { const user = await getCurrentUser();
   authorize(user, "<perm>"); ...; await recordAudit(user, {...}); return "ok
   message"; })`. Authorization and audit happen on the server, in the action,
   never only in the UI.
6. **Second approver** (if needed): put pure rules in `src/apps/<slug>/rules.ts`,
   register an approval kind in `src/apps/<slug>/approvals.ts` with
   `registerApprovalKind`, import it from `src/platform/approval-kinds.ts`, and
   call `requestApproval` from the action. The platform blocks self-approval.
7. **Tests**: pure rules (thresholds, masking, bucketing) get a Vitest file in
   `src/platform/__tests__/` or next to the rule. Run `npm test`, `npm run
   typecheck`, `npm run lint`.

## Style

- Server components by default; no client components unless interaction needs
  them. Forms post to server actions.
- Tailwind utility classes; no new CSS files.
- Keep each app to `page.tsx`, optional `[id]/page.tsx`, `actions.ts`, and
  `src/apps/<slug>/*.ts` for pure logic.

## Gotcha

After changing `prisma/schema.prisma` or running `npm run db:reset`, restart `next dev`. The dev server keeps
the previously generated Prisma client in memory, so new models appear as
`undefined` until it restarts.
