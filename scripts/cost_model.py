"""Multi-year build-vs-buy cost model. All inputs are assumptions; edit and rerun.

Usage: python3 scripts/cost_model.py [--years 5] [--user-growth 0.3] [--licensing premium|payg]
"""
import argparse

WEEK = 220_000 / 48  # loaded US engineer cost per working week

p = argparse.ArgumentParser()
p.add_argument("--users", type=int, default=1040)           # $250K / $240 per Premium user-year
p.add_argument("--user-growth", type=float, default=0.30)   # ops headcount growth per year
p.add_argument("--years", type=int, default=5)
p.add_argument("--new-apps-y1", type=int, default=10)
p.add_argument("--new-apps-later", type=int, default=8)  # per year after year 1
p.add_argument("--owner-max-fte", type=float, default=1.5)
p.add_argument("--licensing", choices=["premium", "payg"], default="premium")
p.add_argument("--apps-per-user", type=float, default=2.0)  # PAYG only: avg apps a user opens monthly today (of 3)
a = p.parse_args()

apps, users = 3, a.users
rows = []
for year in range(1, a.years + 1):
    new = a.new_apps_y1 if year == 1 else a.new_apps_later
    apps += new
    if year > 1:
        users = round(users * (1 + a.user_growth))
    if a.licensing == "premium":
        license_ = users * 20 * 12
    else:
        avg_apps = a.apps_per_user * (apps / 3) ** 0.5  # apps are departmental; usage grows sub-linearly
        license_ = users * avg_apps * 10 * 12
    storage = 15_000 * year                         # Dataverse capacity + audit logs grow with apps
    buy = {
        "licenses": license_ + storage,
        "build new apps": new * 0.75 * WEEK,       # low-code, simple apps ~3-4 days
        "maintain apps": apps * 1 * WEEK / 5,      # ~1 day/app/yr
        "admin/governance": 0.25 * 48 * WEEK,
    }
    build = {
        "platform build": (4 if year == 1 else 0) * WEEK,
        "migrate 3 apps": (5 if year == 1 else 0) * WEEK,
        "build new apps": new * 1.25 * WEEK,       # Devin builds; human spec, review, UAT
        "maintain apps": apps * 2.5 * WEEK / 5,    # deps, bugs, small changes
        "platform owner": min(a.owner_max_fte, 0.25 + 0.25 * year) * 48 * WEEK,  # grows with app count
        "infra": 10_000 + 10_000 * year,
        "security": 30_000,                         # pen test, audit scope, tooling
        "Power Apps overlap": buy["licenses"] if year == 1 else 0,  # annual commit
    }
    rows.append((year, apps, users, buy, build))

def k(x): return f"${x/1000:,.0f}K"
print(f"licensing={a.licensing} user_growth={a.user_growth:.0%}\n")
print("| Year | Apps | Users | Buy (Power Apps) | Build (Devin) | Build - Buy | Cumulative |")
print("|---|---|---|---|---|---|---|")
tb = tbu = 0
for year, apps, users, buy, build in rows:
    b, bu = sum(buy.values()), sum(build.values())
    tb, tbu = tb + b, tbu + bu
    print(f"| {year} | {apps} | {users:,} | {k(b)} | {k(bu)} | {k(bu-b)} | {k(tbu-tb)} |")
print(f"| **{a.years}-yr** | | | **{k(tb)}** | **{k(tbu)}** | **{k(tbu-tb)}** | |")
print(f"\nYear-{a.years} run rate breakdown")
for name, d in (("Buy", rows[-1][3]), ("Build", rows[-1][4])):
    print(f"- {name}: " + ", ".join(f"{n} {k(v)}" for n, v in d.items() if v))
print("\n(Devin subscription excluded: add seats/usage at the client's contracted rate.)")
