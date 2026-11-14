import { Category, DebtItem, IncomeSource, Language, NoteItem, ProgramTrack, SubscriptionItem, TaskItem, Transaction } from '../types';
import { calculateAvailableBalance } from './calculations';
import { getTodayDateStr } from './formatters';
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
  selectedPeriod?: { from?: string; to?: string };
  tasks?: TaskItem[];
  programTracks?: ProgramTrack[];
  debts?: DebtItem[];
  subscriptions?: SubscriptionItem[];
  notes?: NoteItem[];
  goals?: Category[];
  currency?: string;
}

const label = (language: Language, en: string, fr: string, ar: string): string =>
  language === 'ar' ? ar : language === 'fr' ? fr : en;

const toDate = (value: string): Date => {
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const formatDateCell = (value: string): string => value.includes('T') ? value.slice(0, 10) : value;
const formatTimeCell = (value: string): string => value.includes('T') ? value.slice(11, 16) : '';
const monthOf = (value: string): string => formatDateCell(value).slice(0, 7);

function transactionRows(
  transactions: Transaction[],
  categories: Category[],
  incomeSources: IncomeSource[],
  language: Language,
  initialBalance: number | null,
) {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  let runningBalance = Number(initialBalance || 0);
  return sorted.map((transaction) => {
    const category = categories.find((item) => item.id === transaction.categoryId);
    const subcategory = category?.subcategories?.find((item) => item.id === transaction.subCategoryId);
    const source = incomeSources.find((item) => item.id === transaction.sourceId);
    const incomeSubSource = source?.subcategories?.find((item) => item.id === transaction.incomeSubSourceId);
    const signedAmount = transaction.type === 'income' || transaction.type === 'goal_withdraw'
      ? transaction.amount
      : -transaction.amount;
    runningBalance += signedAmount;
    const date = toDate(transaction.date);
    return [
      formatDateCell(transaction.date),
      formatTimeCell(transaction.date),
      date.toLocaleDateString(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' }),
      transaction.type,
      category ? getCategoryName(category, language) : source ? getIncomeSourceName(source, language) : '',
      subcategory ? getSubCategoryName(subcategory, language) : incomeSubSource ? getIncomeSubSourceName(incomeSubSource, language) : '',
      transaction.note || '',
      transaction.amount,
      signedAmount,
      runningBalance,
      transaction.type === 'adjustment' || transaction.type === 'contribution' || transaction.type === 'goal_withdraw' ? 'Yes' : 'No',
    ];
  });
}

function applySheetLayout(XLSX: any, sheet: any, freezeRows = 1): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const widths: number[] = [];
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    let maxLength = 12;
    for (let row = range.s.r; row <= Math.min(range.e.r, range.s.r + 250); row += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      maxLength = Math.max(maxLength, String(cell?.v ?? '').length);
    }
    widths.push(Math.min(42, Math.max(10, maxLength + 2)));
  }
  sheet['!cols'] = widths.map((wch) => ({ wch }));
  sheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  sheet['!freeze'] = { xSplit: 0, ySplit: freezeRows };
  if (typeof document !== 'undefined' && document.documentElement.dir === 'rtl') {
    sheet['!sheetView'] = [{ rightToLeft: true }];
  }
}

function applyNumberFormats(XLSX: any, sheet: any, currencyFormat: string): void {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (cell && typeof cell.v === 'number') cell.z = currencyFormat;
    }
  }
}

