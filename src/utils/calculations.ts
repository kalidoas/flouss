import { Category, GoalCalculation, Language, Transaction, UserAccount, TaskItem, DebtItem, SubscriptionItem } from '../types';
import { getCategoryName } from './i18nHelpers';
import { getIntlLocale, isTransactionInMonth } from './formatters';
import { money } from '../lib/currency';

export function calculateAvailableBalance(initialBalance: number | null, transactions: Transaction[]): number {
  const baseCents = typeof initialBalance === 'number' && !isNaN(initialBalance) ? money.toCents(initialBalance) : 0;
  const netCents = (transactions || []).reduce((acc, tx) => {
    const amtCents = typeof tx.amount === 'number' && !isNaN(tx.amount) ? money.toCents(tx.amount) : money.toCents(String(tx.amount || 0));
    switch (tx.type) {
      case 'income': return acc + amtCents;
      case 'expense': return acc - amtCents;
      case 'contribution': return acc - amtCents;
      case 'goal_withdraw': return acc + amtCents;
      case 'adjustment': return acc + amtCents;
      default: return acc;
    }
  }, baseCents);
  return money.round(netCents / 100);
}

export function calculateReconciledInitialBalance(targetBalance: number, transactions: Transaction[]): number {
  const netTxImpact = calculateAvailableBalance(0, transactions);
  return money.round(targetBalance - netTxImpact);
}

export function reconcileIncomeAndInitialBalance(account: UserAccount): {
  account: UserAccount;
  changed: boolean;
} {
  if (!account) return { account, changed: false };

  if (account.incomeBalanceFixedV1) {
    return { account, changed: false };
  }

  let changed = false;
  const currentTransactions = Array.isArray(account.transactions) ? [...account.transactions] : [];

  let updatedIncomeSources = Array.isArray(account.incomeSources) ? [...account.incomeSources] : [];
  if (!updatedIncomeSources.some((s) => s.id === 'src_autre_travail' || s.key === 'otherWork')) {
    updatedIncomeSources.push({
      id: 'src_autre_travail',
      key: 'otherWork',
      name: 'أعمال أخرى',
      icon: 'Briefcase',
      color: '#6366f1',
      isDefault: true,
      createdAt: new Date().toISOString(),
      subcategories: [
        { id: 'sub_inc_other_work', key: 'otherWork', name: 'أعمال أخرى', icon: 'Briefcase' },
      ],
    });
    changed = true;
  }

  const exact340Index = currentTransactions.findIndex(
    (tx) => tx.type === 'income' && (Math.abs(Number(tx.amount) - 340) < 0.01 || Number(tx.amount) === 340)
  );

  let updatedTransactions = currentTransactions;

  if (exact340Index !== -1) {
    updatedTransactions = currentTransactions.map((tx, idx) => {
      if (idx === exact340Index) {
        return {
          ...tx,
          amount: 300,
          sourceId: 'src_autre_travail',
          note: 'أعمال أخرى',
        };
      }
      return tx;
    });
    changed = true;
  } else if (currentTransactions.some((tx) => tx.type === 'income')) {
    let modifiedFirst = false;
    updatedTransactions = currentTransactions
      .map((tx) => {
        if (tx.type === 'income') {
          if (!modifiedFirst) {
            modifiedFirst = true;
            return {
              ...tx,
              amount: 300,
              sourceId: 'src_autre_travail',
              note: 'أعمال أخرى',
            };
          }
          return null as any;
        }
        return tx;
      })
      .filter(Boolean);
    changed = true;
  } else {
    const newIncome: Transaction = {
      id: 'tx_income_300',
      type: 'income',
      amount: 300,
      sourceId: 'src_autre_travail',
      note: 'أعمال أخرى',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    updatedTransactions = [newIncome, ...currentTransactions];
    changed = true;
  }

  const targetBalance = 231.5;
  const newInitialBalance = calculateReconciledInitialBalance(targetBalance, updatedTransactions);
  const calculatedBalance = calculateAvailableBalance(newInitialBalance, updatedTransactions);

  if (account.initialBalance !== newInitialBalance || account.balance !== targetBalance) {
    changed = true;
  }

  const updatedAccount: UserAccount = {
    ...account,
    incomeSources: updatedIncomeSources,
    transactions: updatedTransactions,
    initialBalance: newInitialBalance,
    balance: calculatedBalance,
    incomeBalanceFixedV1: true,
  };

  return { account: updatedAccount, changed };
}

export function selectAvailableBalance(state: { initialBalance: number | null; transactions?: Transaction[]; balance?: number; }): number {
  const txs = state.transactions || [];
  if (txs.length > 0 || state.initialBalance !== null) return calculateAvailableBalance(state.initialBalance, txs);
  return typeof state.balance === 'number' && !isNaN(state.balance) ? state.balance : calculateAvailableBalance(state.initialBalance, txs);
}

export function calculateCategorySavedAmount(categoryId: string, transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.categoryId === categoryId)
    .reduce((acc, tx) => {
      if (tx.type === 'contribution') return acc + tx.amount;
      if (tx.type === 'goal_withdraw') return acc - tx.amount;
      return acc;
    }, 0);
}

