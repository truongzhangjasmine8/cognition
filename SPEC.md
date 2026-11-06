# Spec: Build vs. Buy for Internal Tools — Devin vs. Microsoft Power Apps

> **Status: delivered.** Outcome: recommend a full migration to a Devin-built code
> platform timed to the Power Apps renewal, conditional on continued ops headcount
> growth. See [`README.md`](README.md) for the prototype, [`docs/evaluation.md`](docs/evaluation.md)
> for the analysis and [`docs/key-decisions.md`](docs/key-decisions.md) for the
> one-pager. Deviations from this spec are noted inline in *italics*.

## 1. Context

| | |
|---|---|
| **Client** | Series C fintech, ~60 engineers |
| **Current spend** | ~$250K/year on Microsoft Power Apps (platform licensing) |
| **Apps today** | KYC review queue, refunds dashboard, feature-flag admin panel |
| **Pipeline** | 10+ more internal tools planned |
| **Question (VP Eng)** | Can the team use Devin to build these tools in-house, cut the license cost, and get full control over customization? |
| **Our job** | Research → ~2h prototype → honest evaluation → build-vs-buy recommendation |

**Framing:** The question isn't whether Devin can build *a* KYC queue. It can. The real question is whether the team can take over **what the platform does for them** (auth, permissions, audit, data connectivity, governance, hosting, compliance) across **13+ apps**, for less than $250K/year in total cost and risk.

---

## 2. Research: what Power Apps actually provides

Group the research into four areas. For each, record what it is, why it matters for *this* client, and how hard it is to replicate.

### 2.1 Building blocks
- **Canvas apps** (pixel-level UI, Power Fx formulas) and **model-driven apps** (UI generated from the Dataverse data model, with forms, views and business process flows).
- **Dataverse**: a managed relational store with row- and column-level security, business rules, built-in auditing, and solution packaging.
- **Connectors**: 1,000+ prebuilt (SQL, SharePoint, Salesforce, REST, etc.), plus custom connectors and on-prem data gateways.
- **Power Automate**: workflows, scheduled jobs and **approvals**, which matter for maker-checker flows like refunds.
- **Copilot / AI app generation**: natural-language app creation. Power Apps already offers an "AI builds the app" story, so Devin isn't the only option with one.

### 2.2 Security & governance (likely the real value for a fintech)
- **Entra ID (Azure AD) auth**, conditional access, MFA, and group-based sharing. All of it comes for free.
- **Environments** (dev/test/prod), **DLP policies** that control which connectors can be combined, and **Managed Environments** for admin controls and usage insights.
- **Auditing** at the Dataverse level, plus admin-center logs. These help with SOC 2 / PCI evidence collection.
- **Compliance inheritance**: the platform carries Microsoft's attestations. *Verify which attestations cover the services they actually use before relying on this.*

### 2.3 Lifecycle
- ALM via **solutions** and pipelines. Microsoft handles hosting, patching, scaling and uptime.
- Citizen developers: ops and compliance staff can build or adjust apps without engineering.

### 2.4 Cost model (verify list prices; don't quote from memory)
- Per-user (Premium) and per-app plans, pay-as-you-go, plus Dataverse capacity add-ons.
- **Key hypothesis to check:** at typical list prices, $250K/year implies **hundreds to ~1,000 licensed users**. That means the users are mostly **ops, compliance and support staff, not the 60 engineers**. This changes the analysis: whatever replaces Power Apps has to serve non-technical users, and those users may currently be *building* apps themselves.

### 2.5 Research outputs
- [x] A one-paragraph "what Power Apps is" summary for the video (*[`docs/evaluation.md`](docs/evaluation.md) §1, [`docs/loom-outline.md`](docs/loom-outline.md)*)
- [x] The top 5 capabilities that matter for this client, ranked (*[`docs/evaluation.md`](docs/evaluation.md) §1*)
- [x] Open questions for the client (see §7) (*answered as stated assumptions in [`docs/cost-model.md`](docs/cost-model.md)*)

---

## 3. Prototype

### 3.1 Goal
Show that Devin can reproduce the **platform layer** that makes building many internal tools cheap and safe, not just one-off apps. Then prove it by having Devin add a **new** tool on top of that layer from a short prompt.

### 3.2 Scope decision
Power Apps' advantage for "10 more apps" is that each new app gets auth, RBAC, audit, data access and a consistent UI with no extra work. So the prototype is:

1. **A shared internal-tools foundation** (the "platform")
2. **2–3 apps built on it** that mirror the client's existing apps
3. **A repeatable "new tool" workflow for Devin** (repo conventions + playbook) that we demo live. *As built: conventions in [`app/AGENTS.md`](app/AGENTS.md); playbook as a repo skill in [`.devin/skills/add-internal-tool/SKILL.md`](.devin/skills/add-internal-tool/SKILL.md)*

### 3.3 Functional requirements

