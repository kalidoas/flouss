import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Category } from '../types';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryModal } from '../components/categories/CategoryModal';
import { CategoryDetailModal } from '../components/categories/CategoryDetailModal';
import { AddExpenseModal } from '../components/transactions/AddExpenseModal';
import { AddContributionModal } from '../components/transactions/AddContributionModal';
import { Button } from '../components/common/Button';
import { translations } from '../i18n/translations';
import { getCategoryName, getSubCategoryName } from '../utils/i18nHelpers';
import { Plus, Search, Layers, Target, ShoppingBag, Archive } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const CategoriesPage: React.FC = () => {
  const { categories, language } = useAppStore();
  const tCat = translations[language].categories;

  const [activeTab, setActiveTab] = useState<'all' | 'goals' | 'expenses' | 'archived'>('all');
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

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {tCat.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
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
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-[#f1f0ee] dark:bg-[#282828] rounded-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tCat.tabs.all} ({categories.filter((c: Category) => !c.isArchived).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'goals'
                ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{tCat.tabs.goals} ({categories.filter((c: Category) => c.isGoal && !c.isArchived).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{tCat.tabs.expenses} ({categories.filter((c: Category) => !c.isGoal && !c.isArchived).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{tCat.tabs.archived} ({categories.filter((c: Category) => c.isArchived).length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#787774] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer une catégorie..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2]"
          />
        </div>
      </div>

      {/* Grid of Categories */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-5 h-5" />}
          title="Aucune catégorie ne correspond à vos filtres"
          description="Créez une catégorie pour mieux organiser vos budgets et objectifs d'épargne."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category: Category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={() => setSelectedCategory(category)}
              onQuickContribute={() => handleQuickContribute(category)}
              onQuickExpense={() => handleQuickExpense(category)}
              onSetGoal={() => handleSetGoal(category)}
            />
          ))}
        </div>
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
