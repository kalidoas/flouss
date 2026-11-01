import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Category, CategoryGroupId } from '../types';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryModal } from '../components/categories/CategoryModal';
import { CategoryDetailModal } from '../components/categories/CategoryDetailModal';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { AddContributionModal } from '../components/transactions/AddContributionModal';
import { Button } from '../components/common/Button';
import { translations } from '../i18n/translations';
import { getCategoryName, getSubCategoryName, getCategoryGroupName } from '../utils/i18nHelpers';
import { CATEGORY_GROUPS_META } from '../utils/categoryTheme';
import { Plus, Search, Layers, Target, ShoppingBag, Archive, Sparkles } from 'lucide-react';
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
  const { categories, language } = useAppStore();
  const tCat = translations[language].categories;

  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'expenses' | 'archived'>('all');
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroupId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Quick modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState<string | undefined>();

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

          {/* Localized Apple Glass Search Input */}
          <div className="relative min-w-[220px]">
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
      ) : (
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
