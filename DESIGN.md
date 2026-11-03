---
name: Renewals
description: A ticket wallet for recurring charges inside Obsidian. The next charge is the coupon on top; nothing disappears, it gets stamped.
# Every colour below is a REFERENCE RENDER of Obsidian's default dark theme with the default
# purple accent. styles.css uses Obsidian theme variables only; the canonical CSS variable or
# color-mix() expression for each token lives in .impeccable/design.json -> extensions.colorMeta.<key>.canonical.
colors:
  carbon: "#8a5cf5"
  interactive-accent: "#8a5cf5"
  on-accent: "#ffffff"
  void-red: "#ec898c"
  paid-green: "#87d49f"
  held-orange: "#e2b585"
  trial-pink: "#ecb6d3"
  page: "#1e1e1e"
  coupon-stock: "#262626"
  hairline: "#363636"
  ink: "#dadada"
  ink-muted: "#b3b3b3"
  ink-faint: "#666666"
typography:
  lead-figure:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "2.8em"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  amount-figure:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "1.6em"
    fontWeight: 700
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "1.15em"
    fontWeight: 700
  section:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "1em"
    fontWeight: 700
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "1em"
    fontWeight: 400
    fontFeature: "tnum"
  tab-cap:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "0.78em"
    fontWeight: 700
    letterSpacing: "0.1em"
  coupon-head:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "0.72em"
    fontWeight: 700
    letterSpacing: "0.08em"
  field-tab:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "0.62em"
    fontWeight: 700
    letterSpacing: "0.1em"
  stamp:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "0.74em"
    fontWeight: 800
    letterSpacing: "0.14em"
rounded:
  stamp: "3px"
  field-tab: "4px 4px 0 0"
  tab-cap: "6px 6px 0 0"
  control: "8px"
  coupon: "10px"
  pill: "99px"
spacing:
  hair: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "26px"
  xxl: "40px"
components:
  coupon:
    backgroundColor: "{colors.coupon-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.coupon}"
  coupon-head:
    textColor: "{colors.ink-muted}"
    typography: "{typography.coupon-head}"
    padding: "7px 12px"
  coupon-body:
    textColor: "{colors.ink}"
    padding: "12px"
  coupon-amount:
    textColor: "{colors.carbon}"
    typography: "{typography.amount-figure}"
  field-tab:
    textColor: "{colors.ink-muted}"
    typography: "{typography.field-tab}"
    rounded: "{rounded.field-tab}"
    padding: "1px 6px"
  stub:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  stamp-void:
    textColor: "{colors.void-red}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  stamp-held:
    textColor: "{colors.held-orange}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  stamp-trial:
    textColor: "{colors.trial-pink}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  stamp-paid:
    textColor: "{colors.paid-green}"
    typography: "{typography.stamp}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  tab-cap:
    textColor: "{colors.ink-muted}"
    typography: "{typography.tab-cap}"
    rounded: "{rounded.tab-cap}"
    padding: "6px 14px"
  tab-cap-selected:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
  pill:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "4px 11px"
  pill-pressed:
    backgroundColor: "{colors.interactive-accent}"
    textColor: "{colors.on-accent}"
  field-strip:
    backgroundColor: "{colors.coupon-stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.coupon}"
  icon-button:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    size: "32px"
  search-field:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 10px"
---

# Design System: Renewals

## Overview

**Creative North Star: "The Ticket Wallet"**

Every subscription is a ticket in a wallet. What charges next is the coupon on top: a perforated head carrying when and the date, a body with the service and its amount pressed in carbon, and a foot of fixed fields under small tab caps. Everything else lives behind it as a stub, a compact slip with a dashed tear edge. Nothing disappears. A cancelled service is overprinted VOID, a paused one HELD, a trial carries a TRIAL stamp, a recent charge is stamped PAID, and a one-off purchase is stamped LIFETIME. The visual system is the vernacular of jet-age tickets and coupon books, built only from the host theme's materials.

