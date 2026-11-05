# Evaluation: Devin-built platform vs. Power Apps

Audience: the client's VP of Engineering. Numbers come from
[`cost-model.md`](cost-model.md) (Microsoft list prices verified in
[`research-pricing.md`](research-pricing.md); engineering effort, salaries and
growth are stated assumptions). No clarifying questions could be asked, so every
unknown is an explicit assumption with a sensitivity check.

## 1. What Power Apps is actually buying you

Not forms. For a fintech the value is in the layer under the forms:

1. **Identity and access**: Entra ID sign-in, MFA, conditional access, group sharing.
2. **Governance**: environments, DLP policies, admin center, audit logs auditors already accept.
3. **Zero ops**: hosting, patching, scaling, uptime are Microsoft's problem.
4. **Non-engineers can build and change apps** without an engineering ticket.
5. **Compliance inheritance**: Microsoft's attestations cover the platform (scope to verify).

The $250K/year tells us who the users are. At $20/user/month Premium, that is
~1,040 licensed users, roughly 17× the engineering team. The real users are ops,
support, compliance and finance. Any replacement is a product for hundreds of
non-technical people, not an engineers' admin panel.

## 2. What is replicable with Devin, and what isn't

| | Verdict | Evidence from the prototype |
|---|---|---|
| The three apps | **Replicable**, with room to spare | All three ported in ~55 min on a shared platform |
| Ten more apps of the same shape | **Replicable and repeatable** | 4th tool added from `AGENTS.md` conventions in one Devin turn, zero code edits |
| Role-based access | **Replicable, and better**: enforced server-side on every page and mutation, unit-tested | `rbac.ts`, 403s on direct URL access |
| Audit trail | **Better**: hash-chained, tamper-evident, exportable, export itself audited | Audit page "tamper" demo |
| Approvals | **Replicable, and better**: one queue for all apps, self-approval impossible by construction, tested | Refunds ≥ $500, prod flag changes, dispute write-offs |
| Things Power Apps makes hard | **Only possible in code**: server-side PII masking by role, percentage rollouts with sticky bucketing, an SDK endpoint product services call, business rules as tested pure functions | `kyc/pii.ts`, `flags/sdk.ts`, 16 unit tests |
| SSO (Okta/Entra), MFA, conditional access | **Replicable, not built**: standard OIDC integration, ~1 week; the identity boundary is isolated for this | `auth.ts` |
| Hosting, backups, monitoring, on-call | **Not replicable by Devin**: this becomes the team's job | Priced as infra + platform owner |
| Compliance evidence (SOC 2 controls, access reviews, retention) | **Not replicable by Devin**: the controls have to be designed and evidenced by people; Devin can implement them | Priced as security spend |
| Ops staff building their own apps | **Not replicable.** This is the one capability that is lost outright | — |

Honest footnote: Microsoft is adding Copilot app generation to Power Apps, so
"AI can build the app" is not Devin's differentiator. The differentiator is that the
output is ordinary code: tests, review, CI, integration with the product's own
services, and no per-user license.

## 3. Cost, maintenance, security, opportunity cost

**Build cost.** Base case (Power Apps Premium, 30% user growth, apps 3 → 13 → 45 by year 5):

| Year | Power Apps | Devin-built | Cumulative build − buy |
|---|---|---|---|
| 1 | $366K | $553K | +$187K |
| 2 | $456K | $319K | +$50K |
| 3 | $576K | $402K | −$124K |
| 4 | $725K | $486K | −$363K |
| 5 | $912K | $569K | **−$706K** |

Year 1 is more expensive because the committed license year overlaps with build and
migration. The crossover is year 3. Devin's own subscription is excluded (Enterprise
pricing is per contract); at list Teams pricing it would be <$30K/year for 60 seats
and does not change the shape of the result.

**What flips it.** Power Apps Premium is priced per user with unlimited apps; a code
platform is priced per app (maintenance) and per platform owner, with near-zero
marginal user cost. So:

