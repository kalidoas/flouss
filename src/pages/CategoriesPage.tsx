import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { CATEGORY_GROUPS_META } from '../utils/categoryTheme';
import { getCategoryIcon } from '../utils/icons';
import { formatMAD, getCurrentMonthStr } from '../utils/formatters';
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 26 } },
};

export const CategoriesPage: React.FC = () => {
  const { categories, transactions, language } = useAppStore();
  const tCat = translations[language].categories;
  const currentMonth = getCurrentMonthStr();

  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'expenses' | 'archived'>('all');
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroupId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      if (tx.type === 'expense' && tx.categoryId && tx.date.startsWith(currentMonth)) {
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

    // Group filter
    if (selectedGroup !== 'all') {
      if (cat.group !== selectedGroup) return false;
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
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {tCat.title}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
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
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">{language === 'ar' ? 'مجموع الأصناف' : 'Total Catégories'}</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tabular-nums">
            {categoryStats.activeCategoriesCount}
          </div>
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            {categoryStats.activeGoalsCount} {language === 'ar' ? 'أهداف ادخار' : 'objectifs actifs'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">{tCat.spentThisMonth}</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatMAD(categoryStats.totalSpent, false, language)}
          </div>
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            {language === 'ar' ? 'خلال هذا الشهر' : 'Total dépenses du mois'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">{language === 'ar' ? 'الأكثر استهلاكاً' : 'Plus forte dépense'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
            {categoryStats.topCategory ? getCategoryName(categoryStats.topCategory, language) : '—'}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5 tabular-nums">
            {categoryStats.topCatAmount > 0 ? formatMAD(categoryStats.topCatAmount, false, language) : '0 DH'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-medium">{language === 'ar' ? 'أهداف الادخار' : 'Objectifs Actifs'}</span>
            <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {categoryStats.activeGoalsCount}
          </div>
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            {language === 'ar' ? 'قيد الإنجاز' : 'En cours d’épargne'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Apple Segmented Tab Control */}
          <div className="flex items-center gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'goals'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'archived'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
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
            {/* View Mode Switcher: Grid vs Compact List */}
            <div className="flex items-center gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl border border-black/[0.04] dark:border-white/[0.06] shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Bento Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Compact List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Localized Apple Glass Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tCat.filterPlaceholder}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Structured Category Taxonomy Filter Pills (iOS 18 Horizontal Capsule Bar) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 border ${
              selectedGroup === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs'
                : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-black/[0.05] dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 border flex items-center gap-1.5 ${
                  isSelected
                    ? `${meta.badgeClass} ring-1 ring-current shadow-xs`
                    : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-black/[0.05] dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{groupLabel}</span>
              </button>
            );
          })}
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
      ) : viewMode === 'grid' ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredCategories.map((category: Category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <CategoryCard
                category={category}
                onClick={() => setSelectedCategory(category)}
                onQuickContribute={() => handleQuickContribute(category)}
                onQuickExpense={() => handleQuickExpense(category)}
                onSetGoal={() => handleSetGoal(category)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Compact List View (macOS Sequoia HIG) */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden"
        >
          {filteredCategories.map((category: Category) => {
            const IconComp = getCategoryIcon(category.icon);
            const categoryName = getCategoryName(category, language);
            const groupName = category.group ? getCategoryGroupName(category.group, language) : null;
            const spentThisMonth = calculateCategorySpentAmount(category.id, transactions, currentMonth);
            const goalCalc = category.isGoal ? calculateGoalProgress(category, transactions) : null;

            return (
              <motion.div
                key={category.id}
                variants={itemVariants}
                onClick={() => setSelectedCategory(category)}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      border: `1px solid ${category.color}35`,
                    }}
                  >
                    <IconComp className="w-5 h-5 stroke-[2.2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                        {categoryName}
                      </h4>
                      {groupName && (
                        <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-black/[0.04] dark:border-white/[0.06] shrink-0 hidden sm:inline-block">
                          {groupName}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          category.isGoal
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
                      </span>
                    </div>

                    {/* Clean subcategory icon glyphs without text */}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {category.subcategories.slice(0, 5).map((sub) => {
                          const SubIcon = getCategoryIcon(sub.icon);
                          return (
                            <div
                              key={sub.id}
                              title={getSubCategoryName(sub, language)}
                              className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-zinc-500 dark:text-zinc-400"
                            >
                              <SubIcon className="w-3 h-3 stroke-[2]" />
                            </div>
                          );
                        })}
                        {category.subcategories.length > 5 && (
                          <span className="text-[9px] text-zinc-400 font-mono">
                            +{category.subcategories.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {category.isGoal && goalCalc ? (
                      <>
                        <div className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
                          {formatMAD(goalCalc.savedAmount, false, language)}
                        </div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                          {goalCalc.progressPercent}%
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
                          {formatMAD(spentThisMonth, false, language)}
                        </div>
                        <span className="text-[10px] text-zinc-400 block">
                          {tCat.spentThisMonth}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickExpense(category);
                    }}
                    className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                    title={tCat.quickExpense}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCategoryToEdit(null);
        }}
        categoryToEdit={categoryToEdit}
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
