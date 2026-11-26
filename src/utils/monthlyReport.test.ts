import { describe, expect, it } from 'vitest';
import { buildMonthlyCsv, buildMonthlyReportHtml } from './monthlyReport';
import { Transaction } from '../types';

const sample: Transaction = {
  id: 'x', type: 'expense', amount: 25, date: '2026-11-02', createdAt: '2026-11-02', note: '=2+2',
};

describe('monthly report exports', () => {
  it('exports CSV with formula-like user text neutralized and quoted', () => {
    const csv = buildMonthlyCsv({ month: '2026-11', monthLabel: 'November', income: 0, expenses: 25, net: -25, transactions: [sample], language: 'en' });
    expect(csv).toContain('"\'=2+2"');
    expect(csv).toContain('"Date","Type","Description","Amount"');
  });

  it('escapes user content and keeps Arabic reports RTL', () => {
    const html = buildMonthlyReportHtml({ month: '2026-11', monthLabel: 'November', income: 0, expenses: 25, net: -25, transactions: [{ ...sample, note: '<script>alert(1)</script>' }], language: 'ar' });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<td><script>');
  });
});