export function calculateCategorySpentAmount(categoryId: string, transactions: Transaction[], month?: string): number {
  return transactions
    .filter((tx) => {
      if (tx.type !== 'expense' || tx.categoryId !== categoryId) return false;
      if (month && !isTransactionInMonth(tx.date, month)) return false;
      return true;
    })
    .reduce((acc, tx) => acc + tx.amount, 0);
}

export function calculateCategoryBudgetStatus(
  category: Category,
  spentThisMonth: number
): { hasBudget: boolean; budget: number; spent: number; remaining: number; percent: number; status: 'normal' | 'warning' | 'exceeded'; barColor: string; } {
  const budget = category.monthlyBudget || 0;
  if (!budget || budget <= 0) {
    return { hasBudget: false, budget: 0, spent: spentThisMonth, remaining: 0, percent: 0, status: 'normal', barColor: '#10b981' };
  }
  const percent = Math.min(100, Math.round((spentThisMonth / budget) * 100));
  const remaining = Math.max(0, budget - spentThisMonth);
  let status: 'normal' | 'warning' | 'exceeded' = 'normal';
  let barColor = '#10b981';
  if (spentThisMonth >= budget) { status = 'exceeded'; barColor = '#ef4444'; }
  else if (percent >= 80) { status = 'warning'; barColor = '#f59e0b'; }
  return { hasBudget: true, budget, spent: spentThisMonth, remaining, percent, status, barColor };
}

export function getKpiData(
  transactions: Transaction[],
  tasks: TaskItem[],
  debts: DebtItem[],
  subscriptions: SubscriptionItem[],
  selectedMonth: string,
  _language: Language = 'fr'
) {
  const currentMonth = selectedMonth;
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const lastMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

  const getMonthMetric = (monthKey: string, type: 'income' | 'expense' | 'contribution') => {
    return (transactions || [])
      .filter((tx) => tx.type === type && isTransactionInMonth(tx.date, monthKey))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  };

  const currentIncome = getMonthMetric(currentMonth, 'income');
  const lastIncome = getMonthMetric(lastMonth, 'income');
  const incomeChange =
    lastIncome > 0
      ? Math.round(((currentIncome - lastIncome) / lastIncome) * 100)
      : currentIncome > 0
      ? 100
      : 0;
  const incomeCount = (transactions || []).filter(
    (tx) => tx.type === 'income' && isTransactionInMonth(tx.date, currentMonth)
  ).length;

  const currentExpense = getMonthMetric(currentMonth, 'expense');
  const lastExpense = getMonthMetric(lastMonth, 'expense');
  const expenseChange =
    lastExpense > 0
      ? Math.round(((currentExpense - lastExpense) / lastExpense) * 100)
      : currentExpense > 0
      ? 100
      : 0;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const avgDailySpend = daysInMonth > 0 ? Math.round(currentExpense / daysInMonth) : 0;

  const currentSavings = getMonthMetric(currentMonth, 'contribution');
  const savingsRate =
    currentIncome > 0
      ? Math.max(0, Math.min(100, Math.round((currentSavings / currentIncome) * 100)))
      : 0;
  const netFlow = currentIncome - currentExpense;
  const netFlowColor = netFlow >= 0 ? 'emerald' : 'rose';

  const validTasks = (tasks || []).filter((t) => !t.isArchived);
  const totalTasks = validTasks.length;

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayCompleted = validTasks.filter(
    (task) => Array.isArray(task.completedDates) && task.completedDates.includes(todayISO)
  ).length;
  const todayRate = totalTasks > 0 ? Math.round((todayCompleted / totalTasks) * 100) : 0;

  const totalMonthlyCheckmarks = validTasks.reduce((sum, task) => {
    if (!Array.isArray(task.completedDates)) return sum;
    return sum + task.completedDates.filter((d) => d.slice(0, 7) === currentMonth).length;
  }, 0);
  const totalPossibleMonthlyCheckmarks = totalTasks * daysInMonth;
  const monthlyRate =
    totalPossibleMonthlyCheckmarks > 0
      ? Math.round((totalMonthlyCheckmarks / totalPossibleMonthlyCheckmarks) * 100)
      : 0;

  const pendingTasks = Math.max(0, totalTasks - todayCompleted);

  const validDebts = debts || [];
  const owedToMe = validDebts
    .filter((d) => d.type === 'lend' && !d.isSettled)
    .reduce((sum, d) => sum + (Number(d.totalAmount) - (Number(d.paidAmount) || 0)), 0);
  const iOwe = validDebts
    .filter((d) => d.type === 'borrow' && !d.isSettled)
    .reduce((sum, d) => sum + (Number(d.totalAmount) - (Number(d.paidAmount) || 0)), 0);
  const netPosition = owedToMe - iOwe;
  const unsettledCount = validDebts.filter((d) => !d.isSettled).length;

  const validSubs = subscriptions || [];
  const activeSubs = validSubs.filter(
    (sub) => !sub.endDate || sub.endDate >= `${currentMonth}-01`
  );
  const subTotal = activeSubs.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);
  const subExpensePercent =
    currentExpense > 0
      ? Math.min(100, Math.round((subTotal / currentExpense) * 100))
      : 0;

  return {
    income: { value: currentIncome, change: incomeChange, count: incomeCount },
    expense: { value: currentExpense, change: expenseChange, avgDaily: avgDailySpend },
    netFlow: { value: netFlow, savingsRate, color: netFlowColor, currentSavings },
    tasks: {
      completionRate: todayRate,
      todayRate,
      todayCompleted,
      todayTotal: totalTasks,
      monthlyRate,
      monthlyCheckmarks: totalMonthlyCheckmarks,
      totalPossibleMonthlyCheckmarks,
      daysInMonth,
      completedCount: todayCompleted,
      totalCount: totalTasks,
      pendingCount: pendingTasks,
      activeStreak: todayCompleted,
    },
    debts: {
      netPosition,
      owedToMe,
      iOwe,
      unsettledCount,
      color: netPosition >= 0 ? 'emerald' : 'amber',
    },
    subscriptions: {
      total: subTotal,
      expensePercent: subExpensePercent,
      activeCount: activeSubs.length,
    },
  };
}

