// Fictional demo data for the preview and README screenshots.
// Dates are relative to today so the demo always looks current.
(function () {
  'use strict';

  function iso(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // [name, plan, cost, currency, cycle, category, status, days until charge, payment type, account, extra]
  const rows = [
    ['Streamly', 'Premium 4K', 22.99, 'USD', 'monthly', 'Entertainment', 'active', 0, 'Credit card', 'Visa ••4242', { priceHistory: [{ date: iso(-60), oldCost: 19.99, newCost: 22.99 }] }],
    ['Northwind Cloud', '2 TB', 9.99, 'USD', 'monthly', 'Cloud', 'active', 1, 'Mobile wallet', 'Phone wallet'],
    ['Lumen Notes', 'Plus', 8, 'USD', 'monthly', 'Productivity', 'active', 1, 'Credit card', 'Visa ••4242'],
    ['Pixelforge', 'Pro', 15, 'USD', 'monthly', 'Tools', 'trial', 2, 'Credit card', 'Mastercard ••8810'],
    ['Greengrocer Box', 'Family box', 25, 'USD', 'weekly', 'Grocery', 'active', 2, 'Debit card', 'Checking ••1180'],
    ['Tunebox', 'Family', 16.99, 'USD', 'monthly', 'Entertainment', 'active', 3, 'Direct debit', 'Checking ••1180'],
    ['Harbor VPN', '1 year', 59.88, 'USD', 'yearly', 'Utilities', 'active', 4, 'Online payment service', 'billing@example.com'],
    ['Quill Writer', 'Pro', 20, 'USD', 'monthly', 'Productivity', 'trial', 5, 'Credit card', 'Visa ••4242'],
    ['Fieldnote Weekly', 'Supporter', 6, 'GBP', 'monthly', 'Education', 'active', 6, 'Credit card', 'Visa ••4242'],
    ['Coffee Club', 'Two bags', 12, 'USD', 'weekly', 'Grocery', 'active', 6, 'Debit card', 'Checking ••1180', { lastPayment: iso(-1) }],
    ['Home Internet', 'Fiber 500', 59, 'USD', 'monthly', 'Utilities', 'active', 8, 'Direct debit', 'Checking ••1180'],
    ['Fitloop', 'Coach', 12.99, 'USD', 'monthly', 'Health', 'active', 9, 'Mobile wallet', 'Phone wallet'],
    ['Phone Plan', 'Unlimited', 35, 'USD', 'monthly', 'Communication', 'active', 10, 'Direct debit', 'Checking ••1180'],
    ['Ledgerly', 'Business', 29, 'USD', 'monthly', 'Finance', 'active', 12, 'Credit card', 'Mastercard ••8810', { priceHistory: [{ date: iso(-90), oldCost: 25, newCost: 29 }] }],
    ['CodeHarbor', 'Team, 4 seats', 44, 'USD', 'monthly', 'Tools', 'active', 14, 'Credit card', 'Mastercard ••8810'],
    ['Hostfox', 'VPS', 24, 'EUR', 'monthly', 'Cloud', 'active', 16, 'Bank transfer', 'Savings ••0042'],
    ['Chatterly', 'Pro', 8.75, 'USD', 'monthly', 'Communication', 'active', 18, 'Credit card', 'Visa ••4242'],
    ['Daily Courier', 'Digital', 17, 'USD', 'monthly', 'Finance', 'active', 21, 'Credit card', 'Visa ••4242'],
    ['Language Lab', 'Plus', 12.99, 'USD', 'monthly', 'Education', 'active', 27, 'Mobile wallet', 'Phone wallet'],
    ['Sky Storage', '5 TB', 99, 'USD', 'yearly', 'Cloud', 'active', 45, 'Credit card', 'Visa ••4242'],
    ['Mindful Minutes', 'Annual', 69.99, 'USD', 'yearly', 'Health', 'active', 70, 'Mobile wallet', 'Phone wallet'],
    ['Studio Fonts', 'Lifetime licence', 89, 'USD', 'lifetime', 'Tools', 'active', null, 'Credit card', 'Visa ••4242'],
    ['Snapclip', 'Lifetime', 29, 'USD', 'lifetime', 'Tools', 'active', null, 'Online payment service', 'billing@example.com'],
    ['Gamebox Pass', 'Ultimate', 14.99, 'USD', 'monthly', 'Entertainment', 'paused', 11, 'Credit card', 'Visa ••4242'],
    ['Readwell', 'Monthly', 9.99, 'USD', 'monthly', 'Education', 'cancelled', null, 'Credit card', 'Visa ••4242'],
    ['Moviehall', 'Standard', 11.99, 'USD', 'monthly', 'Entertainment', 'cancelled', null, 'Credit card', 'Visa ••4242'],
  ];

  window.__demoData = () => ({
    primaryCurrency: 'USD',
    reminderDays: 3,
    showLogos: false,
    monthlyBudget: 700,
    lastReminder: iso(0),
    ratesDate: iso(-1),
    subscriptions: rows.map(([name, plan, cost, currency, billingCycle, category, status, days, paymentType, paymentAccount, extra], i) => ({
      id: 'demo-' + i,
      name, plan, cost, currency, billingCycle, category, status, paymentType, paymentAccount,
      autoRenew: billingCycle !== 'lifetime',
      renewalDate: days == null || status === 'trial' ? '' : iso(days),
      trialEndDate: status === 'trial' ? iso(days) : '',
      startDate: iso(-200),
      ...(extra || {}),
    })),
  });
})();
