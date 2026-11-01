'use strict';

const {
  Plugin, ItemView, Modal, Setting, Notice, PluginSettingTab, Menu, FuzzySuggestModal,
  MarkdownRenderChild, TFile, requestUrl, setIcon, addIcon, normalizePath,
} = require('obsidian');

// ============================================================
// Constants
// ============================================================
const VIEW_TYPE = 'renewals';

// Logo: a ticket stub with a renew loop, drawn on a 24px grid and scaled to the 100-unit icon box
const ICON_ID = 'renewals';
const ICON_SVG = '<g transform="scale(4.1667)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
  + '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>'
  + '<path d="M15.5 10.2A4 4 0 1 0 16 13"/><path d="M15.8 7.6v2.8H13"/></g>';

const CURRENCIES = {
  USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'CHF',
  SGD: 'S$', AED: 'AED', SAR: 'SAR', CNY: 'CN¥', HKD: 'HK$', NZD: 'NZ$', KRW: '₩', BRL: 'R$',
  MXN: 'Mex$', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł', TRY: '₺', THB: '฿', IDR: 'Rp',
  MYR: 'RM', PHP: '₱', ZAR: 'R', CZK: 'Kč', HUF: 'Ft', ILS: '₪', RON: 'lei', ISK: 'kr',
};

const BILLING_CYCLES = {
  weekly:    { label: 'Weekly',    short: '/wk',  toMonthly: 52 / 12, toYearly: 52 },
  monthly:   { label: 'Monthly',   short: '/mo',  toMonthly: 1,       toYearly: 12 },
  quarterly: { label: 'Quarterly', short: '/qtr', toMonthly: 1 / 3,   toYearly: 4 },
  yearly:    { label: 'Yearly',    short: '/yr',  toMonthly: 1 / 12,  toYearly: 1 },
  lifetime:  { label: 'Lifetime',  short: '',     toMonthly: 0,       toYearly: 0 },
};

const STATUSES = ['active', 'trial', 'paused', 'cancelled'];

const CATEGORIES = [
  'Entertainment', 'Productivity', 'Tools', 'Cloud', 'Health',
  'Finance', 'Education', 'Communication', 'Utilities', 'Grocery', 'Other',
];

const CATEGORY_COLORS = {
  Entertainment: '#3b82f6', Productivity: '#ef4444', Tools: '#06b6d4', Cloud: '#8b5cf6',
  Health: '#10b981', Finance: '#f59e0b', Education: '#ec4899', Communication: '#6366f1',
  Utilities: '#64748b', Grocery: '#22c55e', Other: '#94a3b8',
};

const PAYMENT_TYPES = [
  'Credit card', 'Debit card', 'UPI', 'Mobile wallet', 'Online payment service',
  'Bank transfer', 'Direct debit', 'Buy now, pay later', 'Cash / Other',
];

const PAYMENT_TYPE_COLORS = {
  'Credit card': '#3b82f6', 'Debit card': '#06b6d4', UPI: '#10b981', 'Mobile wallet': '#f43f5e',
  'Online payment service': '#6366f1', 'Bank transfer': '#8b5cf6', 'Direct debit': '#ec4899',
  'Buy now, pay later': '#f97316', 'Cash / Other': '#64748b',
};

// Older records named specific providers; map them onto neutral payment types
const LEGACY_PAYMENT_TYPES = {
  'credit card': 'Credit card', 'debit card': 'Debit card', 'apple pay': 'Mobile wallet',
  'google pay': 'Mobile wallet', paypal: 'Online payment service', 'bank transfer': 'Bank transfer',
  'direct debit': 'Direct debit', 'buy now pay later (klarna)': 'Buy now, pay later',
};

// Euro-based fallback rates, used until the first successful refresh
const DEFAULT_RATES = {
  EUR: 1, USD: 1.1172, INR: 106.084, GBP: 0.8338, JPY: 175.68, CAD: 1.5606, AUD: 1.5904,
  CHF: 0.9194, SGD: 1.4282, AED: 4.1029, SAR: 4.1895, CNY: 7.4326, HKD: 8.7652, NZD: 1.9823,
  KRW: 1491.76, BRL: 6.0692, MXN: 21.1237, SEK: 10.978, NOK: 10.312, DKK: 7.4735, PLN: 4.4038,
  TRY: 55.8015, THB: 37.683, IDR: 20275.17, MYR: 4.5325, PHP: 71.143, ZAR: 18.6455, CZK: 24.353,
  HUF: 366.33, ILS: 3.495, RON: 5.3447, ISK: 136,
};

const DEFAULT_DATA = {
  primaryCurrency: 'USD',
  autoAdvance: true,
  reminderDays: 3,
  showLogos: true,
  monthlyBudget: 0,
  sortBy: 'date',
  exportFolder: 'Renewals',
  rates: DEFAULT_RATES,
  ratesDate: '',
  lastRatesFetch: 0,
  lastReminder: '',
  subscriptions: [],
};

const DUE_WINDOW = 7;
const COUPON_COUNT = 5;
const TRIAL_WINDOW = 14;
const UNDO_MS = 8000;

const CSV_COLUMNS = [
  'id', 'name', 'plan', 'cost', 'currency', 'billingCycle', 'category', 'status', 'autoRenew',
  'startDate', 'renewalDate', 'trialEndDate', 'lastPayment', 'paymentType', 'paymentAccount', 'url', 'notes',
];

// ============================================================
// Helpers
// ============================================================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

function sym(c) {
  return CURRENCIES[c] || c;
}

function fmt(cost, currency) {
  return sym(currency) + Math.round(Number(cost)).toLocaleString();
}

function fmtCycle(cycle) {
  return BILLING_CYCLES[cycle]?.short || '';
}

function toMonthly(cost, cycle) {
  return Number(cost) * (BILLING_CYCLES[cycle]?.toMonthly ?? 1);
}

function toYearly(cost, cycle) {
  return Number(cost) * (BILLING_CYCLES[cycle]?.toYearly ?? 12);
}

function parseISO(dateStr) {
  const parts = String(dateStr || '').slice(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  return parts;
}

function isoOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayISO() {
  return isoOf(new Date());
}

function addDaysISO(days, months = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() + days);
  return isoOf(d);
}

function daysUntil(dateStr) {
  const p = parseISO(dateStr);
  if (!p) return Infinity;
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - todayUTC) / 86400000);
}

function shortDate(dateStr, withDay = false) {
  const p = parseISO(dateStr);
  if (!p) return '—';
  const opts = { day: 'numeric', month: 'short' };
  if (withDay) opts.weekday = 'short';
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, opts);
}