export function calculateTotalSavingsInGoals(categories: Category[], transactions: Transaction[]): number {
  return categories.filter((cat) => cat.isGoal && cat.targetAmount && cat.targetAmount > 0).reduce((acc, cat) => acc + Math.max(0, calculateCategorySavedAmount(cat.id, transactions)), 0);
}

export function calculateNetWorth(initialBalance: number | null, transactions: Transaction[], categories: Category[]): number {
  return calculateAvailableBalance(initialBalance, transactions) + calculateTotalSavingsInGoals(categories, transactions);
}

export function calculateGoalProgress(category: Category, transactions: Transaction[]): GoalCalculation {
  const target = category.targetAmount || 0;
  const saved = Math.max(0, calculateCategorySavedAmount(category.id, transactions));
  const remainingAmount = Math.max(0, target - saved);
  const progressPercent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  let remainingMonths = 1;
  const now = new Date();
  if (category.targetDate) {
    remainingMonths = Math.max(1, Math.ceil((new Date(category.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)));
  } else if (category.targetMonths) {
    remainingMonths = Math.max(1, category.targetMonths - Math.max(0, (now.getFullYear() - new Date(category.createdAt).getFullYear()) * 12 + (now.getMonth() - new Date(category.createdAt).getMonth())));
  }
  const monthlyNeeded = remainingMonths > 0 ? Math.ceil(remainingAmount / remainingMonths) : remainingAmount;
  const totalMonths = category.targetMonths || 6;
  const expectedSoFar = (target / totalMonths) * Math.max(1, totalMonths - remainingMonths);
  return { savedAmount: saved, remainingAmount, progressPercent, remainingMonths, monthlyNeeded, status: saved >= target && target > 0 ? 'completed' : saved === 0 ? 'not_started' : saved >= expectedSoFar * 0.85 ? 'on_track' : 'behind' };
}

export function getMonthlyStats(transactions: Transaction[], monthsCount: number = 6, language: Language = 'fr') {
  const result: { monthKey: string; label: string; income: number; expense: number; savings: number; }[] = [];
  const now = new Date();
  const locale = getIntlLocale(language);
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter((tx) => isTransactionInMonth(tx.date, monthKey));
    result.push({
      monthKey,
      label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).charAt(0).toUpperCase() + new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).slice(1),
      income: monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      savings: monthTx.filter((t) => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0),
    });
  }
  return result;
}

/**
 * Resolves an expense transaction to its parent category in `categories`.
 * Groups subcategories (e.g. Barber & Skincare -> Santé & Hygiène) and resolves
 * transactions using categoryId, subCategoryId, or semantic notes.
 */