| Scenario | 5-year outcome |
|---|---|
| Flat headcount | **Power Apps cheaper by ~$300K** |
| 15% user growth | Build saves ~$130K (crossover year 4) |
| 30% user growth (base) | Build saves ~$700K (year 3) |
| 50% user growth | Build saves ~$1.7M (year 2) |
| Many apps, modest users | Roughly even |
| Already on pay-as-you-go licensing | Build saves ~$5.6M |

**Maintenance burden.** Modeled at 2.5 days/app/year plus a platform owner growing
from 0.5 to 1.5 FTE. Devin reduces the per-app figure (dependency bumps, small
changes, test maintenance are exactly its sweet spot) but does not remove the owner:
someone has to hold the pager, run security reviews and talk to auditors.

**Security.** Two-sided. The prototype shows code can be *more* secure than a
Power App in specific ways: data never leaves the server unmasked, approvals cannot
be self-approved, history cannot be silently edited, every rule has a test. But the
team inherits the whole surface: auth implementation, secrets, patching, dependency
supply chain, backups, and producing compliance evidence. Power Apps' compliance
story is bought; here it is built and owned. Budgeted at $30K/year plus owner time;
treat that as a floor.

**Opportunity cost.** Every engineer-week spent on internal tools is a week not spent
on the product. The model prices this at loaded cost ($220K/year), but the honest
version is: the plan only works if the platform owner is a real headcount decision,
not a side project for a product team. Devin lowers the hours, not the ownership.

## 4. Recommendation: migrate fully, timed to renewal, with conditions

**Build.** For a Series C company that expects ops headcount to keep growing, a
Devin-built code platform is cheaper from year 3 and compounds after that, and it
removes the per-user ceiling on how many people can use internal tools. The
prototype shows the shared layer is a few days of work and that each additional
tool is small and repeatable.

**Conditions, stated plainly:**

1. **Full migration or nothing.** Anyone who still needs one Power App still needs a
   license. Partial migration keeps most of the cost and adds a second platform.
2. **Year 1 costs more.** Budget ~$190K over the Power Apps baseline while both run.
3. **The case depends on hiring growth.** If ops headcount is flat for three years,
   stay on Power Apps.
4. **Hire or assign a platform owner** before the first app ships to production.
5. **Ops loses self-service.** Mitigate with a fast request path (Devin turns most
   small changes around in minutes once conventions exist), and accept that this is
   a real loss for some teams.
6. **Compliance evidence must be rebuilt**: access reviews, retention, change
   management. Start with the auditor's control list, not after.

**If they build, the path:**

| Phase | When | What |
|---|---|---|
| 0. Decide | Now | Confirm renewal date and licensing SKU; confirm headcount plan; name the platform owner |
| 1. Platform | Weeks 1–3 | OIDC against their IdP, Postgres, hosting, backups, monitoring, CI; port the prototype's RBAC/audit/approvals |
| 2. First app in prod | Weeks 3–5 | Refunds (lowest risk, clearest approval story). Run in parallel with the Power App; compare audit trails |
| 3. Migrate KYC and flags | Weeks 5–9 | KYC last among the three (PII, compliance review). Ship the flag SDK to one product service |
| 4. New apps | From week 6 | One per week with Devin, each a PR reviewed by the owner and UAT'd by the business team |
| 5. Retire Power Apps | At renewal | Do not renew. Export Dataverse data and audit history for retention |

Devin's role: the build tool for phases 1–4 and the maintenance tool after. Each new
app is a prompt against `AGENTS.md`, reviewed as a PR by a human.

**If they stay on Power Apps** (flat headcount, or they value ops self-service more
than the savings): consolidate to Premium per-user if not already, negotiate at
renewal with this model in hand, and still use Devin for the integration glue Power
Apps makes awkward (custom connectors, the flag SDK, data exports to the warehouse).
Devin fits either path; it just fits the build path much more.