function whenLabel(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${-days}d overdue`;
  return `In ${days} days`;
}

/** Roll a date forward one cycle without skipping short months (Jan 31 → Feb 28) */
function advanceDate(dateStr, cycle) {
  const [y, m, d] = parseISO(dateStr);
  const date = new Date(y, m - 1, d);
  if (cycle === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else {
    const add = cycle === 'yearly' ? 12 : cycle === 'quarterly' ? 3 : 1;
    date.setDate(1);
    date.setMonth(date.getMonth() + add);
    date.setDate(Math.min(d, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  }
  return isoOf(date);
}

function isThisMonth(dateStr) {
  const p = parseISO(dateStr);
  const now = new Date();
  return !!p && p[0] === now.getFullYear() && p[1] === now.getMonth() + 1;
}

function isNextMonth(dateStr) {
  const p = parseISO(dateStr);
  const next = new Date();
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  return !!p && p[0] === next.getFullYear() && p[1] === next.getMonth() + 1;
}

function getFaviconUrl(url) {
  if (!url) return null;
  let clean = url.trim().toLowerCase();
  if (!/^https?:\/\//.test(clean)) clean = 'https://' + clean;
  try {
    const domain = new URL(clean).hostname.replace(/^www\./, '');
    return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : null;
  } catch (e) {
    return null;
  }
}

// ── Lifecycle: one place decides what state a subscription is in ──
const isLifetime = (s) => s.billingCycle === 'lifetime';
const isTrial = (s) => s.status === 'trial';
const isVoid = (s) => s.status === 'cancelled';
const isHeld = (s) => s.status === 'paused';
const isLive = (s) => !isVoid(s) && !isHeld(s);
const chargeDate = (s) => (isTrial(s) ? s.trialEndDate || s.renewalDate : s.renewalDate);

function stampOf(s) {
  if (isVoid(s)) return { cls: 'void', text: 'Void' };
  if (isHeld(s)) return { cls: 'held', text: 'Held' };
  if (isTrial(s)) return { cls: 'trial', text: 'Trial' };
  if (isLifetime(s)) return { cls: 'lifetime', text: 'Lifetime' };
  const paid = daysUntil(s.lastPayment);
  if (paid <= 0 && paid >= -3) return { cls: 'paid', text: 'Paid' };
  return null;
}

/** Live, dated, chargeable subscriptions sorted by next charge */
function upcoming(subs) {
  return subs
    .filter((s) => isLive(s) && !isLifetime(s) && chargeDate(s))
    .map((s) => ({ ...s, _days: daysUntil(chargeDate(s)), _src: s }))
    .filter((s) => s._days >= 0)
    .sort((a, b) => a._days - b._days);
}

/**
 * Clean any record (saved, imported from JSON or CSV) into the current shape.
 * Returns null when the record has no usable name or amount.
 */
function normalizeRecord(r, fallbackCurrency) {
  if (!r || typeof r !== 'object') return null;
  const name = String(r.name ?? '').trim();
  const cost = parseFloat(r.cost);
  if (!name || !isFinite(cost) || cost < 0) return null;

  const str = (v) => (v == null ? '' : String(v).trim());
  const date = (v) => (parseISO(v) ? String(v).slice(0, 10) : '');
  const bool = (v) => v === true || v === 'true' || v === 'TRUE' || v === '1';

  const rawCycle = r.billingCycle || r.cycle;
  const billingCycle = rawCycle === 'one-time' ? 'lifetime' : BILLING_CYCLES[rawCycle] ? rawCycle : 'monthly';
  let status = r.status === 'inactive' ? 'cancelled' : r.status;
  if (bool(r.isTrial) && status !== 'cancelled' && status !== 'paused') status = 'trial';
  if (!STATUSES.includes(status) || (status === 'trial' && billingCycle === 'lifetime')) status = 'active';

  const rawType = str(r.paymentType);
  const paymentType = PAYMENT_TYPES.includes(rawType) ? rawType : LEGACY_PAYMENT_TYPES[rawType.toLowerCase()] || 'Cash / Other';

  return {
    id: str(r.id) || uid(),
    name,
    plan: str(r.plan),
    cost,
    currency: CURRENCIES[r.currency] ? r.currency : fallbackCurrency,
    billingCycle,
    category: CATEGORIES.includes(r.category) ? r.category : 'Other',
    status,
    autoRenew: r.autoRenew === undefined || r.autoRenew === '' ? billingCycle !== 'lifetime' : bool(r.autoRenew),
    startDate: date(r.startDate),
    renewalDate: date(r.renewalDate),
    trialEndDate: date(r.trialEndDate),
    lastPayment: date(r.lastPayment),
    paymentType,
    paymentAccount: str(r.paymentAccount || r.paymentMethod),
    url: str(r.url),
    notes: str(r.notes),
    priceHistory: (Array.isArray(r.priceHistory) ? r.priceHistory : [])
      .filter((p) => p && isFinite(+p.oldCost) && isFinite(+p.newCost))
      .map((p) => ({ date: date(p.date), oldCost: +p.oldCost, newCost: +p.newCost, currency: CURRENCIES[p.currency] ? p.currency : '' })),
    createdAt: str(r.createdAt) || new Date().toISOString(),
  };
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** RFC 4180 CSV → array of objects keyed by the header row */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell); cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else {
      cell += c;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  if (!header) return [];
  const keys = header.map((k) => k.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ''])));
}

/** Records from an exported backup, a raw data file, a bare array, or CSV */
function parseBackup(text, extension) {
  if (extension === 'csv') return parseCSV(text);
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : Array.isArray(data?.subscriptions) ? data.subscriptions : [];
}

// ── DOM ──
function h(tag, attrs, parent) {
  const e = document.createElement(tag);
  if (attrs) {
    if (attrs.cls) e.className = attrs.cls;
    if (attrs.text != null) e.textContent = attrs.text;
  }
  if (parent) parent.appendChild(e);
  return e;
}

function icon(name, parent) {
  const span = h('span', { cls: 'st-icon' }, parent);
  setIcon(span, name);
  return span;
}

/** Service logo tile; a letter when logos are off or the image fails */
function logo(sub, parent, showLogos, cls = 'st-logo') {
  const wrap = h('span', { cls }, parent);
  const letter = () => h('span', { text: (sub.name || '?').charAt(0).toUpperCase() }, wrap);
  const url = showLogos ? getFaviconUrl(sub.url) : null;
  if (!url) {
    letter();
    return wrap;
  }
  const img = h('img', null, wrap);
  img.src = url;
  img.alt = '';
  img.loading = 'lazy';
  img.onerror = () => { img.remove(); letter(); };
  return wrap;
}

/** Fixed field: a tab-cap label over a value */
function field(parent, label, value) {
  const f = h('div', { cls: 'st-field' }, parent);
  h('span', { cls: 'st-field-tab', text: label }, f);
  h('span', { cls: 'st-field-val', text: value }, f);
  return f;
}

// ============================================================
// Add / edit modal
// ============================================================
class SubscriptionModal extends Modal {
  constructor(app, plugin, sub) {
    super(app);
    this.plugin = plugin;
    this.isEdit = !!sub;
    this.originalCost = sub ? sub.cost : null;
    const cur = plugin.data.primaryCurrency;
    this.sub = sub
      ? { ...sub, priceHistory: [...sub.priceHistory] }
      : { ...normalizeRecord({ name: '-', cost: 0, currency: cur, category: 'Productivity', paymentType: 'Credit card', startDate: todayISO() }, cur), name: '' };
  }

  section(title) {
    new Setting(this.contentEl).setName(title).setHeading().setClass('st-modal-section');
  }

  onOpen() {
    const { contentEl } = this;
    const s = this.sub;
    contentEl.empty();
    contentEl.addClass('st-modal');
    this.titleEl.setText(this.isEdit ? s.name || 'Edit subscription' : 'Add subscription');

    const lifetime = isLifetime(s);
    const trial = isTrial(s);

    this.section('Service');
    new Setting(contentEl).setName('Name').addText((t) => {
      t.setPlaceholder('Streaming service').setValue(s.name).onChange((v) => (s.name = v));
      if (!this.isEdit) window.setTimeout(() => t.inputEl.focus(), 0);
    });
    new Setting(contentEl)
      .setName('Website')
      .setDesc('Used to show the service logo.')
      .addText((t) => t.setPlaceholder('example.com').setValue(s.url).onChange((v) => (s.url = v)));
    new Setting(contentEl)
      .setName('Plan')
      .addText((t) => t.setPlaceholder('Premium').setValue(s.plan).onChange((v) => (s.plan = v)));
    new Setting(contentEl).setName('Category').addDropdown((dd) => {
      CATEGORIES.forEach((c) => dd.addOption(c, c));
      dd.setValue(s.category).onChange((v) => (s.category = v));
    });

    this.section('Billing');
    new Setting(contentEl)
      .setName('Amount')
      .addText((t) => {
        t.setPlaceholder('0').setValue(s.cost ? String(s.cost) : '');
        t.inputEl.type = 'number';
        t.inputEl.inputMode = 'decimal';
        t.inputEl.step = 'any';
        t.inputEl.min = '0';
        t.onChange((v) => (s.cost = parseFloat(v) || 0));
      })
      .addDropdown((dd) => {
        Object.keys(CURRENCIES).forEach((c) => dd.addOption(c, `${c} ${CURRENCIES[c]}`));
        dd.setValue(s.currency).onChange((v) => (s.currency = v));
      });
    new Setting(contentEl).setName('Billing cycle').addDropdown((dd) => {
      Object.entries(BILLING_CYCLES).forEach(([k, v]) => dd.addOption(k, v.label));
      dd.setValue(s.billingCycle).onChange((v) => {
        s.billingCycle = v;
        if (v === 'lifetime') {
          s.autoRenew = false;
          s.renewalDate = '';
          if (s.status === 'trial') s.status = 'active';
        }
        this.onOpen();
      });
    });
    new Setting(contentEl).setName('Status').addDropdown((dd) => {
      dd.addOption('active', 'Active').addOption('paused', 'Paused').addOption('cancelled', 'Cancelled');
      if (!lifetime) dd.addOption('trial', 'Free trial');
      dd.setValue(s.status).onChange((v) => {
        s.status = v;
        if (v === 'trial' && !s.trialEndDate) s.trialEndDate = addDaysISO(TRIAL_WINDOW);
        this.onOpen();
      });
    });
    if (!lifetime && !trial) {
      new Setting(contentEl).setName('Next charge').addText((t) => {
        t.inputEl.type = 'date';
        t.setValue(s.renewalDate).onChange((v) => (s.renewalDate = v));
      });
      new Setting(contentEl)
        .setName('Renews automatically')
        .setDesc('The next charge date rolls forward once it passes.')
        .addToggle((tg) => tg.setValue(s.autoRenew).onChange((v) => (s.autoRenew = v)));
    }

    if (trial) {
      this.section('Trial');
      new Setting(contentEl)
        .setName('Trial ends')
        .setDesc(`Converts to ${fmt(s.cost, s.currency)}${fmtCycle(s.billingCycle)} unless cancelled.`)
        .setClass('st-trial-row')
        .addText((t) => {
          t.inputEl.type = 'date';
          t.setValue(s.trialEndDate || s.renewalDate).onChange((v) => (s.trialEndDate = v));
        });
      const chips = contentEl.createDiv({ cls: 'st-chip-row' });
      [['7 days', 7, 0], ['14 days', 14, 0], ['30 days', 30, 0], ['3 months', 0, 3]].forEach(([label, d, m]) => {
        chips.createEl('button', { text: '+' + label, cls: 'st-chip' }).addEventListener('click', () => {
          s.trialEndDate = addDaysISO(d, m);
          this.onOpen();
        });
      });
      if (this.isEdit) {
        const row = contentEl.createDiv({ cls: 'st-chip-row' });
        row.createEl('button', { text: 'Keep, convert to paid', cls: 'st-btn st-btn-keep' }).addEventListener('click', () => {
          this.close();
          this.plugin.keepTrial(s);
        });
        row.createEl('button', { text: 'Cancel trial', cls: 'st-btn st-btn-void' }).addEventListener('click', () => {
          this.close();
          this.plugin.cancelTrial(s);
        });
      }
    }

    this.section('Payment');
    new Setting(contentEl).setName('Method').addDropdown((dd) => {
      PAYMENT_TYPES.forEach((m) => dd.addOption(m, m));
      dd.setValue(s.paymentType).onChange((v) => (s.paymentType = v));
    });
    new Setting(contentEl)
      .setName('Account')
      .setDesc('Card ending, UPI ID, or bank.')
      .addText((t) => t.setPlaceholder('Visa ••4242').setValue(s.paymentAccount).onChange((v) => (s.paymentAccount = v)));

    this.section('Price history');
    const hist = contentEl.createDiv({ cls: 'st-carbon' });
    const renderHist = () => {
      hist.empty();
      if (!s.priceHistory.length) {
        hist.createDiv({ cls: 'st-muted', text: 'No price changes yet. Changing the amount logs one automatically.' });
      }
      s.priceHistory.forEach((p, idx) => {
        const cur = p.currency || s.currency;
        const row = hist.createDiv({ cls: 'st-carbon-row' });
        row.createSpan({ cls: 'st-carbon-date', text: p.date ? shortDate(p.date) : 'Earlier' });
        row.createSpan({ cls: 'st-carbon-fig', text: `${fmt(p.oldCost, cur)} → ${fmt(p.newCost, cur)}` });
        const pct = p.oldCost ? Math.round(((p.newCost - p.oldCost) / p.oldCost) * 100) : 0;
        if (pct) row.createSpan({ cls: pct > 0 ? 'st-up' : 'st-down', text: `${pct > 0 ? '+' : ''}${pct}%` });
        const del = row.createEl('button', { cls: 'st-icon-btn', attr: { 'aria-label': 'Remove record' } });
        setIcon(del, 'x');
        del.addEventListener('click', () => {
          s.priceHistory.splice(idx, 1);
          renderHist();
        });
      });
      // A change that happened before tracking started
      const add = hist.createDiv({ cls: 'st-carbon-add' });
      const input = add.createEl('input', { type: 'number', attr: { placeholder: 'Earlier amount', step: 'any', min: '0', 'aria-label': 'Earlier amount' } });
      add.createEl('button', { text: 'Log change', cls: 'st-btn' }).addEventListener('click', () => {
        const old = parseFloat(input.value);
        if (!isFinite(old)) return;
        s.priceHistory.push({ date: todayISO(), oldCost: old, newCost: s.cost, currency: s.currency });
        renderHist();
      });
    };
    renderHist();

    this.section('Notes');
    new Setting(contentEl).setClass('st-notes').addTextArea((ta) => {
      ta.setPlaceholder('Shared plan, contract terms, reminders…').setValue(s.notes).onChange((v) => (s.notes = v));
      ta.inputEl.rows = 3;
    });

    const actions = new Setting(contentEl).setClass('st-modal-actions');
    if (this.isEdit) {
      actions.addButton((b) => b.setButtonText('Delete').setWarning().onClick(() => {
        this.close();
        this.plugin.deleteSubscription(s.id);
      }));
      actions.addButton((b) => b.setButtonText('Duplicate').onClick(() => {
        this.close();
        this.plugin.duplicateSubscription(s);
      }));
    }
    actions.addButton((b) =>
      b.setButtonText(this.isEdit ? 'Save' : 'Add subscription').setCta().onClick(() => {
        if (!s.name.trim()) return new Notice('Enter a name for the subscription.');
        if (!(s.cost > 0)) return new Notice('Enter an amount greater than 0.');
        if (this.isEdit && this.originalCost && this.originalCost !== s.cost) {
          s.priceHistory.push({ date: todayISO(), oldCost: this.originalCost, newCost: s.cost, currency: s.currency });
        }
        s.name = s.name.trim();
        this.close();
        this.plugin.commit(s, this.isEdit ? `Saved ${s.name}` : `Added ${s.name}`);
      })
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ============================================================
// Import: pick a vault file, then merge or replace
// ============================================================
class ImportPicker extends FuzzySuggestModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.setPlaceholder('Choose a JSON backup or CSV file from your vault');
  }

  getItems() {
    return this.app.vault.getFiles().filter((f) => f.extension === 'json' || f.extension === 'csv');
  }

  getItemText(file) {
    return file.path;
  }

  onChooseItem(file) {
    this.plugin.importFrom(file);
  }
}

class ImportChoiceModal extends Modal {
  constructor(app, plugin, file, records) {
    super(app);
    this.plugin = plugin;
    this.file = file;
    this.records = records;
  }

  onOpen() {
    const { contentEl } = this;
    const n = this.records.length;
    this.titleEl.setText('Import subscriptions');
    contentEl.createEl('p', { text: `Found ${n} subscription${n === 1 ? '' : 's'} in ${this.file.name}.` });
    contentEl.createEl('p', {
      cls: 'st-muted',
      text: `Merge adds new ones and updates any with a matching ID. Replace swaps your current ${this.plugin.data.subscriptions.length} for these. Either can be undone right after.`,
    });
    const row = contentEl.createDiv({ cls: 'st-modal-buttons' });
    row.createEl('button', { text: 'Cancel' }).addEventListener('click', () => this.close());
    row.createEl('button', { text: 'Replace', cls: 'mod-warning' }).addEventListener('click', () => {
      this.close();
      this.plugin.applyImport(this.records, 'replace');
    });
    row.createEl('button', { text: 'Merge', cls: 'mod-cta' }).addEventListener('click', () => {
      this.close();
      this.plugin.applyImport(this.records, 'merge');
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ============================================================
// Dashboard view
// ============================================================
class DashboardView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.tab = 'subscriptions';    // 'subscriptions' | 'spend' | 'settings'
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.spendScope = 'monthly';   // 'monthly' | 'yearly'
    this.freshId = null;           // stub whose stamp just landed
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'Renewals'; }
  getIcon() { return ICON_ID; }

  async onOpen() {
    await this.plugin.checkAndAutoAdvance();
    this.render();
  }

  async onClose() {
    this.contentEl.empty();
  }

  get data() {
    return this.plugin.data;
  }

  get primary() {
    return this.data.primaryCurrency;
  }

  inPrimary(amount, currency) {
    return this.plugin.convert(amount, currency, this.primary);
  }

  render() {
    const root = this.contentEl;
    root.empty();
    root.addClass('st-root');
    const subs = this.data.subscriptions;
    const wrap = h('div', { cls: 'st-wrap' }, root);

    this.renderTopBar(wrap);
    if (this.tab === 'settings') this.renderSettings(wrap, subs);
    else if (!subs.length) this.renderEmpty(wrap);
    else {
      this.renderSummary(wrap, subs);
      if (this.tab === 'spend') this.renderSpend(wrap, subs);
      else this.renderSubscriptions(wrap, subs);
    }
    this.freshId = null;
  }

  // ── Top bar: title, tabs, currency, export, add ──
  renderTopBar(parent) {
    const bar = h('header', { cls: 'st-top' }, parent);
    const title = h('h2', { cls: 'st-title' }, bar);
    icon(ICON_ID, title).addClass('st-mark');
    h('span', { text: 'Renewals' }, title);

    const tabs = h('div', { cls: 'st-tabs' }, bar);
    tabs.setAttribute('role', 'tablist');
    [['subscriptions', 'Subscriptions'], ['spend', 'Spend'], ['settings', 'Settings']].forEach(([id, label]) => {
      const b = h('button', { cls: 'st-tab', text: label }, tabs);
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(this.tab === id));
      b.addEventListener('click', () => {
        this.tab = id;
        this.render();
      });
    });

    const tools = h('div', { cls: 'st-tools' }, bar);
    const cur = h('select', { cls: 'st-select dropdown' }, tools);
    cur.setAttribute('aria-label', 'Display currency');
    Object.keys(CURRENCIES).forEach((c) => {
      const o = h('option', { text: c }, cur);
      o.value = c;
      o.selected = c === this.primary;
    });
    cur.addEventListener('change', () => this.plugin.update({ primaryCurrency: cur.value }));

    const exp = h('button', { cls: 'st-icon-btn' }, tools);
    exp.setAttribute('aria-label', 'Export or import');
    setIcon(exp, 'download');
    exp.addEventListener('click', (e) => {
      const menu = new Menu();
      menu.addItem((i) => i.setTitle('Export backup (JSON)').setIcon('file-json').onClick(() => this.plugin.exportTo('json')));
      menu.addItem((i) => i.setTitle('Export spreadsheet (CSV)').setIcon('table').onClick(() => this.plugin.exportTo('csv')));
      menu.addItem((i) => i.setTitle('Import…').setIcon('upload').onClick(() => this.plugin.openImport()));
      menu.showAtMouseEvent(e);
    });

    const add = h('button', { cls: 'st-btn st-btn-cta mod-cta' }, tools);
    add.setAttribute('aria-label', 'Add subscription');
    icon('plus', add);
    h('span', { text: 'Add' }, add);
    add.addEventListener('click', () => this.plugin.openAddModal());
  }

  renderEmpty(parent) {
    const box = h('div', { cls: 'st-empty' }, parent);
    const c = h('div', { cls: 'st-coupon st-coupon-ghost' }, box);
    h('span', { text: 'No subscriptions yet' }, h('div', { cls: 'st-coupon-head' }, c));
    const body = h('div', { cls: 'st-coupon-body' }, c);
    h('p', { text: 'Add the services you pay for. Each becomes a coupon here, with whatever renews next on top.' }, body);
    const actions = h('div', { cls: 'st-chip-row' }, body);
    h('button', { cls: 'st-btn mod-cta', text: 'Add your first subscription' }, actions).addEventListener('click', () => this.plugin.openAddModal());
    h('button', { cls: 'st-btn', text: 'Import a backup' }, actions).addEventListener('click', () => this.plugin.openImport());
  }

  // ── Summary: due-in-7 figure, run-rate strip, budget ──
  renderSummary(parent, subs) {
    const due = upcoming(subs).filter((s) => s._days <= DUE_WINDOW);
    const dueTotal = due.reduce((n, s) => n + this.inPrimary(s.cost, s.currency), 0);

    let monthly = 0;
    let saved = 0;
    subs.forEach((s) => {
      if (isLifetime(s)) return;
      const m = this.inPrimary(toMonthly(s.cost, s.billingCycle), s.currency);
      if (!isLive(s)) saved += m;
      else if (!isTrial(s)) monthly += m;
    });

    const sum = h('section', { cls: 'st-summary' }, parent);
    const lead = h('div', { cls: 'st-lead' }, sum);
    h('div', { cls: 'st-lead-fig', text: fmt(dueTotal, this.primary) }, lead);
    const line = h('div', { cls: 'st-lead-line' }, lead);
    h('b', { text: `due in the next ${DUE_WINDOW} days` }, line);
    h('span', {
      text: due.length
        ? ` · ${due.length} charge${due.length === 1 ? '' : 's'} through ${shortDate(addDaysISO(DUE_WINDOW))}`
        : ' · nothing charges this week',
    }, line);

    const strip = h('div', { cls: 'st-strip' }, sum);
    const mField = field(strip, 'Monthly', fmt(monthly, this.primary));
    const budget = Number(this.data.monthlyBudget) || 0;
    if (budget > 0) {
      const ratio = monthly / budget;
      if (ratio > 1) mField.addClass('is-over');
      else if (ratio >= 0.9) mField.addClass('is-near');
      h('span', { cls: 'st-field-note', text: `${Math.round(ratio * 100)}% of ${fmt(budget, this.primary)}` }, mField);
    }
    field(strip, 'Annual', fmt(monthly * 12, this.primary));
    field(strip, 'Saved', fmt(saved, this.primary) + '/mo').addClass('is-saved');
  }

  // ── Subscriptions: trials, next coupons, filters, stubs ──
  renderSubscriptions(parent, subs) {
    const next = upcoming(subs);
    const trials = next.filter((s) => isTrial(s) && s._days <= TRIAL_WINDOW);
    const charges = next.filter((s) => !isTrial(s)).slice(0, COUPON_COUNT);

    if (trials.length) {
      const row = h('div', { cls: 'st-coupons' }, this.sectionHead(parent, 'Trials converting', String(trials.length)));
      trials.forEach((s) => this.renderCoupon(row, s, true));
    }
    if (charges.length) {
      const row = h('div', { cls: 'st-coupons' }, this.sectionHead(parent, 'Next charges', `next ${charges.length}`));
      charges.forEach((s) => this.renderCoupon(row, s, false));
    }

    const sec = h('section', { cls: 'st-section' }, parent);
    const head = h('div', { cls: 'st-section-head st-filter-head' }, sec);
    h('h3', { cls: 'st-section-title', text: 'All subscriptions' }, head);

    const search = h('label', { cls: 'st-search' }, head);
    icon('search', search);
    const input = h('input', null, search);
    input.type = 'search';
    input.placeholder = 'Search name, plan, notes, account';
    input.setAttribute('aria-label', 'Search subscriptions');
    input.value = this.searchQuery;

    const sort = h('select', { cls: 'st-sort dropdown' }, head);
    sort.setAttribute('aria-label', 'Sort subscriptions');
    [['date', 'Next charge'], ['amount', 'Amount'], ['name', 'Name']].forEach(([v, t]) => {
      const o = h('option', { text: t }, sort);
      o.value = v;
      o.selected = this.data.sortBy === v;
    });

    const pills = h('div', { cls: 'st-pills' }, sec);
    const counts = {
      all: subs.length,
      week: next.filter((s) => s._days <= DUE_WINDOW).length,
      'this-month': subs.filter((s) => isLive(s) && isThisMonth(chargeDate(s))).length,
      'next-month': subs.filter((s) => isLive(s) && isNextMonth(chargeDate(s))).length,
      active: subs.filter((s) => isLive(s) && !isTrial(s) && !isLifetime(s)).length,
      trial: subs.filter((s) => isLive(s) && isTrial(s)).length,
      lifetime: subs.filter((s) => isLifetime(s) && !isVoid(s)).length,
      void: subs.filter((s) => !isLive(s)).length,
    };
    const labels = {
      all: 'All', week: 'Next 7 days', 'this-month': 'This month', 'next-month': 'Next month',
      active: 'Active', trial: 'Trial', lifetime: 'Lifetime', void: 'Void & held',
    };
    Object.keys(labels).forEach((id) => {
      if (id !== 'all' && id !== this.activeFilter && !counts[id]) return;
      const p = h('button', { cls: 'st-pill' }, pills);
      p.setAttribute('aria-pressed', String(this.activeFilter === id));
      h('span', { text: labels[id] }, p);
      h('span', { cls: 'st-pill-count', text: String(counts[id]) }, p);
      p.addEventListener('click', () => {
        this.activeFilter = id;
        this.render();
      });
    });

    const grid = h('div', { cls: 'st-stubs' }, sec);
    const fill = () => this.renderStubs(grid, subs);
    input.addEventListener('input', () => {
      this.searchQuery = input.value.toLowerCase().trim();
      fill();
    });
    sort.addEventListener('change', async () => {
      this.data.sortBy = sort.value;
      await this.plugin.saveSettings();
      fill();
    });
    fill();
  }

  sectionHead(parent, title, aside) {
    const sec = h('section', { cls: 'st-section' }, parent);
    const head = h('div', { cls: 'st-section-head' }, sec);
    h('h3', { cls: 'st-section-title', text: title }, head);
    if (aside) h('span', { cls: 'st-muted', text: aside }, head);
    return sec;
  }

  // ── Coupon: one upcoming charge with fixed fields ──
  renderCoupon(parent, s, asTrial) {
    const src = s._src;
    const c = h('article', { cls: 'st-coupon' + (asTrial ? ' is-trial' : '') + (s._days <= 1 ? ' is-due' : '') }, parent);

    const head = h('div', { cls: 'st-coupon-head' }, c);
    h('span', { cls: 'st-coupon-when', text: whenLabel(s._days) }, head);
    h('span', { text: shortDate(chargeDate(s), true) }, head);

    const body = h('button', { cls: 'st-coupon-body' }, c);
    body.setAttribute('aria-label', `Edit ${s.name}`);
    body.addEventListener('click', () => this.plugin.openEditModal(src));
    const id = h('div', { cls: 'st-coupon-id' }, body);
    logo(s, id, this.data.showLogos);
    const nm = h('div', { cls: 'st-coupon-name' }, id);
    h('div', { cls: 'st-name', text: s.name }, nm);
    h('div', { cls: 'st-muted', text: s.plan || BILLING_CYCLES[s.billingCycle].label }, nm);

    const amt = h('div', { cls: 'st-amount' }, body);
    h('span', { cls: 'st-amount-fig', text: fmt(s.cost, s.currency) }, amt);
    if (s.currency !== this.primary) h('span', { cls: 'st-muted', text: '≈ ' + fmt(this.inPrimary(s.cost, s.currency), this.primary) }, amt);

    const fields = h('div', { cls: 'st-fields' }, c);
    field(fields, 'Cycle', BILLING_CYCLES[s.billingCycle].label);
    field(fields, 'Account', s.paymentAccount || s.paymentType);

    if (asTrial) {
      const act = h('div', { cls: 'st-coupon-actions' }, c);
      h('button', { cls: 'st-btn st-btn-keep', text: 'Keep' }, act).addEventListener('click', () => this.plugin.keepTrial(src));
      h('button', { cls: 'st-btn st-btn-void', text: 'Cancel trial' }, act).addEventListener('click', () => this.plugin.cancelTrial(src));
    }
  }

  matches(s) {
    const q = this.searchQuery;
    if (q && ![s.name, s.plan, s.notes, s.category, s.paymentType, s.paymentAccount].join(' ').toLowerCase().includes(q)) return false;
    switch (this.activeFilter) {
      case 'week': {
        const d = daysUntil(chargeDate(s));
        return isLive(s) && !isLifetime(s) && d >= 0 && d <= DUE_WINDOW;
      }
      case 'this-month': return isLive(s) && isThisMonth(chargeDate(s));
      case 'next-month': return isLive(s) && isNextMonth(chargeDate(s));
      case 'active': return isLive(s) && !isTrial(s) && !isLifetime(s);
      case 'trial': return isLive(s) && isTrial(s);
      case 'lifetime': return isLifetime(s) && !isVoid(s);
      case 'void': return !isLive(s);
      default: return true;
    }
  }

  // ── Stubs: every service, stamped by state ──
  renderStubs(grid, subs) {
    grid.empty();
    // Void and held always sink below what still charges
    const rank = (s) => (isVoid(s) ? 3 : isHeld(s) ? 2 : isLifetime(s) ? 1 : 0);
    const by = {
      date: (a, b) => daysUntil(chargeDate(a)) - daysUntil(chargeDate(b)),
      amount: (a, b) => this.inPrimary(b.cost, b.currency) - this.inPrimary(a.cost, a.currency),
    }[this.data.sortBy] || (() => 0);
    const list = subs.filter((s) => this.matches(s)).sort((a, b) => rank(a) - rank(b) || by(a, b) || a.name.localeCompare(b.name));

    if (!list.length) {
      const e = h('div', { cls: 'st-no-match' }, grid);
      h('span', { text: 'No subscriptions match.' }, e);
      h('button', { cls: 'st-link', text: 'Clear search and filters' }, e).addEventListener('click', () => {
        this.searchQuery = '';
        this.activeFilter = 'all';
        this.render();
      });
      return;
    }

    list.forEach((s) => {
      const st = stampOf(s);
      const b = h('button', { cls: 'st-stub' + (st ? ' is-' + st.cls : '') + (s.id === this.freshId ? ' is-fresh' : '') }, grid);
      b.addEventListener('click', () => this.plugin.openEditModal(s));
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.stubMenu(s, e);
      });
      logo(s, b, this.data.showLogos, 'st-logo st-logo-sm');

      const mid = h('span', { cls: 'st-stub-mid' }, b);
      h('span', { cls: 'st-name', text: s.name }, mid);
      let line;
      if (isVoid(s)) line = 'Cancelled';
      else if (isHeld(s)) line = 'Paused';
      else if (isLifetime(s)) line = 'Paid once';
      else if (isTrial(s)) line = `Trial ends ${shortDate(chargeDate(s))}`;
      else if (st && st.cls === 'paid') line = `Paid ${shortDate(s.lastPayment)}`;
      else line = chargeDate(s) ? `Next ${shortDate(chargeDate(s))}` : 'No date set';
      const lineEl = h('span', { cls: 'st-stub-line' }, mid);
      h('span', { cls: 'st-muted', text: line }, lineEl);

      const right = h('span', { cls: 'st-stub-amt' }, b);
      h('span', { cls: 'st-stub-fig', text: fmt(s.cost, s.currency) }, right);
      h('span', { cls: 'st-muted', text: fmtCycle(s.billingCycle) || 'once' }, right);

      const last = s.priceHistory[s.priceHistory.length - 1];
      if (last && last.oldCost && last.newCost > last.oldCost && isLive(s)) {
        const rise = h('span', { cls: 'st-up st-stub-rise' }, right);
        rise.setAttribute('aria-label', `Up from ${fmt(last.oldCost, last.currency || s.currency)}`);
        icon('trending-up', rise);
        h('span', { text: `+${Math.round(((last.newCost - last.oldCost) / last.oldCost) * 100)}%` }, rise);
      }

      // Void and held overprint the amount; the rest sit beside the subtitle
      if (st) h('span', { cls: 'st-stamp st-stamp-' + st.cls, text: st.text }, isLive(s) ? lineEl : b);
    });
  }

  stubMenu(s, e) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle('Edit').setIcon('pencil').onClick(() => this.plugin.openEditModal(s)));
    menu.addItem((i) => i.setTitle('Duplicate').setIcon('copy').onClick(() => this.plugin.duplicateSubscription(s)));
    if (isLive(s)) {
      menu.addItem((i) => i.setTitle('Pause').setIcon('pause').onClick(() => this.plugin.setStatus(s, 'paused')));
      menu.addItem((i) => i.setTitle('Cancel').setIcon('ban').onClick(() => this.plugin.setStatus(s, 'cancelled')));
    } else {
      menu.addItem((i) => i.setTitle('Reactivate').setIcon('play').onClick(() => this.plugin.setStatus(s, 'active')));
    }
    menu.addSeparator();
    menu.addItem((i) => i.setTitle('Delete').setIcon('trash-2').onClick(() => this.plugin.deleteSubscription(s.id)));
    menu.showAtMouseEvent(e);
  }

  // ── Spend: breakdowns by category and payment method ──
  renderSpend(parent, subs) {
    const yearly = this.spendScope === 'yearly';
    const suffix = yearly ? '/yr' : '/mo';
    const live = subs.filter((s) => isLive(s) && !isTrial(s) && !isLifetime(s));

    const sec = h('section', { cls: 'st-section' }, parent);
    const head = h('div', { cls: 'st-section-head' }, sec);
    h('h3', { cls: 'st-section-title', text: `Where it goes, ${live.length} active` }, head);
    const seg = h('div', { cls: 'st-seg' }, head);
    [['monthly', 'Monthly'], ['yearly', 'Annual']].forEach(([id, label]) => {
      const b = h('button', { text: label }, seg);
      b.setAttribute('aria-pressed', String(this.spendScope === id));
      b.addEventListener('click', () => {
        this.spendScope = id;
        this.render();
      });
    });

    const amountOf = (s) => this.inPrimary(yearly ? toYearly(s.cost, s.billingCycle) : toMonthly(s.cost, s.billingCycle), s.currency);
    const total = live.reduce((n, s) => n + amountOf(s), 0);
    const panels = h('div', { cls: 'st-panels' }, sec);

    const panel = (title, keyOf, colors) => {
      const groups = {};
      live.forEach((s) => {
        const g = (groups[keyOf(s)] = groups[keyOf(s)] || { amount: 0, count: 0 });
        g.amount += amountOf(s);
        g.count += 1;
      });
      const p = h('div', { cls: 'st-coupon st-panel' }, panels);
      const ph = h('div', { cls: 'st-coupon-head' }, p);
      h('span', { text: title }, ph);
      h('span', { text: fmt(total, this.primary) + suffix }, ph);
      const list = h('div', { cls: 'st-bars' }, p);
      Object.entries(groups)
        .sort((a, b) => b[1].amount - a[1].amount)
        .forEach(([k, g]) => {
          const pct = total > 0 ? (g.amount / total) * 100 : 0;
          const row = h('div', { cls: 'st-bar-row' }, list);
          row.setCssProps({ '--bar': colors[k] || CATEGORY_COLORS.Other, '--pct': pct.toFixed(1) + '%' });
          const lbl = h('span', { cls: 'st-bar-label' }, row);
          h('i', { cls: 'st-dot' }, lbl);
          h('span', { text: k }, lbl);
          h('span', { cls: 'st-muted', text: ` ${g.count} · ${Math.round(pct)}%` }, lbl);
          h('span', { cls: 'st-bar-fig', text: fmt(g.amount, this.primary) }, row);
          h('span', { cls: 'st-bar-fill' }, h('span', { cls: 'st-bar-track' }, row));
        });
    };
    panel('By category', (s) => s.category, CATEGORY_COLORS);
    panel('By payment method', (s) => s.paymentType, PAYMENT_TYPE_COLORS);

    h('p', { cls: 'st-muted st-rates', text: `Converted to ${this.primary} using rates from ${this.data.ratesDate || 'the built-in table'}.` }, sec);
  }

  // ── Settings, inside the app ──
  renderSettings(parent, subs) {
    const sec = h('section', { cls: 'st-section st-settings' }, parent);
    const panel = (title, aside) => {
      const p = h('div', { cls: 'st-coupon st-panel' }, sec);
      const head = h('div', { cls: 'st-coupon-head' }, p);
      h('span', { text: title }, head);
      if (aside) h('span', { text: aside }, head);
      return h('div', { cls: 'st-settings-body' }, p);
    };
    renderPreferences(panel('Preferences'), this.plugin, () => this.render());
    renderDataSettings(panel('Data', `${subs.length} subscription${subs.length === 1 ? '' : 's'}`), this.plugin);
  }
}

// ============================================================
// Code block embed: ```renewals``` in any note
// ============================================================
class RenewalsEmbed extends MarkdownRenderChild {
  constructor(el, plugin, days) {
    super(el);
    this.plugin = plugin;
    this.days = days;
  }

  onload() {
    this.plugin.embeds.add(this);
    this.render();
  }

  onunload() {
    this.plugin.embeds.delete(this);
  }

  render() {
    const { data } = this.plugin;
    const el = this.containerEl;
    el.empty();
    el.addClass('st-root', 'st-embed');
    const due = upcoming(data.subscriptions).filter((s) => s._days <= this.days);
    const total = due.reduce((n, s) => n + this.plugin.convert(s.cost, s.currency, data.primaryCurrency), 0);

    const c = h('div', { cls: 'st-coupon' }, el);
    const head = h('div', { cls: 'st-coupon-head' }, c);
    h('span', { text: `Renews in the next ${this.days} days` }, head);
    h('span', { text: fmt(total, data.primaryCurrency) }, head);
    const list = h('div', { cls: 'st-embed-list' }, c);

    if (!due.length) h('p', { cls: 'st-muted', text: `Nothing renews in the next ${this.days} days.` }, list);
    due.forEach((s) => {
      const row = h('button', { cls: 'st-embed-row' + (s._days <= 1 ? ' is-due' : '') }, list);
      row.addEventListener('click', () => this.plugin.openEditModal(s._src));
      h('span', { cls: 'st-embed-when', text: whenLabel(s._days) }, row);
      logo(s, row, data.showLogos, 'st-logo st-logo-sm');
      const nm = h('span', { cls: 'st-embed-name' }, row);
      h('span', { cls: 'st-name', text: s.name }, nm);
      if (isTrial(s)) h('span', { cls: 'st-stamp st-stamp-trial', text: 'Trial' }, nm);
      h('span', { cls: 'st-stub-fig', text: fmt(s.cost, s.currency) }, row);
    });

    h('button', { cls: 'st-link st-embed-open', text: 'Open Renewals' }, c)
      .addEventListener('click', () => this.plugin.activateView({ filter: 'week' }));
  }
}

// ============================================================
// Settings, shared by the in-app tab and the plugin settings screen
// ============================================================
function renderPreferences(el, plugin, redraw) {
  const { data } = plugin;

  new Setting(el)
    .setName('Display currency')
    .setDesc('Totals, budget, and conversions use this currency.')
    .addDropdown((dd) => {
      Object.keys(CURRENCIES).forEach((c) => dd.addOption(c, `${c} ${CURRENCIES[c]}`));
      dd.setValue(data.primaryCurrency).onChange((v) => plugin.update({ primaryCurrency: v }));
    });

  new Setting(el)
    .setName('Monthly budget')
    .setDesc('The monthly figure turns orange at 90% and red when over. Leave empty for no budget.')
    .addText((t) => {
      t.inputEl.type = 'number';
      t.inputEl.min = '0';
      t.setPlaceholder('No budget').setValue(data.monthlyBudget ? String(data.monthlyBudget) : '');
      // Commit on change, not every keystroke, so the view doesn't redraw mid-typing
      t.inputEl.addEventListener('change', () => plugin.update({ monthlyBudget: Math.max(0, parseFloat(t.getValue()) || 0) }));
    });

  new Setting(el)
    .setName('Renewal reminders')
    .setDesc('When the vault opens, list charges and trial conversions coming up within this many days. Shown once a day.')
    .addDropdown((dd) => {
      [['0', 'Off'], ['1', '1 day'], ['3', '3 days'], ['7', '7 days'], ['14', '14 days']].forEach(([v, t]) => dd.addOption(v, t));
      dd.setValue(String(data.reminderDays)).onChange((v) => plugin.update({ reminderDays: Number(v) }, false));
    });

  new Setting(el)
    .setName('Roll renewal dates forward')
    .setDesc('When an auto-renewing charge date passes, move it to the next cycle.')
    .addToggle((tg) => tg.setValue(data.autoAdvance).onChange((v) => plugin.update({ autoAdvance: v }, false)));

  new Setting(el)
    .setName('Show service logos')
    .setDesc('Fetches each service’s icon from Google’s favicon service using its website domain. Turn off to stay fully offline and show letters instead.')
    .addToggle((tg) => tg.setValue(data.showLogos).onChange((v) => plugin.update({ showLogos: v })));

  new Setting(el)
    .setName('Exchange rates')
    .setDesc(`Daily reference rates from the European Central Bank via the Frankfurter API, fetched at most once a day. Current rates: ${data.ratesDate || 'built-in table'}.`)
    .addButton((btn) =>
      btn.setButtonText('Refresh now').onClick(async () => {
        btn.setButtonText('Fetching…').setDisabled(true);
        const ok = await plugin.fetchExchangeRates(true);
        btn.setButtonText('Refresh now').setDisabled(false);
        new Notice(ok ? 'Exchange rates updated.' : 'Could not reach the rates service. Using cached rates.');
        if (ok) redraw();
      })
    );
}

function renderDataSettings(el, plugin) {
  new Setting(el)
    .setName('Export folder')
    .setDesc('Backups and spreadsheets are saved to this vault folder.')
    .addText((t) => {
      t.setPlaceholder('Renewals').setValue(plugin.data.exportFolder);
      t.inputEl.addEventListener('change', () => plugin.update({ exportFolder: t.getValue().trim() || 'Renewals' }, false));
    });

  new Setting(el)
    .setName('Export')
    .setDesc('A JSON backup (every record and rate) or a CSV for spreadsheets.')
    .addButton((b) => b.setButtonText('JSON').onClick(() => plugin.exportTo('json')))
    .addButton((b) => b.setButtonText('CSV').onClick(() => plugin.exportTo('csv')));

  new Setting(el)
    .setName('Import')
    .setDesc('Restore from a JSON backup or CSV file in your vault. You choose to merge or replace.')
    .addButton((b) => b.setButtonText('Choose file…').onClick(() => plugin.openImport()));
}

class RenewalsSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    renderPreferences(containerEl, this.plugin, () => this.display());
    new Setting(containerEl).setName('Data').setHeading();
    renderDataSettings(containerEl, this.plugin);
  }
}

// ============================================================
// Plugin
// ============================================================
class RenewalsPlugin extends Plugin {
  async onload() {
    const saved = (await this.loadData()) || {};
    this.data = Object.assign({}, DEFAULT_DATA, saved, { rates: Object.assign({}, DEFAULT_RATES, saved.rates) });
    const list = Array.isArray(saved.subscriptions) ? saved.subscriptions : [];
    this.data.subscriptions = list.map((s) => normalizeRecord(s, this.data.primaryCurrency)).filter(Boolean);
    this.embeds = new Set();

    addIcon(ICON_ID, ICON_SVG);
    this.registerView(VIEW_TYPE, (leaf) => new DashboardView(leaf, this));
    this.addRibbonIcon(ICON_ID, 'Open Renewals', () => this.activateView());
    this.addSettingTab(new RenewalsSettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor('renewals', (source, el, ctx) => {
      const days = parseInt((source.match(/days\s*:\s*(\d+)/i) || [])[1], 10);
      ctx.addChild(new RenewalsEmbed(el, this, days > 0 ? Math.min(days, 365) : DUE_WINDOW));
    });

    this.addCommand({ id: 'open-dashboard', name: 'Open dashboard', callback: () => this.activateView() });
    this.addCommand({ id: 'add-subscription', name: 'Add subscription', callback: () => this.openAddModal() });
    this.addCommand({ id: 'show-this-week', name: 'Show what renews this week', callback: () => this.activateView({ filter: 'week' }) });
    this.addCommand({ id: 'show-reminders', name: 'Show renewal reminders', callback: () => this.remind(true) });
    this.addCommand({ id: 'export-json', name: 'Export backup (JSON)', callback: () => this.exportTo('json') });
    this.addCommand({ id: 'export-csv', name: 'Export spreadsheet (CSV)', callback: () => this.exportTo('csv') });
    this.addCommand({ id: 'import', name: 'Import backup', callback: () => this.openImport() });
    this.addCommand({
      id: 'roll-dates-forward',
      name: 'Roll overdue renewal dates forward',
      callback: async () => {
        if (!(await this.checkAndAutoAdvance(true))) new Notice('No renewal dates needed rolling forward.');
      },
    });

    this.app.workspace.onLayoutReady(async () => {
      await this.checkAndAutoAdvance();
      await this.remind();
      this.fetchExchangeRates();
    });
  }

  async saveSettings() {
    await this.saveData(this.data);
  }

  /** Change settings, save, and optionally redraw */
  async update(patch, redraw = true) {
    Object.assign(this.data, patch);
    await this.saveSettings();
    if (redraw) this.refreshViews();
  }

  convert(amount, fromCur, toCur) {
    if (!amount) return 0;
    if (fromCur === toCur) return amount;
    const rates = this.data.rates;
    return Math.round((amount / (rates[fromCur] || 1)) * (rates[toCur] || 1) * 100) / 100;
  }

  async fetchExchangeRates(force = false) {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (!force && now - this.data.lastRatesFetch < ONE_DAY) return true;
    try {
      const res = await requestUrl({ url: 'https://api.frankfurter.dev/v1/latest?base=EUR' });
      const fetched = res.json?.rates;
      if (!fetched) return false;
      fetched.EUR = 1;
      if (fetched.USD) {
        // Pegged to the dollar and not published by the ECB
        fetched.AED = +(fetched.USD * 3.6725).toFixed(4);
        fetched.SAR = +(fetched.USD * 3.75).toFixed(4);
      }
      await this.update({ rates: Object.assign({}, DEFAULT_RATES, fetched), ratesDate: res.json.date || todayISO(), lastRatesFetch: now });
      return true;
    } catch (e) {
      return false;
    }
  }

  async checkAndAutoAdvance(manual = false) {
    if (!this.data.autoAdvance && !manual) return 0;
    const today = todayISO();
    let count = 0;
    this.data.subscriptions.forEach((sub) => {
      if (sub.status !== 'active' || !sub.autoRenew || isLifetime(sub) || !sub.renewalDate || sub.renewalDate >= today) return;
      for (let guard = 0; sub.renewalDate < today && guard < 600; guard++) {
        sub.lastPayment = sub.renewalDate;
        sub.renewalDate = advanceDate(sub.renewalDate, sub.billingCycle);
      }
      count++;
    });
    if (count) {
      await this.saveSettings();
      this.refreshViews();
      if (manual) new Notice(`Rolled ${count} renewal date${count === 1 ? '' : 's'} forward.`);
    }
    return count;
  }

  // ── Reminders ──
  async remind(force = false) {
    const days = this.data.reminderDays;
    const window = force ? days || DUE_WINDOW : days;
    if (!window || (!force && this.data.lastReminder === todayISO())) return;
    if (!force) await this.update({ lastReminder: todayISO() }, false);

    const due = upcoming(this.data.subscriptions).filter((s) => s._days <= window);
    if (!due.length) {
      if (force) new Notice(`Nothing renews in the next ${window} days.`);
      return;
    }
    const cur = this.data.primaryCurrency;
    const total = due.reduce((n, s) => n + this.convert(s.cost, s.currency, cur), 0);
    const notice = new Notice(createFragment((f) => {
      f.createEl('strong', { text: `${due.length} renewal${due.length === 1 ? '' : 's'} in the next ${window} days · ${fmt(total, cur)}` });
      const ul = f.createEl('ul', { cls: 'st-notice-list' });
      due.slice(0, 5).forEach((s) => {
        ul.createEl('li', { text: `${s.name} · ${fmt(s.cost, s.currency)} · ${isTrial(s) ? 'trial converts ' : ''}${whenLabel(s._days).toLowerCase()}` });
      });
      if (due.length > 5) f.createDiv({ text: `and ${due.length - 5} more` });
      f.createEl('button', { text: 'Open', cls: 'st-notice-btn' }).addEventListener('click', () => {
        notice.hide();
        this.activateView({ filter: 'week' });
      });
    }), 15000);
  }

  // ── Views ──
  async activateView(state) {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf('tab');
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await workspace.revealLeaf(leaf);
    if (state && leaf.view instanceof DashboardView) {
      leaf.view.tab = 'subscriptions';
      leaf.view.activeFilter = state.filter || 'all';
      leaf.view.render();
    }
  }

  refreshViews(freshId) {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
      if (leaf.view instanceof DashboardView) {
        leaf.view.freshId = freshId || null;
        leaf.view.render();
      }
    });
    this.embeds.forEach((e) => e.render());
  }

  // ── Mutations ──
  async commit(sub, message) {
    const list = this.data.subscriptions;
    const idx = list.findIndex((s) => s.id === sub.id);
    if (idx === -1) list.push(sub);
    else list[idx] = sub;
    await this.saveSettings();
    this.refreshViews(sub.id);
    if (message) new Notice(message);
  }

  /** A notice with an Undo button that restores a snapshot */
  notifyUndo(message, undo) {
    const notice = new Notice(createFragment((f) => {
      f.createSpan({ text: message });
      f.createEl('button', { text: 'Undo', cls: 'st-notice-btn' }).addEventListener('click', async () => {
        notice.hide();
        await undo();
      });
    }), UNDO_MS);
  }

  async replaceAll(list) {
    this.data.subscriptions = list;
    await this.saveSettings();
    this.refreshViews();
  }

  async setStatus(sub, status) {
    const before = { ...sub };
    await this.commit({ ...sub, status });
    const verb = { active: 'Reactivated', paused: 'Paused', cancelled: 'Cancelled' }[status];
    if (status === 'cancelled') this.notifyUndo(`${verb} ${sub.name}`, () => this.commit(before));
    else new Notice(`${verb} ${sub.name}`);
  }

  keepTrial(sub) {
    const renewalDate = sub.trialEndDate || sub.renewalDate;
    return this.commit({ ...sub, status: 'active', autoRenew: true, renewalDate, trialEndDate: '' }, `${sub.name} converts to paid on ${shortDate(renewalDate)}`);
  }

  async cancelTrial(sub) {
    const before = { ...sub };
    await this.commit({ ...sub, status: 'cancelled' });
    this.notifyUndo(`Cancelled the ${sub.name} trial before it charged`, () => this.commit(before));
  }

  duplicateSubscription(sub) {
    const copy = { ...sub, id: uid(), name: sub.name + ' (copy)', priceHistory: [], createdAt: new Date().toISOString() };
    return this.commit(copy, `Duplicated ${sub.name}`);
  }

  async deleteSubscription(id) {
    const before = [...this.data.subscriptions];
    const sub = before.find((s) => s.id === id);
    if (!sub) return;
    await this.replaceAll(before.filter((s) => s.id !== id));
    this.notifyUndo(`Deleted ${sub.name}`, () => this.replaceAll(before));
  }

  openAddModal() {
    new SubscriptionModal(this.app, this, null).open();
  }

  openEditModal(sub) {
    new SubscriptionModal(this.app, this, sub).open();
  }

  // ── Export / import through vault files, so both work on mobile ──
  async exportTo(ext) {
    const { vault } = this.app;
    const folder = normalizePath(this.data.exportFolder || 'Renewals');
    const path = normalizePath(`${folder}/renewals-${todayISO()}.${ext}`);
    const subs = this.data.subscriptions;
    const content = ext === 'json'
      ? JSON.stringify({ exportedAt: new Date().toISOString(), schema: 2, primaryCurrency: this.data.primaryCurrency, ratesDate: this.data.ratesDate, rates: this.data.rates, subscriptions: subs }, null, 2)
      : [CSV_COLUMNS.join(','), ...subs.map((s) => CSV_COLUMNS.map((c) => csvCell(s[c])).join(','))].join('\n');
    try {
      if (!vault.getAbstractFileByPath(folder)) await vault.createFolder(folder);
      const existing = vault.getAbstractFileByPath(path);
      if (existing instanceof TFile) await vault.modify(existing, content);
      else await vault.create(path, content);
      new Notice(`Exported ${subs.length} subscriptions to ${path}`);
    } catch (e) {
      new Notice(`Export failed: ${e.message}`);
    }
  }

  openImport() {
    new ImportPicker(this.app, this).open();
  }

  async importFrom(file) {
    let records;
    try {
      records = parseBackup(await this.app.vault.read(file), file.extension)
        .map((r) => normalizeRecord(r, this.data.primaryCurrency))
        .filter(Boolean);
    } catch (e) {
      new Notice(`Could not read ${file.name}: ${e.message}`);
      return;
    }
    if (!records.length) {
      new Notice(`No subscriptions found in ${file.name}.`);
      return;
    }
    new ImportChoiceModal(this.app, this, file, records).open();
  }

  async applyImport(records, mode) {
    const before = [...this.data.subscriptions];
    let next = records;
    if (mode === 'merge') {
      const byId = new Map(before.map((s) => [s.id, s]));
      records.forEach((r) => byId.set(r.id, r));
      next = [...byId.values()];
    }
    await this.replaceAll(next);
    this.notifyUndo(mode === 'merge' ? `Merged ${records.length} subscriptions` : `Replaced with ${records.length} subscriptions`, () => this.replaceAll(before));
  }
}

module.exports = RenewalsPlugin;
