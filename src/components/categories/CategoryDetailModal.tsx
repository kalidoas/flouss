import React, { useState } from 'react';
import { Category, Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { GoalProgressBar } from '../goals/GoalProgressBar';
import { TransactionItem } from '../transactions/TransactionItem';
import {
  calculateCategorySavedAmount,
  calculateCategorySpentAmount,
  calculateGoalProgress,
  calculateCategoryBudgetStatus,
} from '../../utils/calculations';
import { formatMAD, getCurrentMonthStr } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getCategoryName, getSubCategoryName } from '../../utils/i18nHelpers';
import {
  Edit3,
  Archive,
  Trash2,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onEdit: (category: Category) => void;
  onAddContribution: (category: Category) => void;
  onAddExpense: (category: Category) => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  onEdit,
  onAddContribution,
  onAddExpense,
}) => {
  const {
    categories,
    transactions,
    archiveCategory,
    deleteCategory,
    hideBalance,
    language,
  } = useAppStore();

  const tCat = translations[language].categories;
  const tCommon = translations[language].common;
  const tDash = translations[language].dashboard;

  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteRefundChoice, setDeleteRefundChoice] = useState<
    'refund_to_balance' | 'consider_spent'
  >('refund_to_balance');
  const [txActionChoice, setTxActionChoice] = useState<'reassign' | 'cascade_delete'>('reassign');
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  if (!category || !isOpen) return null;

  const otherCategories = categories.filter((c) => c.id !== category.id && !c.isArchived);
  const IconComp = getCategoryIcon(category.icon);
  const savedAmount = calculateCategorySavedAmount(category.id, transactions);
  const currentMonth = getCurrentMonthStr();
  const spentThisMonth = calculateCategorySpentAmount(category.id, transactions, currentMonth);
  const spentAllTime = calculateCategorySpentAmount(category.id, transactions);

  const goalCalc = category.isGoal ? calculateGoalProgress(category, transactions) : null;
  const budgetStatus = calculateCategoryBudgetStatus(category, spentThisMonth);

  // Filter transactions for this category
  const categoryTransactions = transactions.filter(
    (tx) => tx.categoryId === category.id
  );

  const categoryName = getCategoryName(category, language);
  const subcategories = category.subcategories || [];

  const handleDeleteConfirm = () => {
    deleteCategory(
      category.id,
      deleteRefundChoice,
      categoryTransactions.length > 0 ? txActionChoice : undefined,
      txActionChoice === 'reassign' ? reassignTargetId || otherCategories[0]?.id : undefined
    );
    setShowDeletePrompt(false);
    onClose();
  };

  const handleToggleArchive = () => {
    archiveCategory(category.id, !category.isArchived);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showDeletePrompt}
        onClose={onClose}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="w-14 h-14 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-md"
                style={{ backgroundColor: category.color }}
              >
                <IconComp className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {categoryName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">
                    {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
                  </span>
                  {category.isArchived && (
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                      Archivée
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit / Archive / Delete Action Icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onClose();
                  onEdit(category);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={tCommon.edit}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleArchive}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={category.isArchived ? tCommon.unarchive : tCommon.archive}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (otherCategories.length > 0 && !reassignTargetId) {
                    setReassignTargetId(otherCategories[0].id);
                  }
                  setShowDeletePrompt(true);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={tCommon.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Goal Progress Section (if it's a goal) */}
          {category.isGoal && goalCalc && (
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Progression de l’objectif
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {goalCalc.progressPercent}%
                </span>
              </div>
              <GoalProgressBar
                category={category}
                calc={goalCalc}
                hideBalance={hideBalance}
              />
            </div>
          )}

          {/* Subcategories strip if defined */}
          {subcategories.length > 0 && (
            <div className="p-4 rounded-3xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Sous-catégories associées ({subcategories.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subcategories.map((sub) => {
                  const subTx = categoryTransactions.filter((tx) => tx.subCategoryId === sub.id);
                  const subSpent = subTx.reduce((s, tx) => s + tx.amount, 0);
                  return (
                    <div
                      key={sub.id}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {getSubCategoryName(sub, language)}
                      </span>
                      {subSpent > 0 && (
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          ({formatMAD(subSpent, hideBalance, language)})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">
                {tCat.spentThisMonth}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                {formatMAD(spentThisMonth, hideBalance, language)}
              </span>
              {budgetStatus.hasBudget && (
                <span className="text-[11px] text-slate-400 block mt-1">
                  Budget : {formatMAD(budgetStatus.budget, false, language)}
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">
                Dépensé au total
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                {formatMAD(spentAllTime, hideBalance, language)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                onClose();
                onAddExpense(category);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              {tDash.addExpense}
            </Button>

            {category.isGoal && (
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  onClose();
                  onAddContribution(category);
                }}
                icon={<ArrowUpRight className="w-4 h-4" />}
              >
                {tDash.contribute}
              </Button>
            )}
          </div>

          {/* Category Transactions History List */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Transactions ({categoryTransactions.length})
            </h3>

            {categoryTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                Aucune transaction enregistrée dans cette catégorie.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    hideBalance={hideBalance}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Secure Delete Category Confirmation with Money Destination & Transaction Reassignment Prompt */}
      <Modal
        isOpen={showDeletePrompt}
        onClose={() => setShowDeletePrompt(false)}
        title="Supprimer la catégorie"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
            Êtes-vous sûr de vouloir supprimer définitivement la catégorie{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {categoryName}
            </strong>{' '}
            ?
          </p>

          {/* Option for existing transactions: reassign vs cascade delete */}
          {categoryTransactions.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Cette catégorie contient {categoryTransactions.length} transaction(s). Que souhaitez-vous faire ?
              </p>

              <div className="space-y-2 text-xs">
                {otherCategories.length > 0 && (
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="txActionChoice"
                      value="reassign"
                      checked={txActionChoice === 'reassign'}
                      onChange={() => setTxActionChoice('reassign')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 space-y-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Réassigner à une autre catégorie
                      </span>
                      {txActionChoice === 'reassign' && (
                        <select
                          value={reassignTargetId}
                          onChange={(e) => setReassignTargetId(e.target.value)}
                          className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                        >
                          {otherCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getCategoryName(c, language)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>
                )}

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="txActionChoice"
                    value="cascade_delete"
                    checked={txActionChoice === 'cascade_delete'}
                    onChange={() => setTxActionChoice('cascade_delete')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-rose-700 dark:text-rose-400">
                      Supprimer avec ses transactions
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Les {categoryTransactions.length} transactions seront définitivement supprimées et le solde recalculé.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Money prompt if category has saved amount */}
          {savedAmount > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Cette catégorie contient {formatMAD(savedAmount, false, language)} épargnés. Que faire de cet argent ?
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRefund"
                    value="refund_to_balance"
                    checked={deleteRefundChoice === 'refund_to_balance'}
                    onChange={() => setDeleteRefundChoice('refund_to_balance')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Remettre dans le solde disponible
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      Le montant sera réinjecté dans votre solde principal.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRefund"
                    value="consider_spent"
                    checked={deleteRefundChoice === 'consider_spent'}
                    onChange={() => setDeleteRefundChoice('consider_spent')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Considérer comme déjà dépensé
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      L’argent reste comptabilisé comme sortie.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeletePrompt(false)}
            >
              {tCommon.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeleteConfirm}
              icon={<Trash2 className="w-4 h-4" />}
            >
              {tCommon.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
