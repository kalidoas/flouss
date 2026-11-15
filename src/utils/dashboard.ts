import { Category, FocusTask, Transaction } from '../types';

export interface DailyRateInsight {
  amountPerDay: number;
  daysLeft: number;
}

export function getDailyRateInsight(balance: number, selectedMonth: string, now = new Date()): DailyRateInsight | null {
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (selectedMonth !== currentMonth || balance <= 0) return null;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  return { amountPerDay: Math.round((balance / daysLeft) * 100) / 100, daysLeft };
}

export function getNetPresentation(net: number): {
  tone: 'positive' | 'negative' | 'neutral';
  caption: 'netSavedCaption' | 'netSpentCaption' | 'netEvenCaption';
} {
  if (net > 0) return { tone: 'positive', caption: 'netSavedCaption' };
  if (net < 0) return { tone: 'negative', caption: 'netSpentCaption' };
  return { tone: 'neutral', caption: 'netEvenCaption' };
}

export function getOpenFocusTasks(focusTasks: FocusTask[] = [], today = new Date()): FocusTask[] {
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return focusTasks
    .filter((task) => !task.completed)
    .slice()
    .sort((a, b) => {
      const aOverdue = Boolean(a.dueDate && a.dueDate < todayKey);
      const bOverdue = Boolean(b.dueDate && b.dueDate < todayKey);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      const aUrgent = a.priority === 'urgent';
      const bUrgent = b.priority === 'urgent';
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export interface FrequentExpenseCombo {
  categoryId: string;
  amount: number;
  count: number;
  latestDate: string;
}

export function deriveFrequentExpenseCombos(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  now = new Date(),
  limit = 3
): FrequentExpenseCombo[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setDate(cutoff.getDate() - 59);
  const validCategories = new Set(categories.filter((category) => !category.isArchived && !category.isGoal).map((category) => category.id));
  const combos = new Map<string, FrequentExpenseCombo>();

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense' || !transaction.categoryId || !validCategories.has(transaction.categoryId)) return;
    const dateKey = transaction.date?.slice(0, 10);
    if (!dateKey) return;
    const date = new Date(`${dateKey}T00:00:00`);
    if (!Number.isFinite(date.getTime()) || date < cutoff || date > now) return;
    const cents = Math.round((Number(transaction.amount) || 0) * 100);
    if (cents <= 0) return;
    const key = `${transaction.categoryId}:${cents}`;
    const existing = combos.get(key);
    if (existing) {
      existing.count += 1;
      if (dateKey > existing.latestDate) existing.latestDate = dateKey;
    } else {
      combos.set(key, { categoryId: transaction.categoryId, amount: cents / 100, count: 1, latestDate: dateKey });
    }
  });

  return [...combos.values()]
    .sort((a, b) => b.count - a.count || b.latestDate.localeCompare(a.latestDate) || a.categoryId.localeCompare(b.categoryId) || a.amount - b.amount)
    .slice(0, Math.max(0, limit));
}

export interface DashboardInsight {
  type: 'weekly_comparison' | 'category_share' | 'monthly_activity';
  tag: Record<'ar' | 'fr' | 'en', string>;
  message: Record<'ar' | 'fr' | 'en', string>;
  action: Record<'ar' | 'fr' | 'en', string>;
  screen: 'expenses';
  addExpense?: boolean;
}

/**
 * Checks if the transaction history covers at least 14 days between earliest and latest transaction.
 */
export function hasTwoWeeksOfData(transactions: Transaction[] = []): boolean {
  if (!Array.isArray(transactions) || transactions.length < 3) return false;
  const timestamps = transactions
    .map((t) => Date.parse(t.date))
    .filter((ts) => Number.isFinite(ts));
  if (timestamps.length < 2) return false;
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const spanMs = maxTime - minTime;
  const spanDays = spanMs / (1000 * 60 * 60 * 24);
  return spanDays >= 14;
}

/**
 * Derives an AI/smart insight from user transactions.
 * Strict privacy & data requirements:
 * 1. Must hide every AI/insight card when transactions.length < 3.
 * 2. Weekly comparisons are suppressed when there is less than 2 weeks of data (span < 14 days).
 */
export function deriveDashboardInsight(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  now = new Date()
): DashboardInsight | null {
  // 1. Hide every AI insight card when transactions.length < 3
  if (!Array.isArray(transactions) || transactions.length < 3) {
    return null;
  }

  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) {
    return null;
  }

  const twoWeeksAvailable = hasTwoWeeksOfData(transactions);

  // 2. Weekly comparisons: ONLY when there is at least 2 weeks of data
  if (twoWeeksAvailable) {
    const nowTs = now.getTime();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const startOfCurrentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const startOfPrevWeek = startOfCurrentWeek - 7 * 86400 * 1000;

    let currentWeekSum = 0;
    let prevWeekSum = 0;

    expenses.forEach((t) => {
      const ts = Date.parse(t.date);
      if (!Number.isFinite(ts)) return;
      if (ts >= startOfCurrentWeek && ts <= nowTs) {
        currentWeekSum += Number(t.amount) || 0;
      } else if (ts >= startOfPrevWeek && ts < startOfCurrentWeek) {
        prevWeekSum += Number(t.amount) || 0;
      }
    });

    if (prevWeekSum > 0) {
      const diffPct = Math.round(((currentWeekSum - prevWeekSum) / prevWeekSum) * 100);
      const isUp = diffPct > 0;
      const absPct = Math.abs(diffPct);
      return {
        type: 'weekly_comparison',
        tag: { en: 'Weekly trend', fr: 'Tendance hebdo', ar: 'اتجاه أسبوعي' },
        message: {
          en: isUp
            ? `Your spending is up +${absPct}% compared to last week.`
            : `Your spending is down -${absPct}% compared to last week. Keep it up!`,
          fr: isUp
            ? `Vos dépenses sont en hausse de +${absPct}% par rapport à la semaine dernière.`
            : `Vos dépenses ont baissé de -${absPct}% par rapport à la semaine dernière. Bravo !`,
          ar: isUp
            ? `المصاريف ديالك زادت بـ +${absPct}% مقارنة مع السيمانة الفايتة.`
            : `المصاريف ديالك نقصات بـ -${absPct}% مقارنة مع السيمانة الفايتة. تبارك الله عليك!`,
        },
        action: { en: 'View expenses', fr: 'Voir les dépenses', ar: 'شوف المصاريف' },
        screen: 'expenses',
      };
    }
  }

  // 3. Fallback when < 2 weeks of data or prevWeekSum == 0: non-comparative category share
  const catSums = new Map<string, number>();
  let totalExpense = 0;
  expenses.forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (amt <= 0) return;
    totalExpense += amt;
    const catId = t.categoryId || 'other';
    catSums.set(catId, (catSums.get(catId) || 0) + amt);
  });

  if (totalExpense > 0 && catSums.size > 0) {
    let topCatId = '';
    let topCatSum = 0;
    for (const [id, sum] of catSums.entries()) {
      if (sum > topCatSum) {
        topCatSum = sum;
        topCatId = id;
      }
    }
    const catObj = categories.find((c) => c.id === topCatId);
    const catNameEn = catObj?.name || 'Top category';
    const catNameFr = (catObj as any)?.translations?.fr || catNameEn;
    const catNameAr = (catObj as any)?.translations?.ar || catNameEn;
    const pct = Math.round((topCatSum / totalExpense) * 100);

    return {
      type: 'category_share',
      tag: { en: 'Spending distribution', fr: 'Répartition dépenses', ar: 'توزيع المصاريف' },
      message: {
        en: `${catNameEn} represents ${pct}% of your total recorded expenses.`,
        fr: `${catNameFr} représente ${pct}% du total de vos dépenses enregistrées.`,
        ar: `${catNameAr} كيمثل ${pct}% من مجموع المصاريف المسجلة ديالك.`,
      },
      action: { en: 'View expenses', fr: 'Voir les dépenses', ar: 'شوف المصاريف' },
      screen: 'expenses',
    };
  }

  // 4. Monthly activity non-comparative fallback
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthCount = expenses.filter((t) => t.date?.startsWith(monthPrefix)).length;

  return {
    type: 'monthly_activity',
    tag: { en: 'Your activity', fr: 'Votre activité', ar: 'النشاط ديالك' },
    message: {
      en: `You recorded ${monthCount} expense${monthCount === 1 ? '' : 's'} this month.`,
      fr: `Vous avez enregistré ${monthCount} dépense${monthCount === 1 ? '' : 's'} ce mois-ci.`,
      ar: `سجلتي ${monthCount} مصروف هاد الشهر.`,
    },
    action: { en: 'View expenses', fr: 'Voir les dépenses', ar: 'شوف المصاريف' },
    screen: 'expenses',
  };
}
