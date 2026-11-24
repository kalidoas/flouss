import React, { useState, useEffect } from 'react';
import { Category, SubCategory, CategoryGroupId } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { IconPicker } from '../common/IconPicker';
import { ColorPicker } from '../common/ColorPicker';
import { getCategoryIcon } from '../../utils/icons';
import { formatMAD } from '../../utils/formatters';
import { translations } from '../../i18n/translations';
import { getCategoryName, getSubCategoryName, getCategoryGroupName } from '../../utils/i18nHelpers';
import { CATEGORY_GROUPS_META, resolveCategoryGroup } from '../../utils/categoryTheme';
import { getCategoryVisualColor } from '../../utils/categoryColor';
import { Target, Layers, Calculator, Plus, Trash2, X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  initialIsGoal?: boolean;
  defaultGroup?: CategoryGroupId;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  initialIsGoal = false,
  defaultGroup,
}) => {
  const { addCategory, updateCategory, language } = useAppStore();
  const tCat = translations[language].categories;
  const tCommon = translations[language].common;

  const [name, setName] = useState('');
  const [group, setGroup] = useState<CategoryGroupId>(defaultGroup || 'lifestyle_entertainment');
  const [icon, setIcon] = useState('ShoppingBag');
  const [color, setColor] = useState('bg-positive');
  const [isGoal, setIsGoal] = useState(false);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [monthlyBudgetStr, setMonthlyBudgetStr] = useState('');
  const [durationMode, setDurationMode] = useState<'months' | 'date'>('months');
  const [targetMonthsStr, setTargetMonthsStr] = useState('6');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(getCategoryName(categoryToEdit, language));
      setGroup(resolveCategoryGroup(categoryToEdit));
      setIcon(categoryToEdit.icon);
      setColor(categoryToEdit.color);
      setIsGoal(categoryToEdit.isGoal);
      setSubcategories(categoryToEdit.subcategories ? [...categoryToEdit.subcategories] : []);
      setSelectedSubCategoryId(categoryToEdit.subCategoryId || null);
      setTargetAmountStr(categoryToEdit.targetAmount ? categoryToEdit.targetAmount.toString() : '');
      setMonthlyBudgetStr(categoryToEdit.monthlyBudget ? categoryToEdit.monthlyBudget.toString() : '');
      setTargetMonthsStr(categoryToEdit.targetMonths ? categoryToEdit.targetMonths.toString() : '6');
      setTargetDate(categoryToEdit.targetDate || '');
      setDurationMode(categoryToEdit.targetDate ? 'date' : 'months');
    } else {
      setName('');
      setGroup(defaultGroup || 'lifestyle_entertainment');
      setIcon('ShoppingBag');
      setColor('bg-positive');
      setIsGoal(initialIsGoal);
      setSubcategories([]);
      setSelectedSubCategoryId(null);
      setTargetAmountStr('');
      setMonthlyBudgetStr('');
      setTargetMonthsStr('6');
      setTargetDate('');
      setDurationMode('months');
    }
    setError('');
    setNewSubcatName('');
  }, [categoryToEdit, isOpen, initialIsGoal, defaultGroup, language]);

  const targetAmount = parseFloat(targetAmountStr.replace(/\s/g, '').replace(',', '.')) || 0;
  const monthlyBudget = parseFloat(monthlyBudgetStr.replace(/\s/g, '').replace(',', '.')) || null;
  const targetMonths = parseInt(targetMonthsStr, 10) || 1;

  const calculatePreviewMonthly = () => {
    if (!isGoal || targetAmount <= 0) return 0;
    if (durationMode === 'months') {
      return targetMonths > 0 ? Math.ceil(targetAmount / targetMonths) : targetAmount;
    } else if (targetDate) {
      const now = new Date();
      const target = new Date(targetDate);
      const diffMonths = Math.max(
        1,
        Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
      );
      return Math.ceil(targetAmount / diffMonths);
    }
    return targetAmount;
  };

  const previewMonthly = calculatePreviewMonthly();
  const IconPreview = getCategoryIcon(icon);

  const handleAddSubcat = () => {
    if (!newSubcatName.trim()) return;
    const newSub: SubCategory = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: newSubcatName.trim(),
    };
    setSubcategories([...subcategories, newSub]);
    setNewSubcatName('');
  };

  const handleRemoveSubcat = (id: string) => {
    setSubcategories(subcategories.filter((s) => s.id !== id));
    if (selectedSubCategoryId === id) {
      setSelectedSubCategoryId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(tCommon.required);
      return;
    }
    if (isGoal && targetAmount <= 0) {
      setError(tCommon.amountRequired);
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: name.trim(),
        group,
        icon,
        color,
        isGoal,
        subcategories,
        subCategoryId: isGoal ? selectedSubCategoryId : null,
        targetAmount: isGoal ? targetAmount : null,
        targetMonths: isGoal && durationMode === 'months' ? targetMonths : null,
        targetDate: isGoal && durationMode === 'date' ? targetDate : null,
        monthlyBudget: monthlyBudget && monthlyBudget > 0 ? monthlyBudget : null,
      });
    } else {
      addCategory({
        id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        group,
        icon,
        color,
        isGoal,
        isArchived: false,
        createdAt: new Date().toISOString(),
        subcategories,
        subCategoryId: isGoal ? selectedSubCategoryId : null,
        targetAmount: isGoal ? targetAmount : null,
        targetMonths: isGoal && durationMode === 'months' ? targetMonths : null,
        targetDate: isGoal && durationMode === 'date' ? targetDate : null,
        monthlyBudget: monthlyBudget && monthlyBudget > 0 ? monthlyBudget : null,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? tCommon.categoryEditTitle : tCommon.categoryNewTitle}
      subtitle={tCommon.categoryModalSubtitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Live Preview Header */}
        <div className="flex items-center gap-3 p-3.5 rounded-card bg-surface-3 dark:bg-surface/40 border border-border/50 dark:border-border">
          <div
            className="w-12 h-12 rounded-card flex items-center justify-center text-content shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          >
            <IconPreview className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-content dark:text-content text-base">
              {name.trim() || tCommon.categoryName}
            </h4>
            <span className="text-xs text-text-subtle dark:text-text-subtle">
              {isGoal ? tCommon.plannedGoal : tCommon.regularExpense}
            </span>
          </div>
        </div>

        {/* Name */}
        <Input
          label={tCommon.categoryName}
          type="text"
          placeholder={tCommon.categoryNamePlaceholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
        />

        {/* Financial Taxonomy Group */}
        <div>
          <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider mb-1.5">
            {language === 'ar' ? 'تصنيف المجموعة' : language === 'en' ? 'Category Group' : 'Groupe financier'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 bg-surface-3 dark:bg-surface/40 rounded-card border border-border/60 dark:border-border">
            {(Object.keys(CATEGORY_GROUPS_META) as CategoryGroupId[]).map((grpId) => {
              const meta = CATEGORY_GROUPS_META[grpId];
              const isSelected = group === grpId;
              const label = getCategoryGroupName(grpId, language);
              return (
                <button
                  key={grpId}
                  type="button"
                  onClick={() => setGroup(grpId)}
                  className={`px-2.5 py-1.5 rounded-control text-xs font-semibold flex items-center gap-1.5 transition-all text-left rtl:text-right ${
                    isSelected
                      ? `bg-surface-raised text-content border-border-subtle ring-1 ring-border-subtle shadow-2xs`
                      : 'bg-surface dark:bg-surface text-content dark:text-muted hover:bg-surface-2 dark:hover:bg-text-muted border border-border/60 dark:border-border/60'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryVisualColor(grpId) }}
                  />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider mb-1.5">
            {tCat.colorLabel || 'Couleur'}
          </label>
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider mb-1.5">
            {tCat.iconLabel || 'Icône'}
          </label>
          <IconPicker selectedIcon={icon} onSelect={setIcon} />
        </div>

        {/* Sub-categories management */}
        <div className="p-3.5 rounded-card bg-surface-3 dark:bg-surface/40 border border-border/60 dark:border-border space-y-2.5">
          <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider">
            {tCat.subcategoriesLabel || 'Sous-catégories'}
          </label>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {subcategories.map((sub) => (
              <span
                key={sub.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-semibold bg-surface dark:bg-surface border border-border dark:border-border text-text-content dark:text-muted"
              >
                {getSubCategoryName(sub, language)}
                <button
                  type="button"
                  onClick={() => handleRemoveSubcat(sub.id)}
                  className="text-text-subtle hover:text-negative0 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {subcategories.length === 0 && (
              <span className="text-xs text-text-subtle italic">
                {tCat.noSubcategoriesDefined || 'Aucune sous-catégorie définie'}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder={tCat.newSubcatPlaceholder || 'Ajouter une sous-catégorie...'}
              value={newSubcatName}
              onChange={(e) => setNewSubcatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubcat();
                }
              }}
              className="flex-1 py-1.5 px-3 rounded-control border border-border dark:border-border bg-surface dark:bg-bg text-xs font-medium text-content dark:text-content outline-none focus:border-positive"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubcat}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              {tCat.addSubcategory || 'Ajouter'}
            </Button>
          </div>
        </div>

        {/* Optional Monthly Budget */}
        <div>
          <Input
            label={tCat.monthlyBudgetCap || 'Plafond de budget mensuel (optionnel)'}
            type="text"
            inputMode="decimal"
            placeholder={tCat.monthlyBudgetPlaceholder || 'ex: 2 500 (laisser vide si illimité)'}
            suffix="MAD / mois"
            value={monthlyBudgetStr}
            onChange={(e) => setMonthlyBudgetStr(e.target.value)}
          />
          <p className="text-[11px] text-text-subtle mt-1">
            {tCat.monthlyBudgetHint || 'Une alerte s’affichera à 80% et 100% de ce montant dépensé dans le mois.'}
          </p>
        </div>

        {/* Goal Toggle */}
        <div className="pt-2 border-t border-border-border dark:border-border">
          <div className="flex items-center justify-between p-3 rounded-card bg-surface-3 dark:bg-surface/40 border border-border/50 dark:border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-control bg-positive dark:bg-positive text-positive dark:text-positive">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-content dark:text-content">
                  {tCat.setGoalPrompt || 'Définir un objectif d’épargne ?'}
                </p>
                <p className="text-[11px] text-text-subtle dark:text-text-subtle">
                  {tCat.setGoalPromptHint || 'Calcul automatique de la mensualité requise'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isGoal}
                onChange={(e) => setIsGoal(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border-border peer-focus:outline-none rounded-full peer dark:bg-text-muted peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-positive" />
            </label>
          </div>
        </div>

        {/* Goal Configuration Fields */}
        {isGoal && (
          <div className="space-y-4 p-4 rounded-card bg-positive/40 dark:bg-positive/20 border border-positive/60 dark:border-positive/50 animate-in fade-in duration-200">
            {/* Optional subcategory attachment */}
            {subcategories.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider mb-1.5">
                  {tCat.attachToSubcat || 'Associer l’objectif à une sous-catégorie'}
                </label>
                <select
                  value={selectedSubCategoryId || ''}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value || null)}
                  className="w-full py-2 px-3 rounded-control border border-border dark:border-border bg-surface dark:bg-bg text-xs font-semibold text-text-content dark:text-muted"
                >
                  <option value="">
                    {(tCat.globalCategoryOption || 'Catégorie globale ({name})').replace('{name}', name || '...')}
                  </option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {getSubCategoryName(sub, language)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Amount */}
            <Input
              label={tCat.targetAmountLabel || 'Montant cible (MAD)'}
              type="text"
              inputMode="decimal"
              placeholder="ex: 8000"
              suffix="MAD"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value)}
            />

            {/* Target Duration Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-text-subtle uppercase tracking-wider mb-2">
                {tCat.targetDeadlineLabel || 'Échéance de l’objectif'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDurationMode('months')}
                  className={`py-2 px-3 rounded-control text-xs font-bold border transition-all ${
                    durationMode === 'months'
                      ? 'border-positive bg-surface dark:bg-surface text-positive dark:text-positive shadow-sm'
                      : 'border-border dark:border-border text-muted dark:text-text-subtle'
                  }`}
                >
                  {tCat.durationMonths || 'Durée en mois'}
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMode('date')}
                  className={`py-2 px-3 rounded-control text-xs font-bold border transition-all ${
                    durationMode === 'date'
                      ? 'border-positive bg-surface dark:bg-surface text-positive dark:text-positive shadow-sm'
                      : 'border-border dark:border-border text-muted dark:text-text-subtle'
                  }`}
                >
                  {tCat.targetDateExact || 'Date cible exacte'}
                </button>
              </div>
            </div>

            {durationMode === 'months' ? (
              <Input
                label={tCat.monthsNumberLabel || 'Nombre de mois pour atteindre la cible'}
                type="number"
                min="1"
                max="120"
                value={targetMonthsStr}
                onChange={(e) => setTargetMonthsStr(e.target.value)}
                suffix="Mois"
              />
            ) : (
              <CustomDatePicker
                label={tCat.targetDateLabel || 'Date cible'}
                value={targetDate}
                onChange={(d) => setTargetDate(d)}
              />
            )}

            {/* Real-time Calculation Display */}
            {targetAmount > 0 && (
              <div className="p-3 bg-surface dark:bg-bg rounded-control border border-positive dark:border-positive/60 flex items-start gap-3">
                <Calculator className="w-5 h-5 text-positive shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-text-content dark:text-content">
                    {(tCat.autoCalcAdvice || 'Pour atteindre cet objectif, vous devez mettre de côté {amount} par mois.').replace(
                      '{amount}',
                      formatMAD(previewMonthly, false, language)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {tCommon.cancel}
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            {categoryToEdit ? tCommon.save : tCommon.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
