import React, { useState } from 'react';
import { Category, Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { GoalProgressBar } from '../goals/GoalProgressBar';
import { TransactionItem } from '../transactions/TransactionItem';
import { Money } from '../common/Money';
import {
  calculateCategorySavedAmount,
  calculateCategorySpentAmount,
  calculateGoalProgress,
  calculateCategoryBudgetStatus,
} from '../../utils/calculations';
import { formatMAD, getCurrentMonthStr } from '../../utils/formatters';
import { getCategoryVisualColor } from '../../utils/categoryColor';
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
    updateCategory,
    deleteCategory,
    updateTransaction,
    deleteTransaction,
    addTransaction,
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
    // 1. Handle transactions
    if (categoryTransactions.length > 0) {
      if (txActionChoice === 'reassign' && reassignTargetId) {
        categoryTransactions.forEach((tx) => {
          updateTransaction(tx.id, { categoryId: reassignTargetId });
        });
      } else if (txActionChoice === 'cascade_delete') {
        categoryTransactions.forEach((tx) => {
          deleteTransaction(tx.id);
        });
      }
    }

    // 2. Handle saved money refund if chosen
    if (savedAmount > 0 && deleteRefundChoice === 'refund_to_balance') {
      addTransaction({
        id: 'tx_refund_' + Date.now(),
        type: 'income',
        amount: savedAmount,
        categoryId: otherCategories[0]?.id || 'cat_autre',
        date: new Date().toISOString().split('T')[0],
        note: language === 'ar' ? `استرداد مدخرات فئة: ${categoryName}` : `Remboursement épargne : ${categoryName}`,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Delete category from store (permanently tombstoned in deletedCategoryIds)
    deleteCategory(category.id);
    setShowDeletePrompt(false);
    onClose();
  };

  const handleToggleArchive = () => {
    updateCategory(category.id, { isArchived: !category.isArchived });
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
                className="w-14 h-14 rounded-3xl flex items-center justify-center text-accent-contrast shrink-0 shadow-md"
                style={{ backgroundColor: getCategoryVisualColor(category.id) }}
              >
                <IconComp className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-content text-accent-contrast">
                  {categoryName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-subtle">
                    {category.isGoal ? tCat.goalBadge : tCat.expenseBadge}
                  </span>
                  {category.isArchived && (
                    <span className="text-[10px] bg-border-border dark:bg-surface text-muted dark:text-muted font-bold px-2 py-0.5 rounded-full">
                      {tCat.archivedBadge || 'Archivée'}
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
                className="p-2 rounded-xl text-text-subtle hover:text-content dark:hover:text-muted hover:bg-surface-2 dark:hover:bg-surface transition-colors"
                title={tCommon.edit}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleArchive}
                className="p-2 rounded-xl text-text-subtle hover:text-content dark:hover:text-muted hover:bg-surface-2 dark:hover:bg-surface transition-colors"
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
                className="p-2 rounded-xl text-text-subtle hover:text-negative hover:bg-negative dark:hover:bg-negative/40 transition-colors"
                title={tCommon.delete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Goal Progress Section (if it's a goal) */}
          {category.isGoal && goalCalc && (
            <div className="p-4 rounded-3xl bg-surface-3 dark:bg-surface/40 border border-border/50 dark:border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-subtle uppercase tracking-wider">
                  {tCat.goalProgress || 'Progression de l’objectif'}
                </span>
                <span className="text-xs font-extrabold text-positive dark:text-positive tabular-nums">
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

          {/* Subcategories visual icon strip without textual clutter */}
          {subcategories.length > 0 && (
            <div className="p-4 rounded-3xl bg-surface-3/70 dark:bg-surface/30 border border-border-border dark:border-border space-y-2.5">
              <span className="text-xs font-bold text-text-subtle uppercase tracking-wider block">
                {(tCat.subcategoriesTitle || 'Sous-catégories ({count})').replace('{count}', String(subcategories.length))}
              </span>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => {
                  const subTx = categoryTransactions.filter((tx) => tx.subCategoryId === sub.id);
                  const subSpent = subTx.reduce((s, tx) => s + tx.amount, 0);
                  const SubIcon = getCategoryIcon(sub.icon || 'Folder');
                  return (
                    <div
                      key={sub.id}
                      title={getSubCategoryName(sub, language)}
                      className="px-3 py-1.5 rounded-xl bg-surface dark:bg-surface/90 border border-border dark:border-border/80 text-xs flex items-center gap-2 shadow-2xs hover:border-border-border dark:hover:border-text-muted transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-surface-2 dark:bg-text-muted flex items-center justify-center text-content dark:text-muted">
                        <SubIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <span className="font-semibold text-text-content dark:text-muted">
                        {getSubCategoryName(sub, language)}
                      </span>
                      {subSpent > 0 && (
                        <span className="text-[11px] font-mono text-text-subtle tabular-nums">
                          <Money amount={subSpent} />
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
            <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border-border dark:border-border">
              <span className="text-[11px] text-text-subtle block font-medium">
                {tCat.spentThisMonth}
              </span>
              <Money amount={spentThisMonth} hide={hideBalance} className="text-base font-bold text-content mt-0.5 block" />
              {budgetStatus.hasBudget && (
                <span className="text-[11px] text-text-subtle block mt-1">
                  Budget : <Money amount={budgetStatus.budget} />
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-border-border dark:border-border">
              <span className="text-[11px] text-text-subtle block font-medium">
                {tCat.totalSpent || 'Dépensé au total'}
              </span>
              <Money amount={spentAllTime} hide={hideBalance} className="text-base font-bold text-content mt-0.5 block" />
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
          <div className="space-y-3 pt-2 border-t border-border-border dark:border-border">
            <h3 className="text-xs font-bold text-text-subtle uppercase tracking-wider">
              Transactions ({categoryTransactions.length})
            </h3>

            {categoryTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-subtle bg-surface-3 dark:bg-surface/40 rounded-2xl">
                {tCat.noTransactions || 'Aucune transaction enregistrée dans cette catégorie.'}
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
        title={tCat.deleteCategoryTitle || 'Supprimer la catégorie'}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-negative dark:bg-negative/60 text-negative flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <p className="text-xs text-muted dark:text-muted text-center leading-relaxed">
            {(tCat.deleteConfirmQuestion || 'Êtes-vous sûr de vouloir supprimer définitivement la catégorie {name} ?').replace('{name}', categoryName)}
          </p>

          {/* Option for existing transactions: reassign vs cascade delete */}
          {categoryTransactions.length > 0 && (
            <div className="p-4 bg-surface-3 dark:bg-surface/50 border border-border dark:border-border rounded-2xl space-y-3">
              <p className="text-xs font-bold text-content text-accent-contrast">
                {(tCat.txNotice || 'Cette catégorie contient {count} transaction(s). Que souhaitez-vous faire ?').replace('{count}', String(categoryTransactions.length))}
              </p>

              <div className="space-y-2 text-xs">
                {otherCategories.length > 0 && (
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface dark:bg-surface border border-border dark:border-border cursor-pointer">
                    <input
                      type="radio"
                      name="txActionChoice"
                      value="reassign"
                      checked={txActionChoice === 'reassign'}
                      onChange={() => setTxActionChoice('reassign')}
                      className="mt-0.5 text-positive focus:ring-positive"
                    />
                    <div className="flex-1 space-y-2">
                      <span className="font-bold text-text-content dark:text-muted">
                        {tCat.txReassign || 'Réassigner à une autre catégorie'}
                      </span>
                      {txActionChoice === 'reassign' && (
                        <select
                          value={reassignTargetId}
                          onChange={(e) => setReassignTargetId(e.target.value)}
                          className="w-full py-1.5 px-2.5 rounded-xl border border-border dark:border-border bg-surface dark:bg-surface text-xs font-semibold"
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

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface dark:bg-surface border border-border dark:border-border cursor-pointer">
                  <input
                    type="radio"
                    name="txActionChoice"
                    value="cascade_delete"
                    checked={txActionChoice === 'cascade_delete'}
                    onChange={() => setTxActionChoice('cascade_delete')}
                    className="mt-0.5 text-negative focus:ring-negative"
                  />
                  <div>
                    <span className="font-bold text-negative dark:text-negative">
                      {tCat.txCascadeDelete || 'Supprimer avec ses transactions'}
                    </span>
                    <span className="block text-[11px] text-text-subtle dark:text-text-subtle mt-0.5">
                      {(tCat.txCascadeDeleteDesc || 'Les {count} transactions seront définitivement supprimées et le solde recalculé.').replace('{count}', String(categoryTransactions.length))}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Money prompt if category has saved amount */}
          {savedAmount > 0 && (
            <div className="p-4 bg-warning dark:bg-warning/40 border border-warning/80 dark:border-warning rounded-2xl space-y-3">
              <p className="text-xs font-bold text-warning dark:text-warning">
                {(tCat.savedPrompt || 'Cette catégorie contient {amount} épargnés. Que faire de cet argent ?').replace('{amount}', formatMAD(savedAmount, false, language))}
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-surface dark:bg-surface border border-warning dark:border-warning cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRefund"
                    value="refund_to_balance"
                    checked={deleteRefundChoice === 'refund_to_balance'}
                    onChange={() => setDeleteRefundChoice('refund_to_balance')}
                    className="text-positive focus:ring-positive"
                  />
                  <div>
                    <span className="font-bold text-text-content dark:text-muted">
                      {tCat.refundToBalance || 'Remettre dans le solde disponible'}
                    </span>
                    <span className="block text-[11px] text-text-subtle dark:text-text-subtle">
                      {tCat.refundToBalanceDesc || 'Le montant sera réinjecté dans votre solde principal.'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-surface dark:bg-surface border border-warning dark:border-warning cursor-pointer">
                  <input
                    type="radio"
                    name="deleteRefund"
                    value="consider_spent"
                    checked={deleteRefundChoice === 'consider_spent'}
                    onChange={() => setDeleteRefundChoice('consider_spent')}
                    className="text-positive focus:ring-positive"
                  />
                  <div>
                    <span className="font-bold text-text-content dark:text-muted">
                      {tCat.keepAsSpent || 'Considérer comme déjà dépensé'}
                    </span>
                    <span className="block text-[11px] text-text-subtle dark:text-text-subtle">
                      {tCat.keepAsSpentDesc || 'L’argent reste comptabilisé comme sortie.'}
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
