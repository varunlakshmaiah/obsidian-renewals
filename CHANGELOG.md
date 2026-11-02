# Changelog

All notable changes to this project are documented here. Versions follow [Semantic Versioning](https://semver.org).

## 1.0.2

- Release assets now carry GitHub artifact attestations
- Coupon notches drawn without `clip-path`, and `scrollbar-width` removed, to clear the directory's CSS lint warnings

## 1.0.1

- Plugin name is now "Renewals - Subscription Manager" to meet Obsidian's naming rules (no colons)
- Re-exporting on the same day overwrites the file with `Vault.process`

## 1.0.0

First public release.

### Subscriptions
- Dashboard that leads with what's due in the next 7 days, beside monthly, annual, and saved totals
- Trials converting within 14 days, with Keep and Cancel trial
- Next five charges as coupons with amount, conversion, date, billing cycle, and payment account
- Every subscription stamped by state: Trial, Paid, Lifetime, Held, Void
- Search, filters (next 7 days, this month, next month, active, trial, lifetime, void and held), and sorting (next charge, amount, name)
- Right-click or long-press menu to edit, duplicate, pause, cancel, reactivate, or delete
- Undo for cancel, cancel trial, delete, and import
- Automatic price-change history, with price rises shown on each subscription

### Spend
- Breakdowns by category and payment method, monthly or annual
- Optional monthly budget with near and over states

### Reminders and notes
- Renewal reminders when the vault opens (off, 1, 3, 7, or 14 days), once a day
- `renewals` code block to embed upcoming renewals in any note

### Data
- Weekly, monthly, quarterly, yearly, and lifetime billing cycles
- 32 currencies with daily European Central Bank reference rates and an offline fallback
- JSON backup and CSV export to a vault folder, and import with merge or replace (works on mobile)
- Option to turn off service logos for fully offline use

### Platform
- Theme-native design that follows your Obsidian theme and accent in light and dark
- Layout that adapts to pane width, with touch-friendly controls on mobile
- Settings available inside the dashboard and in Obsidian's settings
- No runtime dependencies
