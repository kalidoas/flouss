import { Language, Transaction } from '../types';

export interface MonthlyReportData {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
  transactions: Transaction[];
  language: Language;
}

const copy = (language: Language) => language === 'ar'
  ? { date: 'التاريخ', type: 'النوع', note: 'الوصف', amount: 'المبلغ', income: 'الدخل', expense: 'المصروف', net: 'الصافي', title: 'التقرير المالي الشهري' }
  : language === 'fr'
    ? { date: 'Date', type: 'Type', note: 'Description', amount: 'Montant', income: 'Revenus', expense: 'Dépenses', net: 'Net', title: 'Rapport financier mensuel' }
    : { date: 'Date', type: 'Type', note: 'Description', amount: 'Amount', income: 'Income', expense: 'Expense', net: 'Net', title: 'Monthly financial report' };

const csvCell = (value: string | number): string => {
  const text = String(value);
  // Prefix spreadsheet formula starters so user-entered notes remain inert in spreadsheet apps.
  const safe = /^[=+@\-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function buildMonthlyCsv(data: MonthlyReportData): string {
  const labels = copy(data.language);
  const rows: Array<Array<string | number>> = [
    [labels.date, labels.type, labels.note, labels.amount],
    ...data.transactions.map((tx) => [tx.date, tx.type, tx.note || '', tx.amount]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] || character));

export function buildMonthlyReportHtml(data: MonthlyReportData): string {
  const labels = copy(data.language);
  const rtl = data.language === 'ar';
  const locale = data.language === 'ar' ? 'ar-MA' : data.language === 'fr' ? 'fr-MA' : 'en-MA';
  const money = (amount: number) => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} MAD`;
  const rows = data.transactions.map((tx) => `<tr><td>${escapeHtml(tx.date.slice(0, 10))}</td><td>${escapeHtml(tx.type)}</td><td>${escapeHtml(tx.note || '')}</td><td>${money(tx.amount)}</td></tr>`).join('');
  return `<!doctype html><html lang="${data.language}" dir="${rtl ? 'rtl' : 'ltr'}"><meta charset="utf-8"><title>${escapeHtml(labels.title)}</title><style>body{font:15px system-ui,sans-serif;color:#18201d;margin:40px}h1{font-size:28px}p{color:#53615b}.summary{display:flex;gap:24px;margin:28px 0}.summary div{border:1px solid #dce3df;border-radius:12px;padding:16px;flex:1}.label{font-size:12px;color:#65726c}table{border-collapse:collapse;width:100%}th,td{text-align:start;border-bottom:1px solid #e4e9e6;padding:10px 8px}th{color:#53615b}@media print{body{margin:12mm}}</style><body><h1>${escapeHtml(labels.title)}</h1><p>${escapeHtml(data.monthLabel)}</p><section class="summary"><div><span class="label">${labels.income}</span><h2>${money(data.income)}</h2></div><div><span class="label">${labels.expense}</span><h2>${money(data.expenses)}</h2></div><div><span class="label">${labels.net}</span><h2>${money(data.net)}</h2></div></section><table><thead><tr><th>${labels.date}</th><th>${labels.type}</th><th>${labels.note}</th><th>${labels.amount}</th></tr></thead><tbody>${rows}</tbody></table><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),200))</script></body></html>`;
}