export function resolveTransactionParentCategory(
  tx: Transaction,
  categories: Category[]
): Category | undefined {
  if (!categories || categories.length === 0) return undefined;

  // 1. Direct match on categoryId
  if (tx.categoryId) {
    // Check if categoryId is actually a subcategory ID inside any category first!
    const parentBySub = categories.find((c) =>
      c.subcategories?.some((s) => s.id === tx.categoryId || s.key === tx.categoryId)
    );
    if (parentBySub) return parentBySub;

    // Check if categoryId directly matches a parent category
    const directParent = categories.find((c) => c.id === tx.categoryId || c.key === tx.categoryId);
    if (directParent) return directParent;
  }

  // 2. Direct match on subCategoryId
  if (tx.subCategoryId) {
    const parent = categories.find((c) =>
      c.subcategories?.some((s) => s.id === tx.subCategoryId || s.key === tx.subCategoryId)
    );
    if (parent) return parent;
  }

  // 3. Semantic fallback on note or category name text
  const text = `${tx.note || ''} ${(tx as any).categoryName || ''} ${(tx as any).category || ''}`.toLowerCase();

  // Health & Hygiene (Santé & Hygiène)
  if (
    text.includes('barber') ||
    text.includes('salon') ||
    text.includes('coiff') ||
    text.includes('skincare') ||
    text.includes('gel douch') ||
    text.includes('soin') ||
    text.includes('pharmacie') ||
    text.includes('حلاقة') ||
    text.includes('بشرة') ||
    text.includes('صحة') ||
    text.includes('عناية')
  ) {
    const health = categories.find((c) => c.id === 'cat_sante' || c.key === 'health');
    if (health) return health;
  }

  // Café & Outings (Café & Sorties)
  if (
    text.includes('café') ||
    text.includes('cafe') ||
    text.includes('coffee') ||
    text.includes('thé') ||
    text.includes('مقهى') ||
    text.includes('قهوة') ||
    text.includes('شاي')
  ) {
    const cafe = categories.find((c) => c.id === 'cat_cafe' || c.key === 'cafe');
    if (cafe) return cafe;
  }

  // Sport & Fitness (Sport & Bien-être)
  if (
    text.includes('gym') ||
    text.includes('sport') ||
    text.includes('salle') ||
    text.includes('قاعة') ||
    text.includes('رياضة') ||
    text.includes('جيم')
  ) {
    const sport = categories.find((c) => c.id === 'cat_sport' || c.key === 'sport');
    if (sport) return sport;
  }

  // Telecom & Subscriptions (Télécom & Abonnements / PC & Tech)
  if (
    text.includes('inwi') ||
    text.includes('telecom') ||
    text.includes('orange') ||
    text.includes('iam') ||
    text.includes('fibre') ||
    text.includes('forfait') ||
    text.includes('facture') ||
    text.includes('اتصالات') ||
    text.includes('انوي')
  ) {
    const telecom = categories.find((c) => c.id === 'cat_telecom' || c.key === 'phone' || c.id === 'cat_pc');
    if (telecom) return telecom;
  }

  // Food & Groceries (Nourriture & Courses)
  if (
    text.includes('nourriture') ||
    text.includes('courses') ||
    text.includes('bim') ||
    text.includes('marjane') ||
    text.includes('carrefour') ||
    text.includes('snack') ||
    text.includes('fast-food') ||
    text.includes('restaurant') ||
    text.includes('أكل') ||
    text.includes('تغذية') ||
    text.includes('وجبات')
  ) {
    const food = categories.find((c) => c.id === 'cat_nourriture' || c.key === 'food');
    if (food) return food;
  }

  return undefined;
}

export function getCategorySpendingBreakdown(
  categories: Category[],
  transactions: Transaction[],
  month?: string,
  language: Language = 'fr'
) {
  const spendingMap = new Map<string, number>();
  const txCountMap = new Map<string, number>();

  (transactions || [])
    .filter(
      (tx) => tx.type === 'expense' && (!month || isTransactionInMonth(tx.date, month))
    )
    .forEach((tx) => {
      const parentCat = resolveTransactionParentCategory(tx, categories);
      const catId = parentCat ? parentCat.id : tx.categoryId;
      if (catId) {
        spendingMap.set(catId, (spendingMap.get(catId) || 0) + (Number(tx.amount) || 0));
        txCountMap.set(catId, (txCountMap.get(catId) || 0) + 1);
      }
    });

  const totalExpense = Array.from(spendingMap.values()).reduce((a, b) => a + b, 0);

  const breakdown = (categories || [])
    .map((cat) => {
      const amount = spendingMap.get(cat.id) || 0;
      const count = txCountMap.get(cat.id) || 0;
      return {
        id: cat.id,
        key: cat.key || cat.translationKey,
        translationKey: cat.translationKey || cat.key,
        name: getCategoryName(cat, language),
        color: cat.color,
        icon: cat.icon,
        amount: Math.round(amount * 100) / 100,
        count,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return { breakdown, totalExpense: Math.round(totalExpense * 100) / 100 };
}