The world runs inside Obsidian, so it owns no colour and no typeface. The theme's surfaces become coupon stock, the theme's border becomes the hairline rule, the theme's accent becomes carbon, and the theme's named hues become ink for stamps, drawn toward body text until they pass AA. The result is dense and flat: hairline rules, dashed perforations, and a few bordered caps do all the structuring, with no shadows and no fills beyond the one stock tone.

Density is a desktop virtue and a phone obligation at once. The layout responds to the width of the pane, not the window, so a narrow sidebar leaf and a phone both get the one-handed arrangement with 40px touch targets (Obsidian's small touch size; phones already enlarge the text).

**Key Characteristics:**
- Coupon anatomy: perforated head with half-round notches, clickable body, tab-cap fixed fields.
- Stubs with a dashed left tear edge for the full catalogue, stamped by state.
- Rotated, bordered uppercase stamps as the only status device; VOID and HELD overprint the amount.
- Carbon (the theme accent) for the money figures that matter.
- Obsidian theme variables only; status hues tempered toward body text (55%, pink 80%).
- System type with tabular numerals throughout.
- Flat and hairline-ruled; no shadows anywhere.
- Container queries on the pane at 960, 640, and 420px.

## Colors

A borrowed palette: theme surfaces as paper, theme border as rule, theme accent as carbon, and four theme hues tempered into stamp inks.

### Primary
- **Carbon** (theme text accent): the pressed-in money figures. The amount on each coupon and the old-to-new figures in the modal's price history. It is the one colour that says "this is what you pay".

### Secondary
- **Interactive Accent** (theme interactive accent): selection and focus only. The pressed filter pill, the 2px focus outline, the search field's focused border, and the native call-to-action button.
- **On Accent** (theme text on accent): text on the pressed pill and call-to-action.

### Tertiary (stamp inks)
Each is the theme's named hue mixed toward body text: red, green and orange at 55%, trial pink at 80% so it stays visibly rose beside void red. They darken in light themes, lighten in dark themes, and clear AA on both the page and the coupon stock.
- **Void Red**: the VOID stamp, a coupon due today or tomorrow, the Cancel trial action, and price-rise markers.
- **Paid Green**: the PAID stamp, the Keep action, the Saved field in the strip, and price drops.
- **Held Orange**: the HELD and LIFETIME stamps.
- **Trial Pink**: the TRIAL stamp, the when-label on trial coupons, the trial coupon's tinted border (pink 45% into the hairline), and the trial hint in the modal.

### Neutral
- **Page** (theme primary background): the pane, stubs, the selected tab cap, the notch cut-outs, and bar tracks.
- **Coupon Stock** (theme secondary background): coupons, the field strip, spend panels, and the selected segment.
- **Hairline** (theme border): every rule, outline, perforation, and tab-cap border.
- **Ink** (theme normal text): names, values, and the when-label.
- **Ink Muted** (theme muted text): coupon heads, field tabs, secondary lines, unselected tabs and pills, and the amounts on void and held stubs.
- **Ink Faint** (theme faint text): the pill outline on hover only.

### Named Rules
**The Borrowed Ink Rule.** Every colour comes from an Obsidian theme variable or a color-mix of them. The plugin defines no hex of its own for the interface; a theme change re-inks the whole wallet.

**The Tempered Stamp Rule.** A status hue is never used raw. It is `color-mix(in srgb, <theme hue> 55%, var(--text-normal))` (pink at 80%), which keeps it legible as text in light and dark themes alike.

**The Carbon Rule.** Carbon marks money that is about to move. Beyond that it appears only where Obsidian itself uses the accent, on underlined text links; it never colours headings, labels, or decoration, and the strip's run-rate figures stay in ink.

## Typography

**Display Font:** The Obsidian interface font, inherited (system stack by default)
**Body Font:** The same inherited interface font
**Label/Mono Font:** None; labels are the same face, uppercase and tracked

**Character:** One system face doing everything. Hierarchy comes from weight (400 to 800), size in em so it follows the user's Obsidian font size, and wide tracking on the small uppercase caps. Every number is set with tabular figures so columns of amounts align.

### Hierarchy
- **Lead figure** (700, 2.8em, 1.05, -0.02em; 2.3em on narrow panes): the "due in the next 7 days" total. One per view.
- **Amount figure** (700, 1.6em, -0.01em): the amount on each coupon, in carbon.
- **Title** (700, 1.15em): the view title in the top bar.
- **Section** (700, 1em): section heads (Trials converting, Next charges, All subscriptions). Sentence case, never uppercase.
- **Body** (400, 1em): names (600 weight), values, and lines. Secondary lines run at 0.8em in muted ink.
- **Tab cap** (700, 0.78em, 0.1em, uppercase): the Subscriptions, Spend, and Settings tabs.
- **Coupon head** (700, 0.72em, 0.08em, uppercase): the when-label and date in a coupon's perforated head.
- **Field tab** (700, 0.62em, 0.1em, uppercase): the cap over each fixed field (Cycle, Account, Monthly, Annual, Saved).
- **Stamp** (800, 0.74em, 0.14em, uppercase; overprint at 0.95em, 0.18em): status stamps.

### Named Rules
**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set on the root and the modal. Any new surface inherits it; never turn it off for figures.

**The Caps Carry Data Rule.** Uppercase tracked text appears only as a coupon head, a tab cap, a field tab, or a stamp, and always labels or carries a value. It never floats above a heading as decoration.

## Layout

A single centred column (max 1180px, 4px side padding, 40px foot) inside the Obsidian leaf. From the top: a sticky top bar (title, tab caps, tools) ruled off by a hairline; a summary line with the lead figure on the left and the field strip pushed right; then sections, each with a section head (26px above, 10px below).

Next charges and converting trials sit in a coupon row. Below 960px of pane width the row scrolls horizontally with scroll-snap and a 32px fade mask at the trailing edge, columns at least 210px. At 960px and wider it becomes a fixed five-column grid with no scrolling. The full catalogue is a grid of stubs, auto-filling at a minimum of 260px (four columns at full width). The spend view uses panels auto-fitting at a minimum of 320px.

Breakpoints are container queries on the pane (`container: st / inline-size`), never media queries on the window. At 640px and below the tabs move to their own full-width row, the strip spans the width in three equal fields, the search goes full width, stubs and panels go to one column, coupons take 82% of the row so the next one peeks in, and tabs, pills, and coupon actions grow to 40px tall. At 420px and below the Add button drops its label to just the icon and the strip's field tabs shrink to 0.56em, and each setting in the settings tab puts its control under its label. On phones (`.is-phone`) Obsidian stacks modal settings and makes inputs 44px and full width, so the plugin only keeps the amount and currency side by side and tightens the gaps.

Spacing is on a small, irregular rhythm drawn from the build: 4, 6, 8, 12, 16, 26, and 40px, with 7, 9, 10, 11, 14, and 22px used for optical padding inside coupons and controls.

## Elevation & Depth

There is no elevation. No element in styles.css carries a box-shadow, and the stylesheet sets `box-shadow: none` on every button it restyles to strip Obsidian's default. Depth is conveyed the way paper conveys it: one tone step between page and coupon stock, a 1px hairline around everything, dashed perforations where a piece would tear, and half-round notches cut into the coupon edge with the page colour. The sticky top bar separates by a hairline and an opaque page background, not a shadow.

### Named Rules
**The Flat Stock Rule.** Coupons, stubs, strips, and panels are flat paper. Hover answers with the theme's hover tint, never with lift or shadow.

## Shapes

Soft rectangles with paper details. Coupons and the field strip use a 10px radius; stubs, the search field, icon buttons, and logo tiles use 8px (small logos 7px). Tab caps round only their top corners (6px) and drop the bottom border so the selected one joins the page; field tabs repeat that shape at 4px. Pills are fully rounded (99px). Stamps are nearly square (3px), bordered 2px in their own ink (2.5px when overprinting), and rotated -8deg.

Two paper marks recur. The perforation is a 1px dashed hairline: between a coupon's head and body, on a stub's left edge (2px dashed, the tear), between modal sections, and between price-history rows. The notch is an 11px half-circle, page-coloured and hairline-ringed, cut into each side of a coupon where the perforation meets the edge.

## Components

### Coupon (signature)
The upcoming charge, as a ticket you could tear.
- **Shape:** 10px radius, 1px hairline border, coupon stock fill, flex column.
- **Head:** muted uppercase coupon-head type, 7px 12px padding, the when-label on the left in ink and the date on the right, a dashed hairline below with a notch on each edge. The when-label turns void red when the charge is today or tomorrow, and trial pink on trial coupons.
- **Body:** a full-width button (12px padding, 12px gap) holding the logo tile, name and plan, and the amount figure in carbon with the base-currency approximation in muted text. Hover fills with the theme hover tint; it opens the edit modal.
- **Fixed fields:** a two-column foot (1fr 1.4fr) under a solid hairline, each field split by a vertical hairline and capped by a field tab.
- **Trial variant:** the border tints toward trial pink and an action row adds Keep (paid green text) and Cancel trial (void red text), both flexible, 40px tall on narrow panes.
- **Panel variant:** spend panels reuse the coupon shell and head, with category bars in the body.

### Stub
Every service in the catalogue, as a torn-off slip.
- **Shape:** 8px radius, 1px hairline with a 2px dashed left edge, page background, 9px 12px padding; a grid of logo, name over subtitle line, and amount. TRIAL, PAID and LIFETIME stamps ride the subtitle line (0.66em) so the name keeps its full width.
- **Hover:** border moves to the theme's hover border and the fill to the theme hover tint.
- **Void and held:** the logo greys out (grayscale, 70% opacity), the amount is hidden, the name on void stubs goes muted and struck through, and the stamp overprints the right edge, larger (0.95em, 2.5px border), on a 55% page-coloured wash; the name keeps a 48px margin clear of it.
- **Price change:** a small rise or drop marker under the amount in void red or paid green.

### Stamps
The only status device. A bordered, rotated, uppercase cap in its ink: VOID (void red), HELD and LIFETIME (held orange), TRIAL (trial pink), PAID (paid green, for three days after a charge). When a stub has just changed state it plays a 0.3s land animation, scaling from 1.9x and -16deg down to rest at -8deg on `cubic-bezier(0.16, 1, 0.3, 1)`. Under `prefers-reduced-motion: reduce` the animation is off and the stamp simply appears.

### Navigation (tab caps)
- **Style:** uppercase tab-cap type, 6px 14px padding, top-rounded 6px, transparent border and fill at rest, muted ink.
- **Hover:** ink turns normal.
- **Selected:** hairline border on three sides, page fill, a 2px page-coloured strip covering the bar's bottom rule so the tab joins the page like a coupon tab. The tab row overlaps the bar's hairline by 11px.
- **Narrow panes:** the tabs take a full-width row and grow to 40px tall.

- **Settings tab:** the third tab holds Preferences and Data as coupon panels (max 720px) with native Obsidian setting rows inside; Obsidian's own settings screen renders the same preferences from one shared function.

### Field Strip
The run-rate figures (Monthly, Annual, Saved) as a coupon's foot detached: a three-field grid on coupon stock with a 10px radius and hairline border, each field capped by a field tab, values at 1.15em/600 in ink. The Saved value is paid green. On narrow panes it spans the width with three equal fields.

### Chips (filter pills)
- **Style:** 99px radius, 1px hairline, transparent, 0.8em/600 muted text, 4px 11px padding, count trailing at 75% opacity. The row scrolls horizontally with the scrollbar hidden.
- **Hover:** ink turns normal and the outline moves to faint ink.
- **Pressed:** interactive accent fill and border with on-accent text.
- **Narrow panes:** 40px tall, 0 12px padding.

### Buttons
- **Primary:** Obsidian's native call-to-action (`mod-cta`), unrestyled apart from an icon and label gap; the label hides below 420px.
- **Icon button:** 32px square, 8px radius, transparent, muted icon (16px, from Obsidian's icon set); hover fills with the theme hover tint and ink turns normal.
- **Link:** text-accent link underlined at a 3px offset, as Obsidian draws links, used inside empty and no-match states.
- **Focus:** every button gets a 2px interactive-accent outline at a 2px offset on `:focus-visible`.

### Inputs / Fields
- **Search:** a label wrapping a search icon and a borderless input, 8px radius, hairline border, page fill, 32px tall, at most 340px wide (full width on narrow panes). Focus moves the border to the interactive accent.
- **Selects and modal fields:** Obsidian's native controls, unrestyled.
- **Segmented toggle (spend):** a 2px-padded hairline frame with 6px-radius segments; the pressed segment fills with coupon stock and normal ink.

### Modal
The edit modal uses Obsidian's settings rows. Its section headings are set in coupon-head style (0.72em, 700, 0.1em, uppercase, muted) and each section ends on a dashed hairline. Preset chips sit in a wrapping row. The price history is a carbon list: date, old-to-new figures, and actions per row, each row ended by a dashed hairline.

### Note embed
A `renewals` code block renders a single coupon inside a note: the perforated head ("Renews in the next N days" and the total), then one full-width row per charge with the when-label in tracked caps (void red for today and tomorrow), a small logo tile, the name with an inline TRIAL stamp, and the amount. A quiet "Open Renewals" link closes it. Rows are buttons that open the editor.

### Budget states
With a monthly budget set, the Monthly field in the strip gains a note line ("97% of $200"). At 90% its value and note turn held orange; over 100% they turn void red. No other element changes colour for the budget.

### Notices
Reminders and undo use Obsidian's own notices, so they carry no coupon styling: a bold summary line, an optional short list, and a native button (Open or Undo).

## Do's and Don'ts

### Do:
- **Do** take every colour from an Obsidian theme variable, and mix status hues as `color-mix(in srgb, var(--color-<hue>) 55%, var(--text-normal))` (trial pink at 80%).
- **Do** set money figures that are about to charge in carbon (`var(--text-accent)`) at figure sizes (1.6em, 700).
- **Do** build new containers as coupons: 10px radius, hairline border, coupon stock, a perforated head with notches, and fixed fields capped by field tabs.
- **Do** show state with a stamp (VOID, HELD, TRIAL, PAID, LIFETIME) and keep the record visible; overprint the amount when it no longer charges.
- **Do** write breakpoints as container queries on the pane at 960, 640, and 420px, and give tabs, pills, and actions 40px touch targets at 640px and below.
- **Do** size type in em so it follows the user's Obsidian font size, and keep tabular figures on.
- **Do** answer hover with `var(--background-modifier-hover)` and focus with a 2px `var(--interactive-accent)` outline at a 2px offset.
- **Do** gate any motion behind `prefers-reduced-motion`, as the stamp-land animation is.

### Don't:
- **Don't** add box-shadows or lift on hover; the wallet is flat paper.
- **Don't** use a raw theme hue as text; it fails AA in one theme or the other.
- **Don't** hide cancelled or paused services or delete them from view; stamp them.
- **Don't** use uppercase tracked text except as a coupon head, tab cap, field tab, or stamp.
- **Don't** set a font family; the interface font is the host's.
- **Don't** use carbon for headings, labels, or the strip's run-rate totals; outside money figures it appears only on underlined links.
- **Don't** use window media queries for layout; the pane can be a sidebar on a wide screen.
