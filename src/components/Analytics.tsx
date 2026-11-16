import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, ChevronDown, ChevronRight, CircleDollarSign, FileText, Lightbulb, PiggyBank, Receipt, Repeat2, WalletCards } from 'lucide-react';
import { KpiCard } from './common/KpiCard';
import { CountUpNumber } from './common/CountUpNumber';
import { GlassMonthPicker } from './common/GlassMonthPicker';
import { MoneyText } from './common/PrivacyCurrency';
import { useAppStore } from '../store/useAppStore';
import { getCategoryName, getSubCategoryName } from '../utils/i18nHelpers';
import { getCategoryVisualColor } from '../utils/categoryColor';
import { getCurrentMonthStr, formatDate, isTransactionInMonth } from '../utils/formatters';
import { selectFinancialSummary } from '../utils/calculations';

const localeFor = (language: 'fr' | 'ar' | 'en') => language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
const copy = (language: 'fr' | 'ar' | 'en', en: string, fr: string, ar: string) => language === 'ar' ? ar : language === 'fr' ? fr : en;

export const Analytics: React.FC = () => {
  const { transactions, initialBalance, categories, subscriptions, language } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [comparePrevious, setComparePrevious] = useState(true);
  const [detail, setDetail] = useState<'income' | 'expense' | 'net' | 'savings' | null>(null);
  const [categoryPath, setCategoryPath] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const values = new Set((transactions || []).map((transaction) => transaction.date.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month)));
    values.add(getCurrentMonthStr());
    return Array.from(values).sort((a, b) => b.localeCompare(a)).map((month) => ({
      value: month,
      label: new Intl.DateTimeFormat(localeFor(language), { month: 'long', year: 'numeric' }).format(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)),
    }));
  }, [transactions, language]);
  const previousMonth = useMemo(() => {
    const date = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)) - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);
  const currentTransactions = useMemo(() => (transactions || []).filter((transaction) => isTransactionInMonth(transaction.date, selectedMonth)), [transactions, selectedMonth]);
  const previousTransactions = useMemo(() => (transactions || []).filter((transaction) => isTransactionInMonth(transaction.date, previousMonth)), [transactions, previousMonth]);
  const summary = useMemo(() => selectFinancialSummary(currentTransactions), [currentTransactions]);
  const previousSummary = useMemo(() => selectFinancialSummary(previousTransactions), [previousTransactions]);
  const savingsRate = summary.income > 0 ? Math.max(0, Math.round((summary.net / summary.income) * 100)) : 0;
  const previousSavingsRate = previousSummary.income > 0 ? Math.max(0, Math.round((previousSummary.net / previousSummary.income) * 100)) : 0;
  const change = (current: number, previous: number) => previous === 0 ? undefined : Math.round(((current - previous) / Math.abs(previous)) * 100);

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    currentTransactions.filter((transaction) => transaction.type === 'expense').forEach((transaction) => totals.set(transaction.categoryId || 'uncategorized', (totals.get(transaction.categoryId || 'uncategorized') || 0) + transaction.amount));
    return Array.from(totals.entries()).map(([id, amount]) => {
      const category = categories.find((entry) => entry.id === id);
      return { id, amount, name: category ? getCategoryName(category, language) : copy(language, 'Other', 'Autre', 'أخرى'), color: category ? getCategoryVisualColor(category.id) : 'var(--muted-foreground)' };
    }).sort((a, b) => b.amount - a.amount);
  }, [currentTransactions, categories, language]);
  const dailyData = useMemo(() => {
    const days = new Map<string, number>();
    currentTransactions.filter((transaction) => transaction.type === 'expense').forEach((transaction) => { const date = transaction.date.slice(0, 10); days.set(date, (days.get(date) || 0) + transaction.amount); });
    const count = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();
    return Array.from({ length: count }, (_, index) => { const date = `${selectedMonth}-${String(index + 1).padStart(2, '0')}`; return { day: index + 1, amount: days.get(date) || 0 }; });
  }, [currentTransactions, selectedMonth]);
  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, index) => { const date = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)) - 1 - (5 - index), 1); const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; const values = selectFinancialSummary((transactions || []).filter((transaction) => isTransactionInMonth(transaction.date, month))); return { month: date.toLocaleDateString(localeFor(language), { month: 'short' }), income: values.income, expenses: values.expenses, net: values.net }; }), [transactions, selectedMonth, language]);
  const weekdayData = useMemo(() => { const totals = Array.from({ length: 7 }, () => 0); currentTransactions.filter((transaction) => transaction.type === 'expense').forEach((transaction) => { totals[new Date(transaction.date).getDay()] += transaction.amount; }); return totals.map((amount, day) => ({ day: new Intl.DateTimeFormat(localeFor(language), { weekday: 'short' }).format(new Date(2024, 0, 7 + day)), amount })); }, [currentTransactions, language]);
  const detailTransactions = detail === 'income' ? currentTransactions.filter((transaction) => transaction.type === 'income') : detail === 'expense' ? currentTransactions.filter((transaction) => transaction.type === 'expense') : currentTransactions;
  const selectedCategory = categories.find((category) => category.id === categoryPath);
  const categoryTransactions = currentTransactions.filter((transaction) => transaction.categoryId === categoryPath);

  const insight = summary.expenses > summary.income
    ? { text: copy(language, 'Expenses are above inflow this month.', 'Les dépenses dépassent les revenus ce mois-ci.', 'المصاريف تتجاوز المداخيل هذا الشهر.'), action: copy(language, 'Review top expenses', 'Revoir les plus grosses dépenses', 'راجع أكبر المصاريف') }
    : summary.income > 0 && savingsRate >= 20
    ? { text: copy(language, 'Your savings pace is healthy this month.', 'Votre rythme d’épargne est sain ce mois-ci.', 'وتيرة ادخارك جيدة هذا الشهر.'), action: copy(language, 'View goals', 'Voir les objectifs', 'عرض الأهداف') }
    : null;

  return (
    <div className="max-w-[1280px] mx-auto space-y-5 pb-12 animate-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">{copy(language, 'Analytics', 'Analyses', 'التحليلات')}</h1><p className="text-sm text-muted-foreground">{copy(language, 'Simple at a glance, detailed on demand.', 'Simple au premier regard, détaillé à la demande.', 'بسيط من النظرة الأولى، ومفصل عند الطلب.')}</p></div>
        <div className="flex flex-wrap items-center gap-3"><GlassMonthPicker value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} ariaLabel={copy(language, 'Choose month', 'Choisir le mois', 'اختر الشهر')} /><label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={comparePrevious} onChange={(event) => setComparePrevious(event.target.checked)} />{copy(language, 'Compare previous month', 'Comparer au mois précédent', 'مقارنة بالشهر السابق')}</label></div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <button type="button" onClick={() => setDetail('income')} className="text-left"><KpiCard title={copy(language, 'Inflow', 'Entrées', 'المداخيل')} value={summary.income} change={comparePrevious ? change(summary.income, previousSummary.income) : undefined} changeSuffix="%" changeLabel={copy(language, 'vs previous month', 'vs mois précédent', 'مقابل الشهر السابق')} icon={ArrowUpRight} color="emerald" /></button>
        <button type="button" onClick={() => setDetail('expense')} className="text-left"><KpiCard title={copy(language, 'Outflow', 'Sorties', 'المصاريف')} value={summary.expenses} change={comparePrevious ? change(summary.expenses, previousSummary.expenses) : undefined} changeSuffix="%" changeLabel={copy(language, 'vs previous month', 'vs mois précédent', 'مقابل الشهر السابق')} icon={ArrowDownRight} color="rose" isPositiveGood={false} /></button>
        <button type="button" onClick={() => setDetail('net')} className="text-left"><KpiCard title={copy(language, 'Net', 'Net', 'الصافي')} value={summary.net} icon={Activity} color="indigo" /></button>
        <button type="button" onClick={() => setDetail('savings')} className="text-left"><KpiCard title={copy(language, 'Savings rate', 'Taux d’épargne', 'معدل الادخار')} value={savingsRate} unit="%" change={comparePrevious ? savingsRate - previousSavingsRate : undefined} changeSuffix="pp" icon={PiggyBank} color="amber" /></button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-foreground">{copy(language, 'Spending by category', 'Dépenses par catégorie', 'المصاريف حسب الفئة')}</h2><p className="text-xs text-muted-foreground">{copy(language, 'Tap a slice or row for subcategories and transactions.', 'Touchez une part ou une ligne pour les sous-catégories et transactions.', 'اضغط على الجزء أو الصف لعرض الفئات الفرعية والمعاملات.')}</p></div><CircleDollarSign className="h-4 w-4 text-muted-foreground" /></div>{categoryData.length ? <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2"><div className="h-52"><ResponsiveContainer><PieChart><Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={78} onClick={(entry) => setCategoryPath(String(entry.id))}>{categoryData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}</Pie><Tooltip formatter={(value: number) => <MoneyText amount={value} />} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{categoryData.slice(0, 6).map((entry) => <button type="button" key={entry.id} onClick={() => setCategoryPath(entry.id)} className="flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left hover:bg-muted/50"><span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /><span className="truncate text-sm text-foreground">{entry.name}</span></span><MoneyText amount={entry.amount} /></button>)}</div></div> : <p className="py-10 text-center text-sm text-muted-foreground">{copy(language, 'No expenses recorded.', 'Aucune dépense enregistrée.', 'لا توجد مصاريف مسجلة.')}</p>}</section>
        <section className="rounded-2xl border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-foreground">{copy(language, 'Daily spending', 'Dépenses quotidiennes', 'المصاريف اليومية')}</h2><p className="text-xs text-muted-foreground">{copy(language, 'Avg spend / day', 'Dépense moyenne / jour', 'متوسط الإنفاق / اليوم')}: {summary.expenses ? <MoneyText amount={summary.expenses / Math.max(1, dailyData.length)} /> : '—'}</p></div><BarChart3 className="h-4 w-4 text-muted-foreground" /></div><div className="h-52"><ResponsiveContainer><BarChart data={dailyData}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis hide /><Tooltip formatter={(value: number) => <MoneyText amount={value} />} /><Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-3 font-semibold text-foreground">{copy(language, 'Spending by weekday', 'Dépenses par jour de semaine', 'المصاريف حسب يوم الأسبوع')}</h2><div className="h-52"><ResponsiveContainer><BarChart data={weekdayData}><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis hide /><Tooltip formatter={(value: number) => <MoneyText amount={value} />} /><Bar dataKey="amount" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-3 font-semibold text-foreground">{copy(language, 'Six-month trend', 'Tendance sur six mois', 'اتجاه ستة أشهر')}</h2><div className="h-52"><ResponsiveContainer><LineChart data={monthlyData}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis hide /><Tooltip formatter={(value: number) => <MoneyText amount={value} />} /><Line type="monotone" dataKey="income" stroke="var(--chart-2)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="expenses" stroke="var(--destructive)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="net" stroke="var(--primary)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><section className="rounded-2xl border border-border bg-card p-4 lg:col-span-2"><h2 className="mb-3 font-semibold text-foreground">{copy(language, 'Top 5 expenses', 'Top 5 dépenses', 'أكبر 5 مصاريف')}</h2><div className="space-y-2">{currentTransactions.filter((transaction) => transaction.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5).map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2.5"><span className="min-w-0 text-sm text-foreground break-words line-clamp-2">{transaction.note || categories.find((category) => category.id === transaction.categoryId)?.name || '—'}</span><MoneyText amount={transaction.amount} /></div>)}</div></section><section className="rounded-2xl border border-border bg-card p-4"><h2 className="mb-3 font-semibold text-foreground">{copy(language, 'Subscriptions share', 'Part des abonnements', 'حصة الاشتراكات')}</h2><div className="flex items-center gap-3"><Repeat2 className="h-5 w-5 text-muted-foreground" /><div><div className="text-2xl font-bold text-foreground"><CountUpNumber value={subscriptions.reduce((sum, subscription) => sum + subscription.amount, 0)} language={language} duration={250} /></div><p className="text-xs text-muted-foreground">{copy(language, 'monthly scheduled amount', 'montant mensuel prévu', 'المبلغ الشهري المجدول')}</p></div></div></section></div>

      {insight && <section className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /><div><p className="font-medium text-foreground">{insight.text}</p><p className="text-xs text-muted-foreground">{insight.action}</p></div></div><ChevronRight className="hidden h-4 w-4 text-muted-foreground sm:block" /></section>}

      {detail && <div className="rounded-2xl border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-foreground">{copy(language, 'Details', 'Détails', 'التفاصيل')}</h2><button type="button" onClick={() => setDetail(null)} className="text-sm text-muted-foreground hover:text-foreground">{copy(language, 'Close', 'Fermer', 'إغلاق')}</button></div><p className="mb-3 text-sm text-muted-foreground">{detail === 'savings' ? `${savingsRate}%` : <MoneyText amount={detail === 'income' ? summary.income : detail === 'expense' ? summary.expenses : summary.net} />}</p><div className="max-h-64 space-y-1 overflow-y-auto">{detailTransactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-muted/40"><span className="text-foreground break-words line-clamp-2">{transaction.note || formatDate(transaction.date, language)}</span><MoneyText amount={transaction.amount} /></div>)}</div></div>}

      {categoryPath && <div className="rounded-2xl border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold text-foreground">{selectedCategory ? getCategoryName(selectedCategory, language) : copy(language, 'Category details', 'Détails de catégorie', 'تفاصيل الفئة')}</h2><button type="button" onClick={() => setCategoryPath(null)} className="text-sm text-muted-foreground hover:text-foreground">{copy(language, 'Close', 'Fermer', 'إغلاق')}</button></div><div className="space-y-1">{categoryTransactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm"><span className="text-foreground break-words line-clamp-2">{transaction.subCategoryId && selectedCategory?.subcategories ? getSubCategoryName(selectedCategory.subcategories.find((subcategory) => subcategory.id === transaction.subCategoryId) || selectedCategory.subcategories[0], language) : transaction.note || '—'}</span><MoneyText amount={transaction.amount} /></div>)}</div></div>}
    </div>
  );
};
