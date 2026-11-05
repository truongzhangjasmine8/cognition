# Research: Power Apps pricing and what $250K/year buys

_Checked against Microsoft's public pricing and Learn pages in Nov 2026. List prices in USD, paid yearly; enterprise agreements are usually discounted._

## Current list prices
| SKU | Price | Notes |
|---|---|---|
| Power Apps Premium (per user) | **$20/user/month** | Unlimited apps, premium connectors, Dataverse. Managed Environments included |
| Power Apps Premium (2,000-seat minimum) | $12/user/month | Not applicable: requires 2,000+ seats |
| Power Apps per app | No longer sold to new customers through some channels since Jan 2, 2026 | Existing customers may still hold it; check what their renewal terms allow |
| Pay-as-you-go (Azure) | **$10/active user/app/month** | Only users who open the app that month are counted |
| Power Automate Premium | $15/user/month | Not needed for flows that run inside a licensed app |
| Power Automate Process (unattended bot) | $150/bot/month | |
| Dataverse database capacity add-on | **$40/GB/month** | Pay-as-you-go overage: $48/GB database, $2.40/GB file, $12/GB log |
| Dataverse log storage | $12/GB/month (pay-as-you-go) | Turning on auditing increases log storage use |

Sources: [Power Apps pricing](https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing), [Power Automate pricing](https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing), [Pay-as-you-go meters](https://learn.microsoft.com/en-us/power-platform/admin/pay-as-you-go-meters), [Licensing SKUs](https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus), [Managed Environments licensing](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-licensing)

## What $250K/year implies
| Scenario | Math | Implication |
|---|---|---|
| Only the 60 engineers licensed | 60 × $240/yr = **$14.4K** | Engineers can't account for the spend. The cost comes from end users or capacity |
| All Premium per-user | $250K ÷ $240 ≈ **~1,040 users** | About 17× the engineering headcount: ops, compliance and support staff |
| All pay-as-you-go | $250K ÷ $120/yr ≈ **~2,080 user-app pairs** | e.g. about 700 users each using all 3 apps |
| Mixed (realistic) | e.g. 300 Premium users ($72K) + 150 GB extra Dataverse ($72K) + bots, environments, partner/support fees | Storage and audit logs can be a large share, especially with KYC documents |

## Why this matters for the recommendation
1. **The end users are mostly not engineers.** A code-based replacement has to serve hundreds of ops and compliance users, so it needs SSO, access reviews and support, built for non-technical users.
2. **The cost scales with headcount and app count.** Per-user and per-app pricing grows as ops staff are hired and as 10+ apps are added. A code platform has close to zero cost per additional user, so the savings grow with scale. This is the strongest financial argument for building.
3. **The cost depends on how the tools are licensed.** If they're on Premium per-user, adding 10 more apps costs nothing extra in licenses. Under pay-as-you-go or per-app, each new app adds cost. The pitch changes depending on which applies.
4. **Licensing is changing.** The per-app SKU's end of sale means they may be pushed to a different plan at renewal. That makes renewal a natural time to make the decision.

## Questions to confirm with the client
- What does the $250K break down into: user licenses (and how many), pay-as-you-go, Dataverse capacity, Power Automate, partner fees?
- Who are the licensed users by department, and who builds the apps today?
- When is the renewal date, and is it part of a broader Microsoft enterprise agreement (M365/Dynamics bundling makes it harder to remove)?
