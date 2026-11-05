# Loom outline (≤ 5 min, audience: VP of Engineering)

**0:00–0:40 What Power Apps is really giving you.** Not forms: identity, governance,
zero ops, non-engineers can build, compliance inheritance. The $250K says ~1,000
licensed users, so your real users are ops and compliance, and any replacement is a
product for them.

**0:40–2:30 What we built with Devin (screen share).**
- Home as Ana (agent): masked PII in KYC, no Audit/Approvals in nav, direct URL → 403.
- Request a $600 refund as Ana → appears in Approvals; Ana can't approve her own.
- Switch to Marco: approve it. Switch to Sam: Audit Log, chain verified, click
  "tamper", chain breaks, export CSV.
- Flags: Devon flips staging instantly; prod change becomes an approval. Show the
  SDK curl.
- Disputes tab: "this one didn't exist 2 minutes before; Devin built it from
  AGENTS.md. That's the 11th app."

**2:30–3:30 Honest assessment.** Replicable: the apps, RBAC, audit, approvals, and
better in specific ways (server-side masking, self-approval, tamper evidence, tests,
SDK). Not replicable by Devin: hosting/on-call, compliance evidence, and ops staff
building their own apps. Risk sits in ownership, not in building.

**3:30–4:30 Recommendation.** Full migration timed to renewal, if headcount keeps
growing. Table: year 1 +$190K, crossover year 3, ~$700K saved by year 5 at 30%
growth; flat headcount → stay. Conditions: all-or-nothing, name a platform owner,
rebuild compliance evidence, accept the self-service loss.

**4:30–5:00 Next steps.** Confirm renewal date and SKU; name the owner; weeks 1–3
platform with real SSO; refunds first in parallel with the Power App; KYC last; one
new app a week with Devin as PRs; don't renew. If you stay: use Devin for the
connector/SDK glue anyway.
