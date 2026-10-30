import React, { useState, useEffect } from 'react';
import { Category, SubCategory } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { IconPicker } from '../common/IconPicker';
import { ColorPicker } from '../common/ColorPicker';
import { getCategoryIcon } from '../../utils/icons';
import { formatMAD } from '../../utils/formatters';
import { translations } from '../../i18n/translations';
import { getCategoryName, getSubCategoryName } from '../../utils/i18nHelpers';
import { Target, Layers, Calculator, Plus, Trash2, X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  initialIsGoal?: boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  initialIsGoal = false,
}) => {
  const { addCategory, updateCategory, language } = useAppStore();
  const tCat = translations[language].categories;
  const tCommon = translations[language].common;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingBag');
  const [color, setColor] = useState('#10b981');
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
      setIcon('ShoppingBag');
      setColor('#10b981');
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
  }, [categoryToEdit, isOpen, initialIsGoal, language]);

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
        name: name.trim(),
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
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          >
            <IconPreview className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
              {name.trim() || tCommon.categoryName}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
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

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Couleur
          </label>
          <ColorPicker selectedColor={color} onSelect={setColor} />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Icône
          </label>
          <IconPicker selectedIcon={icon} onSelect={setIcon} />
        </div>

        {/* Sub-categories management */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sous-catégories
          </label>

          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {subcategories.map((sub) => (
              <span
                key={sub.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                {getSubCategoryName(sub, language)}
                <button
                  type="button"
                  onClick={() => handleRemoveSubcat(sub.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {subcategories.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Aucune sous-catégorie définie
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Ajouter une sous-catégorie..."
              value={newSubcatName}
              onChange={(e) => setNewSubcatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubcat();
                }
              }}
              className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubcat}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Ajouter
            </Button>
          </div>
        </div>

        {/* Optional Monthly Budget */}
        <div>
          <Input
            label="Plafond de budget mensuel (optionnel)"
            type="text"
            inputMode="decimal"
            placeholder="ex: 2 500 (laisser vide si illimité)"
            suffix="MAD / mois"
            value={monthlyBudgetStr}
            onChange={(e) => setMonthlyBudgetStr(e.target.value)}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Une alerte s’affichera à 80% et 100% de ce montant dépensé dans le mois.
          </p>
        </div>

        {/* Goal Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Définir un objectif d’épargne ?
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Calcul automatique de la mensualité requise
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
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>

        {/* Goal Configuration Fields */}
        {isGoal && (
          <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/50 animate-in fade-in duration-200">
            {/* Optional subcategory attachment */}
            {subcategories.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Associer l’objectif à une sous-catégorie
                </label>
                <select
                  value={selectedSubCategoryId || ''}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value || null)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="">Catégorie globale ({name || 'Sans nom'})</option>
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
              label="Montant cible (MAD)"
              type="text"
              inputMode="decimal"
              placeholder="ex: 8000"
              suffix="MAD"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value)}
            />

            {/* Target Duration Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Échéance de l’objectif
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDurationMode('months')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    durationMode === 'months'
                      ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Durée en mois
                </button>
                <button
                  type="button"
                  onClick={() => setDurationMode('date')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    durationMode === 'date'
                      ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Date cible exacte
                </button>
              </div>
            </div>

            {durationMode === 'months' ? (
              <Input
                label="Nombre de mois pour atteindre la cible"
                type="number"
                min="1"
                max="120"
                value={targetMonthsStr}
                onChange={(e) => setTargetMonthsStr(e.target.value)}
                suffix="Mois"
              />
            ) : (
              <Input
                label="Date cible"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            )}

            {/* Real-time Calculation Display */}
            {targetAmount > 0 && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800/60 flex items-start gap-3">
                <Calculator className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">
                    Calcul automatique :
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Pour atteindre cet objectif, vous devez mettre de côté{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                      {formatMAD(previewMonthly, false, language)}
                    </strong>{' '}
                    par mois.
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
