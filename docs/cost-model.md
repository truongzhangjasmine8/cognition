# Multi-year cost model: Power Apps vs. Devin-built platform

Reproduce with `python3 scripts/cost_model.py` (5 years by default; all inputs are flags; `--years 3` reproduces the 3-year tables). Since we can't ask the client anything, every input below is a stated assumption.

## Assumptions
| Input | Value | Basis |
|---|---|---|
| Current licensing | Power Apps Premium, ~1,040 users | $250K ÷ $240/user-yr ([pricing](research-pricing.md)) |
| Ops user growth | 30%/yr (sensitivity 15–50%) | Series C hiring |
| App count | 3 → 13 → 21 → 29 → 37 → 45 | 10 planned + ~8/yr afterwards (room to scale) |
| Loaded engineer cost | $220K/yr (~$4.6K/week) | US fintech |
| Power Apps: new app / maintenance | 0.75 eng-week per app / 1 day per app per year | Simple CRUD and approval apps are fast in low-code |
| Power Apps: admin & governance | 0.25 FTE | Environments, DLP, licensing admin |
| Dataverse storage growth | +$15K/yr | More apps, KYC docs, audit logs |
| Build: platform foundation | 4 eng-weeks (year 1) | SSO via existing IdP, RBAC, audit, approvals, CI/CD, UI kit |
| Build: migrate 3 apps | 5 eng-weeks (year 1) | Including Dataverse data migration |
| Build: new app | 1.25 eng-weeks | Devin builds; a human writes the spec, reviews and runs UAT |
| Build: maintenance | 2.5 days per app per year | Dependencies, CVEs, bugs, small changes |
| Build: platform owner | 0.5 → 0.75 → 1.0 → 1.25 → 1.5 FTE (cap) | On-call, upgrades, access reviews, roadmap |
| Build: infra / security | $20–60K / $30K per yr | Managed Postgres, hosting, logging, backups; pen test, audit scope |
| Year-1 overlap | Full Power Apps license still paid | Annual commitment; cut at renewal |
| Devin subscription | **Excluded** | Contract-specific: add seats/usage at the client's rate |

## Results (base case: Premium, 30% user growth)
| Year | Apps | Users | Buy (Power Apps) | Build (Devin) | Build − Buy |
|---|---|---|---|---|---|
| 1 | 13 | 1,040 | $366K | $553K | +$187K |
| 2 | 21 | 1,352 | $456K | $319K | −$137K |
| 3 | 29 | 1,758 | $576K | $402K | −$174K |
| **3-yr** | | | **$1,398K** | **$1,274K** | **−$124K** |

## Sensitivity (3-year Build − Buy)
| Scenario | Result |
|---|---|
| 15% user growth | ~$0 (break-even) |
| 30% user growth (base) | −$124K |
| 50% user growth | −$314K |
| Pay-as-you-go licensing ($10/user/app/mo) | −$1.5M (license cost grows with every app) |

## What the model says
1. **Building costs more in year 1.** Platform setup plus migration plus a license year already paid for comes to about $190K more than buying. Excluding the overlap, year-1 build is ~$290K, just above the $250K budget.
2. **From year 2, building runs ~$120–180K/yr cheaper**, and the gap grows with headcount. Power Apps cost scales per user; the built platform's cost scales with *engineering effort*, which barely changes with user count.
3. **The main cost of building is people, not Devin.** In year 3, ~$220K of the ~$400K is the platform owner. Devin lowers the cost per app (1.25 vs. ~3+ eng-weeks without it), but someone still has to own production.
4. **Partial migration doesn't save money under per-user licensing.** As long as a user still needs any Power App, they still need a license. Savings only arrive once Power Apps is fully retired, or once whole user groups no longer need it.
5. **Not modeled, and against building:** loss of citizen-developer self-service (ops requests land in the engineering backlog), compliance evidence auditors may already accept from Microsoft, and execution risk. **Not modeled, and in favor of building:** custom logic and integration that's painful in Power Fx, code review/CI/testing, and no further licensing changes forced by Microsoft.

## Long run: 5 years
| Year | Apps | Users | Buy | Build | Cumulative Build − Buy |
|---|---|---|---|---|---|
| 1 | 13 | 1,040 | $366K | $553K | +$187K |
| 2 | 21 | 1,352 | $456K | $319K | +$50K |
| 3 | 29 | 1,758 | $576K | $402K | −$124K |
| 4 | 37 | 2,285 | $725K | $486K | −$363K |
| 5 | 45 | 2,970 | $912K | $569K | **−$706K** |

| Scenario (5-yr cumulative) | Build − Buy | Crossover |
|---|---|---|
| 0% user growth | **+$303K (buy wins)** | Never |
| 15% user growth | −$131K | Year 4 |
| 30% user growth (base) | −$706K | Year 3 |
| 50% user growth | −$1.74M | Year 2 |
| 15% growth, 15 new apps/yr, owner up to 2 FTE | +$29K (break-even) | Never within 5 yrs |
| Pay-as-you-go licensing | −$5.6M | Year 2 |

**What drives the long-run answer:** Power Apps Premium costs **per user**, with unlimited apps. A built platform costs **per app** (maintenance plus platform staff), with users close to free. So:
- **User growth favors building.** Each new ops hire adds $240/yr to Power Apps and close to nothing to the built platform.
- **App growth alone favors Power Apps.** Under per-user licensing, the 30th app costs nothing extra in licenses, but it adds maintenance in a codebase.
- At 30% headcount growth, Power Apps passes ~$900K/yr by year 5, while build stays under ~$600K. If headcount stays flat, buying stays cheaper indefinitely.
