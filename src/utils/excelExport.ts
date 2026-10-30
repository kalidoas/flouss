import * as XLSX from 'xlsx';
import { Category, IncomeSource, Language, Transaction } from '../types';
import {
  calculateAvailableBalance,
  calculateTotalSavingsInGoals,
} from './calculations';
import { formatMAD, formatDateTime, getTodayDateStr } from './formatters';
import {
  getCategoryName,
  getSubCategoryName,
  getIncomeSourceName,
  getIncomeSubSourceName,
} from './i18nHelpers';

interface ExcelExportParams {
  initialBalance: number | null;
  transactions: Transaction[];
  categories: Category[];
  incomeSources: IncomeSource[];
  language?: Language;
}

export function exportToExcel({
  initialBalance,
  transactions,
  categories,
  incomeSources,
  language = 'fr',
}: ExcelExportParams): void {
  const wb = XLSX.utils.book_new();

  const balance = calculateAvailableBalance(initialBalance, transactions);
  const totalSavings = calculateTotalSavingsInGoals(categories, transactions);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalContributions = transactions
    .filter((t) => t.type === 'contribution')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.min(100, Math.round((totalContributions / totalIncome) * 100)))
      : 0;

  // Localized Sheet Titles
  const sheetTitles = {
    fr: {
      summary: 'Synthèse',
      expenses: 'Dépenses',
      income: 'Revenus',
      savings: 'Épargne',
    },
    ar: {
      summary: 'ملخص الحساب',
      expenses: 'المصاريف',
      income: 'المداخيل',
      savings: 'الادخار',
    },
    en: {
      summary: 'Summary',
      expenses: 'Expenses',
      income: 'Income',
      savings: 'Savings',
    },
  }[language];

  // 1. Synthèse Sheet
  const summaryHeaders = {
    fr: ['Indicateur Financier', 'Valeur (MAD / %)'],
    ar: ['المؤشر المالي', 'القيمة (د.م. / %)'],
    en: ['Financial Metric', 'Value (MAD / %)'],
  }[language];

  const summaryData = [
    summaryHeaders,
    [
      language === 'ar' ? 'الرصيد المتاح حالياً' : language === 'en' ? 'Available Balance' : 'Solde disponible actuel',
      formatMAD(balance, false, language),
    ],
    [
      language === 'ar' ? 'الرصيد الأولي المقفول' : language === 'en' ? 'Locked Initial Balance' : 'Solde initial verrouillé',
      formatMAD(initialBalance, false, language),
    ],
    [
      language === 'ar' ? 'إجمالي المداخيل' : language === 'en' ? 'Total Income' : 'Total des revenus',
      formatMAD(totalIncome, false, language),
    ],
    [
      language === 'ar' ? 'إجمالي المصاريف' : language === 'en' ? 'Total Expenses' : 'Total des dépenses',
      formatMAD(totalExpense, false, language),
    ],
    [
      language === 'ar' ? 'إجمالي المدخرات في الأهداف' : language === 'en' ? 'Total Saved in Goals' : 'Total épargné dans les objectifs',
      formatMAD(totalSavings, false, language),
    ],
    [
      language === 'ar' ? 'نسبة الادخار الإجمالية' : language === 'en' ? 'Overall Savings Rate' : 'Taux d’épargne global',
      `${savingsRate}%`,
    ],
    [
      language === 'ar' ? 'تاريخ التصدير' : language === 'en' ? 'Export Date' : 'Date d’exportation',
      new Date().toLocaleString(language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR'),
    ],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, sheetTitles.summary);

  // 2. Dépenses Sheet
  const expensesHeaders = {
    fr: ['Date', 'Catégorie', 'Sous-catégorie', 'Montant (MAD)', 'Montant Numérique', 'Note'],
    ar: ['التاريخ', 'الفئة', 'الفئة الفرعية', 'المبلغ (د.م.)', 'القيمة الرقمية', 'ملاحظات'],
    en: ['Date', 'Category', 'Sub-category', 'Amount (MAD)', 'Raw Amount', 'Note'],
  }[language];

  const expenseRows = transactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const sub = cat?.subcategories?.find((s) => s.id === t.subCategoryId);
      return [
        formatDateTime(t.date, language),
        cat ? getCategoryName(cat, language) : '-',
        sub ? getSubCategoryName(sub, language) : '-',
        formatMAD(t.amount, false, language),
        t.amount,
        t.note || '',
      ];
    });

  const wsExpenses = XLSX.utils.aoa_to_sheet([expensesHeaders, ...expenseRows]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, sheetTitles.expenses);

  // 3. Revenus Sheet
  const incomeHeaders = {
    fr: ['Date', 'Source', 'Type / Sous-source', 'Montant (MAD)', 'Montant Numérique', 'Récurrent', 'Note'],
    ar: ['التاريخ', 'المصدر', 'النوع / فرع الدخل', 'المبلغ (د.م.)', 'القيمة الرقمية', 'دوري', 'ملاحظات'],
    en: ['Date', 'Source', 'Sub-source / Type', 'Amount (MAD)', 'Raw Amount', 'Recurring', 'Note'],
  }[language];

  const incomeRows = transactions
    .filter((t) => t.type === 'income')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => {
      const src = incomeSources.find((s) => s.id === t.sourceId);
      const sub = src?.subcategories?.find((s) => s.id === t.incomeSubSourceId);
      return [
        formatDateTime(t.date, language),
        src ? getIncomeSourceName(src, language) : '-',
        sub ? getIncomeSubSourceName(sub, language) : '-',
        formatMAD(t.amount, false, language),
        t.amount,
        t.isRecurring ? (language === 'ar' ? 'نعم' : language === 'en' ? 'Yes' : 'Oui') : '-',
        t.note || '',
      ];
    });

  const wsIncome = XLSX.utils.aoa_to_sheet([incomeHeaders, ...incomeRows]);
  XLSX.utils.book_append_sheet(wb, wsIncome, sheetTitles.income);

  // 4. Épargne Sheet
  const savingsHeaders = {
    fr: ['Date', 'Objectif / Projet', 'Type d’opération', 'Montant (MAD)', 'Montant Numérique', 'Note'],
    ar: ['التاريخ', 'الهدف / المشروع', 'نوع المعاملة', 'المبلغ (د.م.)', 'القيمة الرقمية', 'ملاحظات'],
    en: ['Date', 'Goal / Project', 'Operation Type', 'Amount (MAD)', 'Raw Amount', 'Note'],
  }[language];

  const savingsRows = transactions
    .filter((t) => t.type === 'contribution' || t.type === 'goal_withdraw')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const opType =
        t.type === 'contribution'
          ? language === 'ar'
            ? 'إيداع ادخار'
            : language === 'en'
            ? 'Deposit'
            : 'Versement épargne'
          : language === 'ar'
          ? 'استرداد للرصيد'
          : language === 'en'
          ? 'Withdrawal'
          : 'Retrait vers solde';
      return [
        formatDateTime(t.date, language),
        cat ? getCategoryName(cat, language) : '-',
        opType,
        formatMAD(t.amount, false, language),
        t.amount,
        t.note || '',
      ];
    });

  const wsSavings = XLSX.utils.aoa_to_sheet([savingsHeaders, ...savingsRows]);
  XLSX.utils.book_append_sheet(wb, wsSavings, sheetTitles.savings);

  // Auto-fit column widths slightly for aesthetics
  [wsSummary, wsExpenses, wsIncome, wsSavings].forEach((ws) => {
    ws['!cols'] = [
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
      { wch: 18 },
      { wch: 16 },
      { wch: 35 },
    ];
  });

  // Generate file and trigger browser download
  const dateStr = getTodayDateStr();
  const filename = `flouss_export_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
