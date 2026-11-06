# Key decisions (one page)

**What I built.** One Next.js/Prisma app hosting four internal tools on a shared
platform layer: a swappable identity boundary, server-side RBAC, a hash-chained
audit log with export, a generic maker-checker approval queue, an app registry and
a UI kit. Three tools port the client's Power Apps (KYC queue, refunds, feature
flags); the fourth (chargeback disputes) was added by Devin in one turn from the
repo's `AGENTS.md` to measure repeatability. Those conventions are now packaged as
a Devin skill (`.devin/skills/add-internal-tool`), so app #5 starts from a procedure,
not from memory.

**Why that scope.** The client's question is not "can Devin build a form" (yes,
and so can Copilot in Power Apps). It is "can we take over the platform work
Power Apps does for us, and does adding the 11th app stay cheap". So the budget
went to the platform first (~50 min), apps second, a timed fourth app last, with
feature flags as the planned cut if over time (not needed).

**Why I added things Power Apps doesn't do.** A like-for-like copy would only argue
license savings, and the recommendation is a full migration, so the prototype needed
to show what code buys beyond that. I picked extras that are cheap in code and
awkward or impossible in Power Fx: PII masked on the server by role, self-approval
blocked by construction, tamper-evident audit history, percentage rollouts with an
SDK endpoint, and unit tests for every rule. Each is small; I avoided extras that
would read as scope creep (document viewer, vendor integrations).

**Architecture choices and tradeoffs.**

- *Monolith, not one repo per tool.* Shared auth/audit/approvals are the whole
  argument; one deploy keeps them consistent. Cost: one blast radius, one owner.
- *Server components + server actions only.* Every mutation passes through
  `authorize()` and `recordAudit()` in one place, which is what an auditor wants to
  read. Cost: less interactive UI than a Power App canvas.
- *Permission matrix as a typed constant.* Reviewable in a PR and testable. Cost: a
  role change is a deploy; in production, IdP groups map onto these roles.
- *Hash chain in the app, not a WORM store.* Detects edits and deletions by anyone
  with DB access; does not prevent them. Production would anchor the head hash
  externally.
- *Approvals as a registry of kinds.* Apps register `onApproved/onRejected`; the
  platform owns permission, self-approval, atomicity and audit.
- *SQLite now, Postgres later; cookie user switcher instead of OIDC.* Real SSO is a
  known week of work that would not change the conclusion.

**What I cut.** Out of scope by design, and priced as risk in the evaluation: real
SSO/SCIM, hosting/backups/monitoring, a low-code builder for ops staff, connectors
beyond one database, compliance controls. Simplified from the spec to protect the
time box: plain Tailwind instead of shadcn/ui, tables filter but don't sort or
paginate, detail pages instead of drawers.

**What review found.** Tests, typecheck and lint were green throughout, yet a
browser walkthrough found four defects (including a tamper demo that went
undetected) and a Devin Review pass found more: approval decisions that weren't
atomic, applicant names leaking past PII masking, CSV formula injection, setup that
wiped data. All fixed. The lesson for how we pitch this: generation took minutes;
review and testing are where the time goes, and the cost model budgets for it.

**Where the analysis could be wrong.** All engineering effort, salary and growth
numbers are my assumptions; Microsoft prices are verified. The biggest swing is
user growth: flat headcount makes Power Apps cheaper by ~$300K over 5 years. Devin
Enterprise pricing, Microsoft's compliance inheritance and the loss of ops
self-service are unpriced; the evaluation says so rather than forcing a clean answer.

**What I'd do with another day.** OIDC against a test Okta tenant, Postgres and a
deploy, one real product service consuming the flag SDK, and a second timed demo
run by someone who has not seen the repo.