export async function exportToExcel({
  initialBalance,
  transactions,
  categories,
  incomeSources,
  language = 'fr',
  selectedPeriod,
  tasks = [],
  programTracks = [],
  debts = [],
  subscriptions = [],
  notes = [],
  goals = categories.filter((category) => category.isGoal),
  currency = 'MAD',
}: ExcelExportParams): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const currencyFormat = `#,##0.00 "${currency}"`;
  const inPeriod = (transaction: Transaction) => {
    const date = formatDateCell(transaction.date);
    return (!selectedPeriod?.from || date >= selectedPeriod.from) && (!selectedPeriod?.to || date <= selectedPeriod.to);
  };
  const scopedTransactions = transactions.filter(inPeriod);
  const allRows = transactionRows(scopedTransactions, categories, incomeSources, language, initialBalance);
  const income = scopedTransactions.filter((transaction) => transaction.type === 'income');
  const expenses = scopedTransactions.filter((transaction) => transaction.type === 'expense');
  const totalIncome = income.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpenses = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const net = totalIncome - totalExpenses;
  const balance = calculateAvailableBalance(initialBalance, scopedTransactions);
  const periodLabel = selectedPeriod?.from || selectedPeriod?.to
    ? `${selectedPeriod.from || 'Beginning'} → ${selectedPeriod.to || 'Today'}`
    : label(language, 'All time', 'Toutes périodes', 'كل الفترة');
  const sheetName = (en: string, fr: string, ar: string) => label(language, en, fr, ar).slice(0, 31);
  const append = (name: string, rows: unknown[][], formats = true) => {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    applySheetLayout(XLSX, sheet);
    if (formats) applyNumberFormats(XLSX, sheet, currencyFormat);
    XLSX.utils.book_append_sheet(wb, sheet, name);
    return sheet;
  };

  const summaryRows: unknown[][] = [
    [label(language, 'Metric', 'Indicateur', 'المؤشر'), label(language, 'Value', 'Valeur', 'القيمة'), label(language, 'Scope', 'Périmètre', 'النطاق')],
    [label(language, 'Balance', 'Solde', 'الرصيد'), balance, periodLabel],
    [label(language, 'Initial balance', 'Solde initial', 'الرصيد الأولي'), Number(initialBalance || 0), label(language, 'All time', 'Toutes périodes', 'كل الفترة')],
    [label(language, 'Income', 'Revenus', 'المداخيل'), totalIncome, periodLabel],
    [label(language, 'Expenses', 'Dépenses', 'المصاريف'), totalExpenses, periodLabel],
    [label(language, 'Net', 'Net', 'الصافي'), net, periodLabel],
    [label(language, 'Savings rate', 'Taux d’épargne', 'معدل الادخار'), totalIncome > 0 ? net / totalIncome : 0, periodLabel],
    [label(language, 'Goals', 'Objectifs', 'الأهداف'), goals.length, label(language, 'All time', 'Toutes périodes', 'كل الفترة')],
    [label(language, 'Top category', 'Catégorie principale', 'الفئة الأولى'), categories.map((category) => [category.name, expenses.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0)]).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '', periodLabel],
    [label(language, 'Top 5 expenses', 'Top 5 dépenses', 'أكبر 5 مصاريف'), expenses.sort((a, b) => b.amount - a.amount).slice(0, 5).map((item) => item.note || item.id).join(' | '), periodLabel],
    [label(language, 'Biggest day', 'Jour le plus dépensier', 'أكبر يوم إنفاقاً'), Object.entries(expenses.reduce<Record<string, number>>((acc, item) => { const date = formatDateCell(item.date); acc[date] = (acc[date] || 0) + item.amount; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '', periodLabel],
  ];
  const summarySheet = append(sheetName('Summary', 'Synthèse', 'الملخص'), summaryRows, false);
  applyNumberFormats(XLSX, summarySheet, currencyFormat);

  append(sheetName('Transactions', 'Transactions', 'المعاملات'), [[
    label(language, 'Date', 'Date', 'التاريخ'), label(language, 'Time', 'Heure', 'الوقت'), label(language, 'Weekday', 'Jour', 'اليوم'), label(language, 'Type', 'Type', 'النوع'), label(language, 'Category', 'Catégorie', 'الفئة'), label(language, 'Subcategory', 'Sous-catégorie', 'الفئة الفرعية'), label(language, 'Note', 'Note', 'ملاحظة'), label(language, 'Amount', 'Montant', 'المبلغ'), label(language, 'Signed amount', 'Montant signé', 'المبلغ الموقع'), label(language, 'Running balance', 'Solde cumulé', 'الرصيد التراكمي'), label(language, 'Adjustment/transfer', 'Régularisation/transfert', 'تسوية/تحويل'),
  ], ...allRows]);

  const detailRows = (items: Transaction[], kind: 'expense' | 'income') => {
    const rows = items.sort((a, b) => a.date.localeCompare(b.date)).map((item) => {
      const category = categories.find((entry) => entry.id === item.categoryId);
      const source = incomeSources.find((entry) => entry.id === item.sourceId);
      const subcategory = category?.subcategories?.find((entry) => entry.id === item.subCategoryId);
      const incomeSubSource = source?.subcategories?.find((entry) => entry.id === item.incomeSubSourceId);
      return [formatDateCell(item.date), formatTimeCell(item.date), category ? getCategoryName(category, language) : source ? getIncomeSourceName(source, language) : '', subcategory ? getSubCategoryName(subcategory, language) : incomeSubSource ? getIncomeSubSourceName(incomeSubSource, language) : '', item.note || '', item.amount];
    });
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return [[label(language, 'Date', 'Date', 'التاريخ'), label(language, 'Time', 'Heure', 'الوقت'), label(language, 'Category/Source', 'Catégorie/Source', 'الفئة/المصدر'), label(language, 'Subcategory', 'Sous-catégorie', 'الفئة الفرعية'), label(language, 'Note', 'Note', 'ملاحظة'), label(language, 'Amount', 'Montant', 'المبلغ')], ...rows, [label(language, 'TOTAL', 'TOTAL', 'المجموع'), '', '', '', '', total], [label(language, 'Top category', 'Catégorie principale', 'الفئة الأولى'), '', '', '', '', categories.map((category) => [category, items.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0)]).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] instanceof Object ? getCategoryName(categories.find((category) => category.id === (categories.map((category) => [category, items.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0)]).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] as Category)?.id) || categories[0], language) : '']];
  };
  append(sheetName('Expenses', 'Dépenses', 'المصاريف'), detailRows(expenses, 'expense'));
  append(sheetName('Income', 'Revenus', 'المداخيل'), detailRows(income, 'income'));

  const monthly = new Map<string, { income: number; expenses: number }>();
  scopedTransactions.forEach((item) => { const current = monthly.get(monthOf(item.date)) || { income: 0, expenses: 0 }; if (item.type === 'income') current.income += item.amount; if (item.type === 'expense') current.expenses += item.amount; monthly.set(monthOf(item.date), current); });
  append(sheetName('Monthly', 'Mensuel', 'شهري'), [[label(language, 'Month', 'Mois', 'الشهر'), label(language, 'Income', 'Revenus', 'المداخيل'), label(language, 'Expenses', 'Dépenses', 'المصاريف'), label(language, 'Net', 'Net', 'الصافي')], ...Array.from(monthly.entries()).sort().map(([month, values]) => [month, values.income, values.expenses, values.income - values.expenses])]);
  append(sheetName('Goals', 'Objectifs', 'الأهداف'), [[label(language, 'Name', 'Nom', 'الاسم'), label(language, 'Target', 'Cible', 'الهدف'), label(language, 'Saved', 'Épargné', 'المدخر'), label(language, 'Progress', 'Progression', 'التقدم')], ...goals.map((goal) => [getCategoryName(goal, language), goal.targetAmount || 0, transactions.filter((item) => item.categoryId === goal.id && item.type === 'contribution').reduce((sum, item) => sum + item.amount, 0), ''])]);
  append(sheetName('Debts', 'Dettes', 'الديون'), [[label(language, 'Person', 'Personne', 'الشخص'), label(language, 'Type', 'Type', 'النوع'), label(language, 'Total', 'Total', 'المجموع'), label(language, 'Paid', 'Payé', 'المدفوع'), label(language, 'Due date', 'Échéance', 'تاريخ الاستحقاق')], ...debts.map((debt) => [debt.personName, debt.type, debt.totalAmount, debt.paidAmount, debt.dueDate || ''])]);
  append(sheetName('Subscriptions', 'Abonnements', 'الاشتراكات'), [[label(language, 'Name', 'Nom', 'الاسم'), label(language, 'Amount', 'Montant', 'المبلغ'), label(language, 'Next due', 'Prochaine échéance', 'الاستحقاق القادم'), label(language, 'Category', 'Catégorie', 'الفئة')], ...subscriptions.map((subscription) => [subscription.name, subscription.amount, subscription.nextDueDate || '', subscription.category])]);
  append(sheetName('Program', 'Programme', 'البرنامج'), [[label(language, 'Task', 'Tâche', 'المهمة'), label(language, 'Completions', 'Réalisations', 'الإنجازات'), label(language, 'Streak', 'Série', 'السلسلة'), label(language, 'XP', 'XP', 'نقاط XP')], ...tasks.map((task) => [task.title, task.completedDates?.length || 0, '', (task.completedDates?.length || 0) * 10]), ...programTracks.flatMap((track) => (track.subtasks || []).map((subtask) => [subtask.title, subtask.completedDates?.length || 0, '', (subtask.completedDates?.length || 0) * (subtask.points || 10)]))]);
  append(sheetName('Notes', 'Notes', 'الملاحظات'), [[label(language, 'Title', 'Titre', 'العنوان'), label(language, 'Content', 'Contenu', 'المحتوى'), label(language, 'Updated', 'Mis à jour', 'التحديث')], ...notes.map((note) => [note.title, note.content, note.updatedAt])]);

  XLSX.writeFile(wb, `flouss_export_${getTodayDateStr()}.xlsx`);
}