**Platform layer (shared by every app)**
| # | Capability | Power Apps equivalent | Prototype implementation |
|---|---|---|---|
| P1 | Authentication | Entra ID SSO | OIDC-ready auth (NextAuth/Auth.js). Dev mode uses a **user/role switcher** so the demo doesn't need an IdP. *As built: no Auth.js yet; a cookie-based demo identity isolated in `app/src/platform/auth.ts` (the only file an OIDC session would replace), disabled under `NODE_ENV=production`* |
| P2 | Role-based access control | Security roles, sharing | Declarative `role → permissions` map per app; enforced **server-side** on every action, not only hidden in the UI |
| P3 | Audit log | Dataverse auditing | Append-only `audit_events` table (actor, action, entity, before/after, timestamp) written by a shared server wrapper; viewer page |
| P4 | Maker-checker approvals | Power Automate approvals | Generic approval primitive: a request is created by A and must be approved by B ≠ A; threshold-based |
| P5 | Data access | Dataverse / connectors | Typed ORM layer (Prisma) on SQLite locally, Postgres-compatible schema; seed data |
| P6 | Consistent UI kit | Canvas/model-driven controls | Shared components: data table (filter/sort/paginate), detail drawer, status badges, forms with validation |
| P7 | App registry / navigation | App launcher | Home page listing apps visible to the current role |

**Apps**
| App | Must demonstrate |
|---|---|
| **KYC review queue** | Queue of applicants, filter by status/risk, assign to self, approve/reject/escalate with reason, PII masked unless role permits, every decision audited |
| **Refunds dashboard** | List and search refunds; agents request refunds; refunds above a threshold (e.g. $500) **require a second approver** (P4); totals by status |
| **Feature-flag admin** | Flags per environment; toggle/percentage rollout; **prod changes require approval**; change history from the audit log |
| **New tool built live by Devin** (stretch / demo) | e.g. "Chargeback dispute tracker" or "Vendor payout approvals", built from a one-paragraph prompt using only platform primitives. Record elapsed time and number of human interventions. *Done: Chargeback Disputes, one turn, ~1.5 min generation, one environment hiccup; see README.* |

### 3.4 Non-functional requirements
- Runs locally with one command (`npm install && npm run dev`) and seeds demo data.
- Authorization is enforced server-side, and tests cover at least the permission matrix and maker-checker rule.
- No real PII, secrets or customer data.
- `AGENTS.md` documents conventions so Devin (or an engineer) adds new apps consistently: folder layout, how to declare permissions, how to write audited mutations.

### 3.5 Explicitly out of scope (and called out as risk in the evaluation)
- Real SSO/IdP integration, SCIM provisioning, conditional access
- Production hosting, backups, DR, uptime monitoring
- A low-code/drag-and-drop builder for non-engineers
- Connector breadth (only one database; no Salesforce/SharePoint/etc.)
- Formal compliance controls (SOC 2 evidence, access reviews, pen test)

### 3.6 Proposed architecture
```
cognition/
├── README.md               # what it is, how to run, demo script
├── AGENTS.md               # conventions for Devin/engineers adding new tools
├── SPEC.md                 # this file
├── docs/
│   ├── key-decisions.md    # one-pager (internal)
│   └── evaluation.md       # build-vs-buy analysis backing the Loom
├── prisma/schema.prisma    # shared + per-app models, seed script
└── src/
    ├── platform/           # auth, rbac, audit, approvals, ui kit
    └── apps/
        ├── kyc/
        ├── refunds/
        ├── feature-flags/
        └── <new-tool>/     # built live by Devin
```
- **Stack:** Next.js (App Router) + TypeScript, Prisma, SQLite (dev) / Postgres (prod), Tailwind + shadcn/ui, Vitest.
  *As built: the app lives in `app/` (root keeps docs and the cost model); plain Tailwind with a small in-repo UI kit instead of shadcn/ui; tables filter but do not sort or paginate, and detail views are pages rather than drawers.*
- **Why one monorepo/one deployable:** shared auth, RBAC and audit come for free to every new app, mirroring the platform benefit of Power Apps. It also keeps a 2-hour build realistic.
- **Why code-first instead of a config-driven builder:** Devin's leverage comes from writing ordinary code that engineers can review. A homegrown low-code builder would be a second platform to maintain.

### 3.7 Time box (~2h total)
| Block | Time | Output |
|---|---|---|
| Scaffold + platform (P1–P7) | 45 min | Running app shell with role switcher, audit, approvals |
| KYC + refunds apps | 40 min | Two working apps on platform primitives |
| Feature-flag admin | 15 min | Third app |
| Devin builds a new tool from a prompt | 20 min | Timed demo + `AGENTS.md`/playbook proving repeatability |

If we run over, cut the feature-flag app before cutting the live "new tool" demo. The demo is the evidence for the "10 more apps" claim.

---

## 4. Evaluation framework

Score Devin-build against Power Apps on each dimension using **evidence from the prototype** where possible.

