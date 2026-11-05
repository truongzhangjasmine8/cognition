# Key decisions (one page)

**What I built.** One Next.js/Prisma app hosting four internal tools on a shared
platform layer: a swappable identity boundary, server-side RBAC, a hash-chained
audit log with export, a generic maker-checker approval queue, an app registry and
a UI kit. Three tools port the client's Power Apps (KYC queue, refunds, feature
flags); the fourth (chargeback disputes) was added by Devin in one turn from the
repo's `AGENTS.md` to measure repeatability.

**Why that scope.** The client's question is not "can Devin build a form" (yes,
and so can Copilot in Power Apps). It is "can we take over the platform work
Power Apps does for us, and does adding the 11th app stay cheap". So the budget
went to the platform first (~50 min), apps second, and a timed fourth app last. I
chose to keep all three apps and the demo rather than polish any one of them; the
plan was to cut feature flags first if over time, which did not happen.

**Why I added things Power Apps doesn't do.** The user asked for more than a
recreation, and the recommendation is a full migration, so the prototype needed to
show a benefit beyond license savings. I picked extras that are cheap in code and
awkward or impossible in Power Fx: PII masked on the server by role, self-approval
blocked by construction, tamper-evident audit history, percentage rollouts with an
SDK endpoint, and unit tests for every rule. Each is under 60 lines. I avoided
extras that would look like scope creep (document viewer, vendor integrations).

**Architecture choices and tradeoffs.**

- *Monolith, not one repo per tool.* Shared auth/audit/approvals are the whole
  argument; one deploy keeps them consistent. Cost: one blast radius, one owner.
- *Server components + server actions, no client-side state.* Every mutation
  passes through `authorize()` and `recordAudit()` in one place, which is what an
  auditor wants to read. Cost: less interactive UI than a Power App canvas.
- *Permission matrix as a typed constant, not a database table.* Reviewable in a
  PR, testable, and the roles are stable. Cost: a role change is a deploy. In
  production, roles would map from IdP groups to these constants.
- *Hash chain in the app, not a WORM store.* It detects edits and deletions by
  anyone with DB access, which is the realistic threat; it does not stop them. A
  production version would anchor the head hash externally daily.
- *Approvals as a registry of kinds with callbacks.* Apps register
  `onApproved/onRejected`; the platform owns permission, self-approval and audit.
  Cost: an in-memory registry, so each app's module must be imported once.
- *SQLite now, Postgres later.* Nothing in the schema is SQLite-specific.
- *Cookie user switcher instead of OIDC.* Real SSO is a known week of work and
  would have consumed the prototype budget without changing the conclusion.

**Where the analysis could be wrong.** All engineering effort, salary and growth
numbers are my assumptions; Microsoft prices are verified. The biggest swing is
user growth: flat headcount makes Power Apps cheaper by ~$300K over 5 years. I also
could not price Devin Enterprise or the value of Microsoft's compliance
inheritance, and I did not model ops teams losing self-service. I say so in the
evaluation rather than tuning the model to a clean answer.

**What I'd do with another day.** OIDC against a test Okta tenant, Postgres and a
deploy, one real product service consuming the flag SDK, and a second timed demo
run by someone who has not seen the repo.
