import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronDown,
  Check,
  Folder,
  Minus,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { DropdownPortal } from '../components/common/DropdownPortal';

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

  // Custom Glass Group Dropdown Popover
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const groupDropdownTriggerRef = useRef<HTMLButtonElement>(null);

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
    <div className="max-w-[1280px] mx-auto space-y-5 animate-page select-text pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
            {tCat.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {tCat.subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setCategoryToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white text-zinc-950 font-semibold px-5 py-2 text-sm shadow-sm hover:bg-zinc-200 transition-all active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{tCat.newCategory}</span>
        </button>
      </div>

      {/* Unified 4-column Bento KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Categories */}
        <div
          className="rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 mb-1.5">
            <span className="truncate">{language === 'ar' ? 'مجموع الأصناف' : 'Total Catégories'}</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            {categoryStats.activeCategoriesCount}
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1 truncate">
            {categoryStats.activeGoalsCount} {language === 'ar' ? 'أهداف ادخار' : 'objectifs actifs'}
          </span>
        </div>

        {/* Spent this month */}
        <div
          className="rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(244,63,94,0.14), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 mb-1.5">
            <span className="truncate">{tCat.spentThisMonth}</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-400 tabular-nums">
            <MoneyText amount={categoryStats.totalSpent} />
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1 truncate">
            {language === 'ar' ? 'خلال هذا الشهر' : 'Total dépenses du mois'}
          </span>
        </div>

        {/* Plus forte dépense */}
        <div
          className="rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.12), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 mb-1.5">
            <span className="truncate">{language === 'ar' ? 'الأكثر استهلاكاً' : 'Plus forte dépense'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="text-base font-bold text-white truncate">
            {categoryStats.topCategory ? getCategoryName(categoryStats.topCategory, language) : '—'}
          </div>
          <span className="text-xs text-amber-400 font-semibold block mt-1 tabular-nums">
            <MoneyText amount={categoryStats.topCatAmount} />
          </span>
        </div>

        {/* Objectifs Actifs */}
        <div
          className="rounded-2xl bg-white/5 p-4 sm:p-5 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(52,211,153,0.14), transparent 70%)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400 mb-1.5">
            <span className="truncate">{language === 'ar' ? 'أهداف الادخار' : 'Objectifs Actifs'}</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
            {categoryStats.activeGoalsCount}
          </div>
          <span className="text-[11px] text-zinc-500 block mt-1 truncate">
            {language === 'ar' ? 'قيد الإنجاز' : 'En cours d’épargne'}
          </span>
        </div>
      </div>

      {/* Non-sticky Glass Toolbar: Filter Tabs + Search + Group Popover (No bleed-through or overlap) */}
      <div className="rounded-2xl bg-white/5 p-3 sm:p-4 backdrop-blur-2xl border border-white/10 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Segmented Tab Control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white/[0.04] backdrop-blur-md rounded-full border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
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
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
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
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
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
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
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

          {/* Group Popover Dropdown & Search Input */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Glass Group Popover Dropdown */}
            <div className="relative inline-block shrink-0">
              <button
                ref={groupDropdownTriggerRef}
                type="button"
                aria-expanded={isGroupDropdownOpen}
                onClick={() => setIsGroupDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 outline-none shadow-xs hover:border-white/[0.18] hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                {selectedGroup !== 'all' ? (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: getCategoryVisualColor(selectedGroup) }}
                  />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                )}
                <span className="truncate max-w-[130px]">
                  {selectedGroup === 'all'
                    ? tCat.groupFilterAll
                    : getCategoryGroupName(selectedGroup, language)}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    isGroupDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              <DropdownPortal
                isOpen={isGroupDropdownOpen}
                onClose={() => setIsGroupDropdownOpen(false)}
                triggerRef={groupDropdownTriggerRef}
                align="end"
                minWidth={210}
                className="min-w-[210px] overflow-y-auto no-scrollbar rounded-2xl bg-[#12131C]/95 backdrop-blur-2xl border border-white/[0.12] p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)]"
              >
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroup('all');
                      setIsGroupDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                      selectedGroup === 'all'
                        ? 'bg-white text-zinc-950 font-bold shadow-xs'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 opacity-60" />
                      <span>{tCat.groupFilterAll}</span>
                    </div>
                    {selectedGroup === 'all' && (
                      <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
                    )}
                  </button>

                  <div className="h-px bg-white/[0.06] my-1" />

                  {groupKeys.map((groupId) => {
                    const isSelected = selectedGroup === groupId;
                    const groupLabel = getCategoryGroupName(groupId, language);
                    const color = getCategoryVisualColor(groupId);

                    return (
                      <button
                        key={groupId}
                        type="button"
                        onClick={() => {
                          setSelectedGroup(groupId);
                          setIsGroupDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                          isSelected
                            ? 'bg-white text-zinc-950 font-bold shadow-xs'
                            : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate">{groupLabel}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </DropdownPortal>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[220px] flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tCat.filterPlaceholder}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-full border border-white/[0.08] bg-black/40 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Bento Grid of Categories */}
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-3.5"
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
            const progressColor = spentThisMonth > monthlyBudget && monthlyBudget > 0 ? 'bg-rose-500' : budgetProgress >= 80 ? 'bg-amber-500' : 'bg-indigo-500';
            const catColor = getCategoryVisualColor(category.id);

            return (
              <motion.div
                key={category.id}
                variants={itemVariants}
                onClick={() => setSelectedCategory(category)}
                className="group relative flex flex-col justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_28px_-10px_rgba(0,0,0,0.5)]"
              >
                {/* Top Row: Icon + Names + Spent Total */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `${catColor}20`,
                        color: catColor,
                        border: `1px solid ${catColor}35`,
                      }}
                    >
                      <IconComp className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-semibold text-sm text-zinc-100 truncate group-hover:text-white transition-colors" title={categoryName}>
                          {categoryName}
                        </h4>
                        {groupName && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.06] shrink-0">
                            {groupName}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            category.isGoal
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                              : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06]'
                          }`}
                        >
                          {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
                        </span>
                      </div>

                      {/* Subcategory glyphs */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {category.subcategories.slice(0, 5).map((sub) => {
                            const SubIcon = getCategoryIcon(sub.icon || 'Folder');
                            return (
                              <div
                                key={sub.id}
                                title={getSubCategoryName(sub, language)}
                                className="w-5 h-5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400"
                              >
                                <SubIcon className="w-3 h-3 stroke-[2]" />
                              </div>
                            );
                          })}
                          {category.subcategories.length > 5 && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              +{category.subcategories.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                      <MoneyText amount={category.isGoal && goalCalc ? goalCalc.savedAmount : spentThisMonth} />
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {category.isGoal ? (language === 'ar' ? 'المدخر' : 'Épargné') : (language === 'ar' ? 'مصروف الشهر' : 'Dépensé')}
                    </span>
                  </div>
                </div>

                {/* Middle: Progress Bar */}
                {!category.isGoal ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{language === 'ar' ? 'استهلاك الميزانية' : 'Budget consommé'}</span>
                      <span className="font-semibold tabular-nums text-zinc-300">
                        {monthlyBudget > 0 ? `${budgetProgress}%` : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuemin={0} aria-valuemax={monthlyBudget || 100} aria-valuenow={monthlyBudget ? Math.min(spentThisMonth, monthlyBudget) : 0}>
                      <div className={`h-full rounded-full transition-all duration-300 ${progressColor}`} style={{ width: `${monthlyBudget > 0 ? budgetProgress : 0}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>{language === 'ar' ? 'الهدف' : 'Objectif'}: <MoneyText amount={category.targetAmount || 0} /></span>
                      <span className="font-semibold tabular-nums text-indigo-300">{goalCalc ? `${goalCalc.progressPercent}%` : '0%'}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${goalCalc ? Math.min(100, goalCalc.progressPercent) : 0}%` }} />
                    </div>
                  </div>
                )}

                {/* Bottom Row: Inline Budget Stepper / Goal Details + Quick Action */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] gap-2" onClick={(e) => e.stopPropagation()}>
                  {!category.isGoal ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-400">{language === 'ar' ? 'الميزانية:' : 'Budget:'}</span>
                      <div className="flex items-center rounded-lg bg-black/40 border border-white/[0.08] p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(category.monthlyBudget) || 0;
                            const next = Math.max(0, cur - 50);
                            updateCategory(category.id, { monthlyBudget: next > 0 ? next : null });
                          }}
                          className="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                          title="-50 MAD"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          defaultValue={category.monthlyBudget || ''}
                          key={category.monthlyBudget || 'empty'}
                          onBlur={(e) => {
                            const val = Number(e.currentTarget.value);
                            const next = Number.isFinite(val) && val > 0 ? val : null;
                            if (next !== (category.monthlyBudget || null)) {
                              updateCategory(category.id, { monthlyBudget: next });
                            }
                          }}
                          aria-label={`${categoryName} monthly budget`}
                          className="w-16 h-6 bg-transparent text-center text-xs font-semibold text-white outline-none tabular-nums"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(category.monthlyBudget) || 0;
                            const next = cur + 50;
                            updateCategory(category.id, { monthlyBudget: next });
                          }}
                          className="h-6 w-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                          title="+50 MAD"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400">
                      {category.targetDate ? `${language === 'ar' ? 'التاريخ المستهدف:' : 'Cible:'} ${category.targetDate}` : ''}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 ms-auto">
                    {category.isGoal ? (
                      <button
                        type="button"
                        onClick={() => handleQuickContribute(category)}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium px-3 py-1 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{language === 'ar' ? 'ادخار' : 'Épargner'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuickExpense(category)}
                        className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.08] hover:border-rose-500/30 text-zinc-300 hover:text-rose-300 text-xs font-medium px-3 py-1 transition-all"
                        title={tCat.quickExpense}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{language === 'ar' ? 'دفع' : 'Dépense'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      {unusedCount > 0 && activeTab !== 'archived' && (
        <button type="button" onClick={() => setShowUnused((value) => !value)} className="min-h-10 rounded-full px-4 text-xs font-medium text-indigo-300 hover:bg-white/[0.04] border border-white/[0.06] transition-all">
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