| Dimension | Questions to answer | Evidence |
|---|---|---|
| **Build cost** | Engineer + Devin time per new app? How does that compare to building in Power Apps today? | Timed "new tool" demo; time per app in prototype |
| **Run cost** | Hosting, DB, monitoring, IdP, Devin usage vs. $250K license | Rough annual estimate with stated assumptions |
| **Maintenance burden** | Who owns upgrades, dependency CVEs, on-call, bug fixes for 13+ apps? | Count of components the team now owns |
| **Security & compliance** | SSO/MFA, RBAC correctness, audit integrity, PII handling, SDLC controls on AI-written code, Devin's access to prod data | What the prototype does and what's missing from §3.5 |
| **Opportunity cost** | Engineering hours diverted from the core product; what a platform team would cost (FTE) | Hours/year estimate |
| **Users & ownership** | Can ops and compliance still self-serve? Who builds app #14? | Answer to licensed-user-count question |
| **Flexibility** | Custom logic, integrations, UX, testing, versioning in Git | Prototype features hard to do in Power Apps |
| **Lock-in & exit** | Cost of leaving each option later | Qualitative |

Also deliver a **replicability matrix** with three buckets: *easily replicable with Devin*, *replicable but becomes ongoing ownership*, *not realistically replicable*.

---

## 5. Recommendation

*Final: **Build** (full migration at renewal) with the conditions in [`docs/evaluation.md`](docs/evaluation.md) §4. The 5-year model shows build cheaper from year 3 at 30% user growth and Power Apps cheaper under flat headcount.* The options considered were:
- **Buy (stay):** if most licensed users are non-engineers who build or modify apps themselves, or if Microsoft's compliance and identity integration is doing heavy lifting for audits.
- **Build:** if apps are built only by engineers, need deep integration with internal services, and the team will fund a small platform owner (~0.5–1 FTE) for auth, audit, hosting and upgrades.
- **Hybrid / phased:** keep Power Apps for existing and simple CRUD apps while building the next 1–2 complex, integration-heavy tools on a code platform with Devin. Then measure real build and maintenance cost before migrating anything or cancelling licenses.

The final recommendation must state the decision, the 2–3 deciding factors, the conditions that would change it, and next steps.

### 5.1 Next steps (either direction) and where Devin fits
- **If build:** a 4–6 week pilot. Harden the platform layer (real SSO, deployment, monitoring, security review), migrate one low-risk app (feature flags), use Devin for new apps behind mandatory human code review, then track cost per app.
- **If buy:** Devin still fits, for custom connectors, backend APIs that Power Apps calls, test automation, migrating logic out of Power Fx where it gets too complex, and integrating Power Apps into the codebase's CI.
- **If hybrid:** define criteria for which apps go where. For example, "PII + complex logic + internal APIs → code; simple forms/approvals → Power Apps."

---

## 6. Deliverables & definition of done

| Deliverable | Done when |
|---|---|
| **GitHub repo** (this repo) | Prototype runs from README instructions; README explains what it does, how to run, and how a new tool was added by Devin |
| **Loom (≤5 min)** for the VP Eng | Covers: (1) what matters most in Power Apps, (2) how Devin helps if they build, shown with the prototype, (3) what's replicable, what's not, where the risk is, (4) build-vs-buy recommendation + reasoning, (5) next steps and Devin's role |
| **Key Decisions one-pager** (`docs/key-decisions.md`) | ≤1 page, written for Cognition (not the client): scope chosen and why, architecture decisions, tradeoffs, what was deliberately cut. Concise and specific, no filler |

**Suggested Loom structure (5:00)**
1. 0:00–0:45 What Power Apps really gives them (the platform, not the forms)
2. 0:45–2:15 Demo: platform primitives → KYC/refunds → Devin adds a new tool live/recorded
3. 2:15–3:15 Honest assessment: replicability matrix + risks
4. 3:15–4:15 Recommendation + deciding factors
5. 4:15–5:00 Next steps and where Devin fits

**Overall time budget: 3–4h**: research 45m, prototype 2h, evaluation + one-pager 45m, Loom 20–30m.

---

## 7. Open questions for the client

> We can't ask the client, so each question below is answered with a stated assumption in [`docs/cost-model.md`](docs/cost-model.md) and the evaluation tests how sensitive the result is to it.

1. How many licensed users are there, and what's the split between engineers and ops/compliance/support? Who builds apps today?
2. What's actually in the $250K: per-user vs. per-app licenses, Dataverse capacity, Power Automate, other M365 bundling?
3. Which data sources do the apps touch (core DB, Salesforce, SharePoint, payment processor, KYC vendor)?
4. Do auditors (SOC 2, PCI, banking partners) currently rely on Power Platform controls or logs as evidence?
5. Is there an existing internal platform/infra team and a standard deploy target (e.g. AWS + Okta)?
6. How fast do the 10 new apps need to ship, and how complex are they compared with the existing three?
