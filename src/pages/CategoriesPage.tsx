import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Category, CategoryGroupId, Transaction } from '../types';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryModal } from '../components/categories/CategoryModal';
import { CategoryDetailModal } from '../components/categories/CategoryDetailModal';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { AddContributionModal } from '../components/transactions/AddContributionModal';
import { Button } from '../components/common/Button';
import { translations } from '../i18n/translations';
import { getCategoryName, getSubCategoryName, getCategoryGroupName } from '../utils/i18nHelpers';
import { CATEGORY_GROUPS_META, resolveCategoryGroup } from '../utils/categoryTheme';
import { getCategoryIcon } from '../utils/icons';
import { formatMAD, getCurrentMonthStr, isTransactionInMonth } from '../utils/formatters';
import { getCategoryVisualColor } from '../utils/categoryColor';
import { MoneyText } from '../components/common/PrivacyCurrency';
import {
  calculateCategorySpentAmount,
  calculateGoalProgress,
} from '../utils/calculations';
import {
  Plus,
  Search,
  Layers,
  Target,
  ShoppingBag,
  Archive,
  Sparkles,
  LayoutGrid,
  List,
  TrendingDown,
  PiggyBank,
  ChevronRight,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 26 } },
};

export const CategoriesPage: React.FC = () => {
  const { categories, transactions, language, updateCategory } = useAppStore();
  const tCat = translations[language].categories;
  const currentMonth = getCurrentMonthStr();

  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'expenses' | 'archived'>('all');
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroupId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode] = useState<'grid' | 'list'>('list');
  const [showUnused, setShowUnused] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Quick modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState<string | undefined>();

  // Intelligence KPI calculations for Apple stats header
  const categoryStats = useMemo(() => {
    let totalSpent = 0;
    const catSpentMap: Record<string, number> = {};

    (transactions || []).forEach((tx) => {
      if (tx.type === 'expense' && tx.categoryId && isTransactionInMonth(tx.date, currentMonth)) {
        totalSpent += tx.amount;
        catSpentMap[tx.categoryId] = (catSpentMap[tx.categoryId] || 0) + tx.amount;
      }
    });

    let topCatId: string | null = null;
    let topCatAmount = 0;
    Object.entries(catSpentMap).forEach(([catId, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatId = catId;
      }
    });

    const topCategory = categories.find((c) => c.id === topCatId) || null;
    const activeGoals = categories.filter((c) => c.isGoal && !c.isArchived);

    return {
      totalSpent,
      topCategory,
      topCatAmount,
      activeGoalsCount: activeGoals.length,
      activeCategoriesCount: categories.filter((c) => !c.isArchived).length,
    };
  }, [categories, transactions, currentMonth]);

  // Filter categories
  const filteredCategories = categories.filter((cat: Category) => {
    // Tab filter
    if (activeTab === 'archived') {
      if (!cat.isArchived) return false;
    } else {
      if (cat.isArchived) return false;
      if (activeTab === 'goals' && !cat.isGoal) return false;
      if (activeTab === 'expenses' && cat.isGoal) return false;
    }

    // Group filter with semantic fallback for custom & legacy categories
    if (selectedGroup !== 'all') {
      const resolvedGroup = resolveCategoryGroup(cat);
      if (resolvedGroup !== selectedGroup) return false;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const catName = getCategoryName(cat, language).toLowerCase();
      const matchSub = (cat.subcategories || []).some((sub) =>
        getSubCategoryName(sub, language).toLowerCase().includes(q)
      );
      return catName.includes(q) || matchSub;
    }

    return true;
  }).sort((a, b) => calculateCategorySpentAmount(b.id, transactions, currentMonth) - calculateCategorySpentAmount(a.id, transactions, currentMonth));
  const unusedCount = filteredCategories.filter((category) => !category.isGoal && calculateCategorySpentAmount(category.id, transactions, currentMonth) === 0).length;
  const visibleCategories = filteredCategories.filter((category) => category.isGoal || calculateCategorySpentAmount(category.id, transactions, currentMonth) > 0 || showUnused);

  const handleOpenEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsCreateModalOpen(true);
  };

  const handleSetGoal = (category: Category) => {
    setCategoryToEdit({
      ...category,
      isGoal: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleQuickExpense = (category: Category) => {
    setModalCategoryId(category.id);
    setIsExpenseModalOpen(true);
  };

  const handleQuickContribute = (category: Category) => {
    setModalCategoryId(category.id);
    setIsContributionModalOpen(true);
  };

  const groupKeys = Object.keys(CATEGORY_GROUPS_META) as CategoryGroupId[];

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 animate-page">
      {/* Page Header with Apple HIG Surface Glow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content tracking-tight">
            {tCat.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {tCat.subtitle}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setCategoryToEdit(null);
            setIsCreateModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          {tCat.newCategory}
        </Button>
      </div>

      {/* Apple Intelligence Category Analytics Hub */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-card bg-surface backdrop-blur-xl border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="font-medium">{language === 'ar' ? 'مجموع الأصناف' : 'Total Catégories'}</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-content tabular-nums">
            {categoryStats.activeCategoriesCount}
          </div>
          <span className="text-caption text-muted block mt-0.5">
            {categoryStats.activeGoalsCount} {language === 'ar' ? 'أهداف ادخار' : 'objectifs actifs'}
          </span>
        </div>

        <div className="p-4 rounded-card bg-surface backdrop-blur-xl border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="font-medium">{tCat.spentThisMonth}</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            <MoneyText amount={categoryStats.totalSpent} />
          </div>
          <span className="text-caption text-muted block mt-0.5">
            {language === 'ar' ? 'خلال هذا الشهر' : 'Total dépenses du mois'}
          </span>
        </div>

        <div className="p-4 rounded-card bg-surface backdrop-blur-xl border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="font-medium">{language === 'ar' ? 'الأكثر استهلاكاً' : 'Plus forte dépense'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-content truncate">
            {categoryStats.topCategory ? getCategoryName(categoryStats.topCategory, language) : '—'}
          </div>
          <span className="text-caption text-amber-600 dark:text-amber-400 font-semibold block mt-0.5 tabular-nums">
            <MoneyText amount={categoryStats.topCatAmount} />
          </span>
        </div>

        <div className="p-4 rounded-card bg-surface backdrop-blur-xl border border-border-subtle shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span className="font-medium">{language === 'ar' ? 'أهداف الادخار' : 'Objectifs Actifs'}</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {categoryStats.activeGoalsCount}
          </div>
          <span className="text-caption text-muted block mt-0.5">
            {language === 'ar' ? 'قيد الإنجاز' : 'En cours d’épargne'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Apple Segmented Tab Control */}
          <div className="flex items-center gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-control border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-control text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-surface text-content font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-muted hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>
                {tCat.tabs.all} (
                <span className="tabular-nums">
                  {categories.filter((c: Category) => !c.isArchived).length}
                </span>
                )
              </span>
            </button>

            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 rounded-control text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'goals'
                  ? 'bg-surface text-content font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-muted hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>
                {tCat.tabs.goals} (
                <span className="tabular-nums">
                  {categories.filter((c: Category) => c.isGoal && !c.isArchived).length}
                </span>
                )
              </span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-1.5 rounded-control text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-surface text-content font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-muted hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                {tCat.tabs.expenses} (
                <span className="tabular-nums">
                  {categories.filter((c: Category) => !c.isGoal && !c.isArchived).length}
                </span>
                )
              </span>
            </button>

            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-control text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'archived'
                  ? 'bg-surface text-content font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-muted hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>
                {tCat.tabs.archived} (
                <span className="tabular-nums">
                  {categories.filter((c: Category) => c.isArchived).length}
                </span>
                )
              </span>
            </button>
          </div>

          {/* Controls: View Mode & Search */}
          <div className="flex items-center gap-2">
            {/* Localized Apple Glass Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tCat.filterPlaceholder}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-control border border-border-subtle bg-surface backdrop-blur-xl text-content placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Structured Category Taxonomy Filter Pills (iOS 18 Horizontal Capsule Bar) */}
        <div className="relative after:pointer-events-none after:absolute after:inset-y-0 after:end-0 after:w-8 after:bg-gradient-to-l after:from-canvas after:to-transparent">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pe-7 scrollbar-none">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-2.5 py-1 rounded-full text-caption font-medium transition-all shrink-0 border ${
              selectedGroup === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-muted border-border-subtle hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tCat.groupFilterAll}
          </button>

          {groupKeys.map((groupId) => {
            const meta = CATEGORY_GROUPS_META[groupId];
            const isSelected = selectedGroup === groupId;
            const groupLabel = getCategoryGroupName(groupId, language);
            return (
              <button
                key={groupId}
                onClick={() => setSelectedGroup(groupId)}
                className={`px-2.5 py-1 rounded-full text-caption font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? `bg-surface-raised text-content border-border-subtle ring-1 ring-border-subtle shadow-xs`
                    : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-muted border-border-subtle hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getCategoryVisualColor(groupId) }}
                />
                <span>{groupLabel}</span>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Apple Bento Grid of Categories */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-5 h-5" />}
          title={tCat.noCategoriesMatch}
          description={tCat.noCategoriesDesc}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCategoryToEdit(null);
                setIsCreateModalOpen(true);
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              {tCat.newCategory}
            </Button>
          }
        />
      ) : (
        /* Compact List View (macOS Sequoia HIG) */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="rounded-card sm:rounded-card bg-surface backdrop-blur-2xl border border-border-subtle shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden"
        >
          {visibleCategories.map((category: Category) => {
            const IconComp = getCategoryIcon(category.icon);
            const categoryName = getCategoryName(category, language);
            const resolvedGroup = resolveCategoryGroup(category);
            const groupName = getCategoryGroupName(resolvedGroup, language);
            const spentThisMonth = calculateCategorySpentAmount(category.id, transactions, currentMonth);
            const goalCalc = category.isGoal ? calculateGoalProgress(category, transactions) : null;
            const monthlyBudget = Number(category.monthlyBudget) || 0;
            const budgetProgress = monthlyBudget > 0 ? Math.min(100, Math.round((spentThisMonth / monthlyBudget) * 100)) : 0;
            const progressColor = spentThisMonth > monthlyBudget && monthlyBudget > 0 ? 'bg-negative' : budgetProgress >= 80 ? 'bg-amber-500' : 'bg-accent';

            return (
              <motion.div
                key={category.id}
                variants={itemVariants}
                onClick={() => setSelectedCategory(category)}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-control flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: `${getCategoryVisualColor(category.id)}20`,
                      color: getCategoryVisualColor(category.id),
                      border: `1px solid ${getCategoryVisualColor(category.id)}35`,
                    }}
                  >
                    <IconComp className="w-5 h-5 stroke-[2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="min-w-0 flex-1 font-semibold text-sm text-content truncate">
                        {categoryName}
                      </h4>
                      {groupName && (
                        <span className="text-caption font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-black/[0.04] dark:border-white/[0.06] shrink-0 hidden sm:inline-block">
                          {groupName}
                        </span>
                      )}
                      <span
                        className={`text-caption font-bold px-1.5 py-0.2 rounded-control ${
                          category.isGoal
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-muted'
                        }`}
                      >
                        {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
                      </span>
                    </div>

                    {/* Clean subcategory icon glyphs without text */}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {category.subcategories.slice(0, 5).map((sub) => {
                          const SubIcon = getCategoryIcon(sub.icon || 'Folder');
                          return (
                            <div
                              key={sub.id}
                              title={getSubCategoryName(sub, language)}
                              className="w-5 h-5 rounded-control bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-muted"
                            >
                              <SubIcon className="w-3 h-3 stroke-[2]" />
                            </div>
                          );
                        })}
                        {category.subcategories.length > 5 && (
                          <span className="text-caption text-muted font-mono">
                            +{category.subcategories.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                  <div className="min-w-20 text-end text-xs font-semibold text-content tabular-nums">
                    <MoneyText amount={category.isGoal && goalCalc ? goalCalc.savedAmount : spentThisMonth} />
                  </div>
                  {!category.isGoal && <label className="flex min-h-11 items-center gap-1.5 text-[10px] text-muted" onClick={(event) => event.stopPropagation()}>
                    <span>{language === 'ar' ? 'ميزانية' : 'Budget'}</span>
                    <input type="number" min="0" step="0.01" defaultValue={category.monthlyBudget || ''} aria-label={`${categoryName} monthly budget`} onBlur={(event) => { const value = Number(event.currentTarget.value); const next = Number.isFinite(value) && value > 0 ? value : null; if (next !== (category.monthlyBudget || null)) updateCategory(category.id, { monthlyBudget: next }); }} className="h-9 w-24 rounded-control border border-border-subtle bg-canvas px-2 text-xs text-content" />
                  </label>}
                  {!category.isGoal && <span className="text-[10px] font-semibold text-muted tabular-nums">{monthlyBudget > 0 ? `${budgetProgress}%` : '—'}</span>}
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleQuickExpense(category); }} className="flex min-h-11 min-w-11 items-center justify-center rounded-control bg-surface-raised text-content hover:bg-accent/10 hover:text-accent" title={tCat.quickExpense}><Plus className="h-4 w-4" /></button>
                </div>
                {!category.isGoal && <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised sm:ms-[52px]" role="progressbar" aria-valuemin={0} aria-valuemax={monthlyBudget || 100} aria-valuenow={monthlyBudget ? Math.min(spentThisMonth, monthlyBudget) : 0} aria-label={`${categoryName} budget progress`}>
                  <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${monthlyBudget > 0 ? budgetProgress : 0}%` }} />
                </div>}
              </motion.div>
            );
          })}
        </motion.div>
      )}
      {unusedCount > 0 && activeTab !== 'archived' && (
        <button type="button" onClick={() => setShowUnused((value) => !value)} className="min-h-11 rounded-control px-3 text-sm font-medium text-accent hover:bg-surface-raised">
          {language === 'ar' ? `${showUnused ? 'إخفاء' : 'عرض'} ${unusedCount} فئات غير مستخدمة` : language === 'fr' ? `${showUnused ? 'Masquer' : 'Afficher'} ${unusedCount} catégories inutilisées` : `${showUnused ? 'Hide' : 'Show'} ${unusedCount} unused`}
        </button>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
        defaultGroup={selectedGroup !== 'all' ? selectedGroup : undefined}
      />

      <CategoryDetailModal
        isOpen={Boolean(selectedCategory)}
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onEdit={handleOpenEdit}
        onAddContribution={handleQuickContribute}
        onAddExpense={handleQuickExpense}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        defaultCategoryId={modalCategoryId}
      />

      <AddContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        defaultCategoryId={modalCategoryId}
      />
    </div>
  );
};
