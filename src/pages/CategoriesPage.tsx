import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Category, CategoryGroupId } from '../types';
import { CategoryModal } from '../components/categories/CategoryModal';
import { CategoryDetailModal } from '../components/categories/CategoryDetailModal';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { AddContributionModal } from '../components/transactions/AddContributionModal';
import { Button } from '../components/common/Button';
import { translations } from '../i18n/translations';
import { getCategoryName, getSubCategoryName, getCategoryGroupName } from '../utils/i18nHelpers';
import { CATEGORY_GROUPS_META, resolveCategoryGroup } from '../utils/categoryTheme';
import { getCategoryIcon } from '../utils/icons';
import { getCurrentMonthStr } from '../utils/formatters';
import { getCategoryVisualColor } from '../utils/categoryColor';
import { Money } from '../components/common/Money';
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
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 26 } },
};

export const CategoriesPage: React.FC = () => {
  const { categories = [], transactions = [], language, updateCategory } = useAppStore();
  const catList = categories || [];
  const tCat = translations[language].categories;
  const tCatPage = translations[language].categoriesPage;
  const currentMonth = getCurrentMonthStr();

  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'expenses' | 'archived'>('all');
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroupId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showUnused, setShowUnused] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Quick modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState<string | undefined>();

  // Filter categories
  const filteredCategories = catList.filter((cat: Category) => {
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
    <div className="mx-auto w-full min-w-0 max-w-[1280px] space-y-5 animate-page select-text pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-content">
            {tCat.title}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {tCat.subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-surface text-text font-semibold px-5 py-2 text-sm shadow-sm hover:bg-surface-2 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{tCat.newCategory}</span>
        </button>
      </div>

      {/* Non-sticky Glass Toolbar: Filter Tabs + Search + Group Popover (No bleed-through or overlap) */}
      <div className="rounded-2xl bg-surface p-3 sm:p-4 border border-border-subtle shadow-xs dark:bg-surface/5 dark:backdrop-blur-2xl dark:border-border/10 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Segmented Tab Control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-canvas/[0.04] dark:bg-surface/[0.04] rounded-full border border-border/[0.06] dark:border-border/[0.06]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-surface text-accent-contrast dark:bg-surface dark:text-text shadow-xs'
                  : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast'
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'goals'
                  ? 'bg-surface text-accent-contrast dark:bg-surface dark:text-text shadow-xs'
                  : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast'
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-surface text-accent-contrast dark:bg-surface dark:text-text shadow-xs'
                  : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast'
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-surface text-accent-contrast dark:bg-surface dark:text-text shadow-xs'
                  : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast'
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

          {/* Scrollable category group tabs with soft edge fades */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="relative min-w-0">
              <div role="group" aria-label={tCat.groupFilterAll} className="flex min-w-0 items-center gap-1.5 overflow-x-auto px-1 py-1 scrollbar-none">
                <button
                  type="button"
                  aria-pressed={selectedGroup === 'all'}
                  onClick={() => setSelectedGroup('all')}
                  className={`min-h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors ${selectedGroup === 'all' ? 'border-border-strong bg-surface-raised text-content' : 'border-border-subtle bg-surface text-muted hover:text-content'}`}
                >
                  {tCat.groupFilterAll}
                </button>
                {groupKeys.map((groupId) => {
                  const isSelected = selectedGroup === groupId;
                  return (
                    <button
                      key={groupId}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedGroup(groupId)}
                      className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${isSelected ? 'border-border-strong bg-surface-raised text-content' : 'border-border-subtle bg-surface text-muted hover:text-content'}`}
                    >
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: getCategoryVisualColor(groupId) }} />
                      {getCategoryGroupName(groupId, language)}
                    </button>
                  );
                })}
              </div>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 w-5 bg-gradient-to-r from-surface to-transparent dark:from-bg rtl:bg-gradient-to-l" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-5 bg-gradient-to-l from-surface to-transparent dark:from-bg rtl:bg-gradient-to-r" />
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tCat.filterPlaceholder}
                className="min-h-10 w-full rounded-full border border-border-subtle bg-surface px-3 ps-8 text-xs text-content placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compact category list */}
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
        <div
          className="overflow-hidden rounded-2xl border border-border-subtle bg-surface divide-y divide-border-subtle"
        >
          {visibleCategories.map((category: Category, index) => {
            const IconComp = getCategoryIcon(category.icon);
            const categoryName = getCategoryName(category, language);
            const spentThisMonth = calculateCategorySpentAmount(category.id, transactions, currentMonth);
            const goalCalc = category.isGoal ? calculateGoalProgress(category, transactions) : null;
            const monthlyBudget = Number(category.monthlyBudget) || 0;
            const budgetProgress = monthlyBudget > 0 ? Math.min(100, Math.round((spentThisMonth / monthlyBudget) * 100)) : 0;
            const progressColor = spentThisMonth > monthlyBudget && monthlyBudget > 0 ? 'bg-negative' : budgetProgress >= 80 ? 'bg-warning' : 'bg-accent';
            const catColor = getCategoryVisualColor(category.id);

            return (
              <motion.div
                key={category.id}
                variants={itemVariants}
                initial={index < 8 ? 'hidden' : false}
                animate={index < 8 ? 'show' : false}
                transition={index < 8 ? { delay: Math.min(index, 7) * 0.03 } : undefined}
                onClick={() => setSelectedCategory(category)}
                className="group grid grid-cols-1 items-center gap-2 p-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(8rem,0.8fr)_minmax(9rem,1fr)_auto] sm:gap-4 sm:px-4 hover:bg-surface-raised/50 transition-colors cursor-pointer"
              >
                {/* Top Row: Icon + Names + Spent Total */}
                <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${catColor}20`,
                        color: catColor,
                        border: `1px solid ${catColor}35`,
                      }}
                    >
                      <IconComp className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h4 className="truncate font-semibold text-sm text-content" title={categoryName}>
                          {categoryName}
                        </h4>
                        {category.isGoal && <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">{tCat.goalBadge}</span>}
                      </div>
                    </div>
                </div>

                <div className="min-w-0 sm:col-start-2 sm:row-start-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-muted">{category.isGoal ? tCatPage.saved : tCatPage.spentThisMonth}</span>
                    <span className="shrink-0 font-semibold text-content"><Money amount={category.isGoal && goalCalc ? goalCalc.savedAmount : spentThisMonth} /></span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised" role="progressbar" aria-label={category.isGoal ? `${categoryName}: ${tCatPage.goalLabel}` : `${categoryName}: ${tCatPage.budgetConsumed}`} aria-valuemin={0} aria-valuemax={category.isGoal ? 100 : monthlyBudget || 100} aria-valuenow={category.isGoal ? goalCalc?.progressPercent || 0 : monthlyBudget ? Math.min(spentThisMonth, monthlyBudget) : 0}>
                    <div className={`h-full rounded-full ${category.isGoal ? 'bg-accent' : progressColor}`} style={{ width: `${category.isGoal ? Math.min(100, goalCalc?.progressPercent || 0) : budgetProgress}%` }} />
                  </div>
                </div>

                <div className="col-start-1 row-start-3 flex min-w-0 items-center justify-between gap-3 sm:contents" onClick={(event) => event.stopPropagation()}>
                  {!category.isGoal ? (
                    <label className="flex items-center gap-1.5 text-xs text-muted sm:col-start-3 sm:row-start-1">
                      <span className="sr-only">{categoryName}: {tCatPage.budgetLabel}</span>
                      <span aria-hidden="true" className="whitespace-nowrap text-[10px] sm:text-xs">{tCatPage.budgetLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        inputMode="decimal"
                        aria-label={`${categoryName}: ${tCatPage.budgetLabel}`}
                        defaultValue={monthlyBudget || ''}
                        placeholder="—"
                        onBlur={(event) => {
                          const next = Number(event.currentTarget.value);
                          if (Number.isFinite(next) && next >= 0 && next !== monthlyBudget) {
                            updateCategory(category.id, { monthlyBudget: next || null });
                          }
                        }}
                        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                        className="min-h-10 w-16 rounded-lg border border-border-subtle bg-canvas px-2 text-end text-content tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:w-24"
                      />
                      <span>MAD</span>
                    </label>
                  ) : (
                    <span className="text-xs text-muted sm:col-start-3 sm:row-start-1">{category.targetAmount ? <><Money amount={category.targetAmount} /> {category.targetDate ? `· ${category.targetDate}` : ''}</> : ''}</span>
                  )}

                  <button type="button" title={category.isGoal ? tCatPage.saveButton : tCatPage.spendButton} aria-label={category.isGoal ? tCatPage.saveButton : tCatPage.spendButton} onClick={() => category.isGoal ? handleQuickContribute(category) : handleQuickExpense(category)} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-border-subtle text-xs text-muted hover:bg-surface-raised hover:text-content">
                    <Plus className="h-4 w-4 stroke-[2]" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {unusedCount > 0 && activeTab !== 'archived' && (
        <button type="button" onClick={() => setShowUnused((value) => !value)} className="min-h-10 rounded-full px-4 text-xs font-medium text-accent hover:bg-surface/[0.04] border border-border/[0.06] transition-all">
          {showUnused ? tCatPage.hideUnusedCategories.replace('{count}', String(unusedCount)) : tCatPage.showUnusedCategories.replace('{count}', String(unusedCount))}
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
