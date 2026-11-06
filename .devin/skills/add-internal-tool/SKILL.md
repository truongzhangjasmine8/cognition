---
name: add-internal-tool
description: Add a new internal tool (e.g. a vendor payout tracker or a chargeback dispute queue) to the Acme Fin Tools app in app/, reusing the platform layer for auth, RBAC, audit and approvals. Use when asked to build, scaffold or add an internal tool, dashboard or queue to this repo.
---

# Add an internal tool

## Overview
Every tool in `app/` is a thin slice on top of `app/src/platform/`: models, permissions, a registry entry, a server-component page and audited server actions. This skill turns a one-paragraph request into that slice, delivered as a reviewable PR. `app/AGENTS.md` holds the conventions and wins if the two disagree.

## What's needed from the user
- A one-paragraph description of the tool: what records it tracks, the statuses they move through, who views, who acts.
- Any amount or risk threshold that needs a second approver (e.g. "write-offs of $500 or more need a finance manager").
- Which existing roles (`agent`, `kyc_analyst`, `compliance`, `finance_manager`, `engineer`, `admin`) get which actions. If not given, choose the least-privileged mapping and say so in the PR.

## Procedure
1. Read `app/AGENTS.md` and one existing tool end to end (`app/src/app/disputes/` + `app/src/apps/disputes/` is the closest template).
2. Pick a short kebab-case `<slug>` and write down the statuses, the transitions, and which permission each transition needs before coding.
3. Add the models to `app/prisma/schema.prisma` (`String @id`, money in integer cents, status as a string) and synthetic rows to `app/prisma/seed.ts` (`*@mail.example`, no real PII).
4. Add `<slug>:view` plus one permission per action to `PERMISSIONS` in `app/src/platform/rbac.ts`, and grant them in `ROLE_PERMISSIONS`. Keep "request" and "approve" as separate permissions.
5. Register the tool in `APPS` in `app/src/platform/apps.ts`.
6. Write `app/src/app/<slug>/page.tsx`: first line `await requireUser("<slug>:view")`, then await `searchParams`/`params`, using only `app/src/platform/ui` components.
7. Write `app/src/app/<slug>/actions.ts`: each action is `withFlash(...)` → `getCurrentUser()` → `authorize(user, perm)` → mutation → `recordAudit(...)`. Wrap multi-row writes (entity + approval request + audit) in `db.$transaction` and pass `tx` through.
8. If a second approver is needed, put the threshold in `app/src/apps/<slug>/rules.ts`, register a kind in `app/src/apps/<slug>/approvals.ts`, import it from `app/src/platform/approval-kinds.ts`, and call `requestApproval` from the action.
9. Add Vitest tests for the pure rules and the new role grants in `app/src/platform/__tests__/`.
10. Run `npm run db:reset`, restart `next dev`, and run `npm test`, `npm run typecheck` and `npm run lint` in `app/`.
11. Walk through it in the browser as each affected demo user: the tool shows in navigation only for roles with `<slug>:view`, a direct URL gives a 403 otherwise, every action shows up in the Audit Log, and anything over the threshold lands in Approvals and can't be self-approved.
12. Open a PR listing the permissions added per role, the approval rule, and the elapsed time and number of human interventions.

## Specifications
- No auth, permission, audit or approval logic inside the tool; everything goes through `app/src/platform/`.
- Every mutation is authorized and audited on the server. Hiding a button is not authorization.
- Tests, typecheck and lint pass; the seed contains only synthetic data.
- Validation: steps 10 and 11 pass, and `git diff --stat` touches only the tool's own files plus `schema.prisma`, `seed.ts`, `rbac.ts`, `apps.ts`, `approval-kinds.ts` and tests.

## Advice and pointers
- This repo pins a Next.js version with breaking changes. Check `app/node_modules/next/dist/docs/` rather than relying on memory.
- After a schema change or `db:reset`, restart `next dev`, or the new models will be `undefined` at runtime.
- On this VM, Node may need `source ~/.nvm/nvm.sh && nvm use 24`.

## Forbidden actions
- Don't edit `app/src/platform/` to make one tool work. If the platform is missing a primitive, stop and ask.
- Don't add client components, CSS files or new UI libraries.
- Don't seed or log real names, emails, card numbers or account numbers.
