# Devin vs. Power Apps: internal-tools platform prototype

A Series C fintech (~60 engineers) pays ~$250K/year for Microsoft Power Apps, runs
three internal apps on it (KYC review queue, refunds dashboard, feature-flag admin)
and plans at least ten more. This repo evaluates whether they should instead build
those tools in code with Devin, and contains the prototype built to test that.

| What | Where |
|---|---|
| Working prototype (Next.js + Prisma) | [`app/`](app/) — run instructions below |
| Build-vs-buy evaluation and recommendation | [`docs/evaluation.md`](docs/evaluation.md) |
| Key decisions one-pager | [`docs/key-decisions.md`](docs/key-decisions.md) |
| Power Apps pricing research (verified list prices) | [`docs/research-pricing.md`](docs/research-pricing.md) |
| 5-year cost model with sensitivity (`python3 scripts/cost_model.py`) | [`docs/cost-model.md`](docs/cost-model.md) |
| Original spec and scope | [`SPEC.md`](SPEC.md) |
| Loom outline | [`docs/loom-outline.md`](docs/loom-outline.md) |

**Recommendation in one line:** migrate fully to a Devin-built code platform, timed
to the Power Apps renewal, *if* ops headcount keeps growing. Savings start in year 3
and reach ~$700K cumulative by year 5 in the base case; with flat headcount, Power
Apps stays cheaper. Details and caveats in [`docs/evaluation.md`](docs/evaluation.md).

## What the prototype is

One Next.js app that hosts many internal tools on a **shared platform layer**, the
part Power Apps gives you for free and the part that decides whether "10 more apps"
is cheap:

- **Identity boundary** (`src/platform/auth.ts`): a demo user switcher standing in
  for SSO. Production swaps this for OIDC (Okta/Entra) and maps IdP groups to roles.
- **Server-side RBAC** (`src/platform/rbac.ts`): six roles, a permission matrix,
  enforced in every page (`requireUser`) and every mutation (`authorize`), not just
  hidden in the UI. 403s are real.
- **Hash-chained audit log** (`src/platform/audit*.ts`): every action in every app
  is appended with a SHA-256 hash of the previous event. The Audit page verifies the
  chain and flags edited or deleted rows; a demo button tampers with a row so you
  can watch it break. Exports to CSV, and the export is itself audited.
- **Maker-checker approvals** (`src/platform/approvals.ts`): one approval queue for
  every app. The approver must hold the right permission and must not be the
  requester (tested).
- **App registry + UI kit** (`src/platform/apps.ts`, `src/platform/ui`): adding a
  tool is one registry line; navigation and the home page follow the user's role.

Four tools sit on top of it:

| Tool | Ported from Power Apps | Added because it's code |
|---|---|---|
| **KYC Review Queue** | Queue with status/risk filters, assign, approve/reject/escalate with reason | PII masked **on the server** by role (agents never receive the data); high-risk approvals restricted to Compliance; full per-case history |
| **Refunds** | Request refunds, totals by status, process approved ones | ≥ $500 routed to a second approver; self-approval blocked by the platform; threshold is a tested pure function |
| **Feature Flags** | Per-environment on/off | Percentage rollouts with sticky bucketing; prod changes require approval and are applied by the platform; an **SDK endpoint** (`/api/flags/evaluate`) product services can call |
| **Chargeback Disputes** | — (built in the timed demo) | Deadline tracking, evidence workflow, write-offs ≥ $500 go through the same approval queue |

### The timed demo: Devin adds a 4th tool

After writing [`app/AGENTS.md`](app/AGENTS.md) (the conventions above as a checklist),
Devin was asked for a chargeback dispute tracker. Result, measured from the
commit log:

- **Generation: ~1.5 minutes in a single turn**, no human edits to the code.
- Added: Prisma model + seed, 3 permissions, registry entry, page, 4 server actions,
  an approval kind, pure rules and a test. 16/16 tests, typecheck and lint green.
- **One hiccup:** the running dev server kept the old Prisma client after the schema
  change and 500'd until restarted. Fixed by adding the gotcha to `AGENTS.md`, which
  is the point: conventions compound.
- Honest framing: in a real Devin Cloud session, with PR creation and a human
  review, budget 15–30 minutes per tool of this shape, and ~1 engineer-day including
  UAT with the ops team. That is the figure used in the cost model (1.25 eng-weeks
  per app including spec, review and UAT, deliberately conservative).

## Run it

Requires Node 20+.

```bash
cd app
npm install
npm run setup     # prisma generate + db push (SQLite) + seed synthetic data
npm run dev       # http://localhost:3000
```

Use the **Switch user (demo SSO)** dropdown in the sidebar to change role:

| User | Role | Try |
|---|---|---|
| Ana Torres | Support agent | KYC shows masked PII; request a $600 refund, then notice you can't approve it |
| Kai Nakamura | KYC analyst | Full PII, assign and decide cases; can't approve a score ≥ 70 |
| Priya Shah | Compliance | Approve high-risk KYC, decide approvals, view/export the audit log |
| Marco Rossi | Finance manager | Approve Ana's refund in **Approvals**; try approving your own and get blocked |
| Devon Lee | Engineer | Flip flags in dev/staging; a prod change becomes an approval request |
| Sam Okafor | Admin | Everything; **Audit Log → "Demo: tamper with a row"** to see the chain break |

Flag SDK:

```bash
curl "http://localhost:3000/api/flags/evaluate?key=instant_payouts&env=prod&subject=user_42" -H "x-api-key: demo-sdk-key"
```

Checks: `npm test` (Vitest: RBAC, hash chain, self-approval, rollout bucketing,
dispute rules), `npm run typecheck`, `npm run lint`.

## Deliberately not built

Real OIDC, production hosting/backups/monitoring, secrets management, rate limiting,
data retention, a drag-and-drop builder for ops staff, and compliance evidence
(SOC 2 controls, access reviews). These are the real cost of building and are
priced into the cost model as platform-owner time and infra/security spend, and
discussed as risks in [`docs/evaluation.md`](docs/evaluation.md).

## Time spent

Research and cost model ~1h; prototype ~2h (platform ~50 min, three apps ~55 min,
AGENTS.md + timed demo ~15 min); write-up ~45 min. All code was written by Devin
from the plan agreed in chat.
