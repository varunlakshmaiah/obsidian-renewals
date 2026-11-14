# Changelog

All notable changes to this project are documented here. Versions follow [Semantic Versioning](https://semver.org).

## 1.0.5

- Changes synced from another device are reloaded instead of being overwritten by the next save
- Merging a CSV keeps each subscription's price history and creation date
- Trials whose end date has passed stay on the dashboard, count toward monthly spend, and are reminded daily until kept or cancelled; other overdue charges show as overdue
- Leaving Obsidian open past midnight now rolls dates forward, shows the day's reminders, and updates Today/Tomorrow labels
- Amounts keep their cents ($9.99 no longer shows as $10), using each currency's own minor units
- Keyboard focus stays on the tab, filter, or toggle you pressed after the view redraws
- The trial "+3 months" preset no longer skips past the end of short months
- Changing a subscription's amount and currency together no longer logs a mixed-currency price change
- Section tabs are announced as toggle buttons; small field labels on phones are slightly larger
- The test suite runs in headless Chrome and gates every release

## 1.0.4

- Tighter layout on phones: the subscription form sits closer together and keeps the amount and currency side by side
- Tabs, filter pills and trial actions are 40px tall on narrow panes instead of 44px
- Settings tab on narrow panes puts each control under its label, so labels and descriptions are no longer squeezed into a narrow column
- Less empty space around the summary and section headings in narrow panes

## 1.0.3

- Coupon row fade drawn as an overlay instead of `mask-image`, clearing the last directory CSS lint warning

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
