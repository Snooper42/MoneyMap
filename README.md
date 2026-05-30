# MoneyMap

**Local-first personal finance. No bank login, no sync, no backend.**

Track spending, budgets, net worth, and goals entirely in your browser. Your data never leaves your device.

---

## Quick start

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` — tap **Explore with demo data** to see the full dashboard, or **Add my accounts** to start with real balances.

---

## What it does

| Feature | Notes |
|---------|-------|
| Transactions | Manual entry or CSV import from any bank |
| Budgets | Monthly category limits with live progress |
| Net worth | Manual account balances + snapshot history |
| Goals | Savings and payoff targets with deadlines |
| Debt payoff | Avalanche or snowball, with projected dates |
| Investments | Manual holding tracker with allocation chart |
| Credit history | Score log with multi-bureau trend chart |
| Review mode | Weekly transaction cleanup with approve/skip |
| Automation | Category rules, transfer hiding, merchant cleanup |

---

## Privacy model

- Data stored in `localStorage` under the key `moneymap_v1`
- No network requests beyond loading the app files
- No telemetry, no analytics, no ads
- Export a JSON backup before switching browsers or clearing site data

---

## Version

Current: `v0.1.1` — see [CHANGELOG.md](CHANGELOG.md) and [ROADMAP.md](ROADMAP.md)

Patch notes: `docs/PATCH_NOTES_v0.1.1.md`

---

## Architecture

```
src/
  js/
    core/     app-config, render-bus, shared-helpers, security, cache-guard
    ui/       spend-map, onboarding, touch, nav, dashboard
    ux-v*.js  legacy patch layers (being consolidated)
  css/
    base.css layout.css components.css mobile.css ux-v*.css
```

## Local dev

```bash
python3 -m http.server 8080
# Always use same port — localStorage is origin-scoped
```

DevTools: `MoneyMapRenderBus.list()` · `MM.money0(1000)` · `window.MoneyMap.version`
