import React, { useState } from 'react';
import { Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatMAD, formatDateTime } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getCategoryVisualColor } from '../../utils/categoryColor';
import {
  getCategoryName,
  getSubCategoryName,
  getIncomeSourceName,
  getIncomeSubSourceName,
  translateCategoryText,
} from '../../utils/i18nHelpers';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MoneyText } from '../common/PrivacyCurrency';
import { SwipeRow } from '../common/SwipeRow';

interface TransactionItemProps {
  transaction: Transaction;
  hideBalance?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  hideBalance = false,
}) => {
  const { categories, incomeSources, deleteTransaction, addTransaction, showToast, language } = useAppStore();
  const t = translations[language].history;
  const tCommon = translations[language].common;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSwipeDelete = () => {
    const deletedTx = transaction;
    deleteTransaction(transaction.id);
    showToast({
      message:
        language === 'ar'
          ? 'تم حذف المعاملة'
          : language === 'en'
          ? 'Transaction deleted'
          : 'Transaction supprimée',
      actionText: language === 'ar' ? 'تراجع' : language === 'en' ? 'Undo' : 'Annuler',
      onAction: () => {
        addTransaction(deletedTx);
      },
    });
  };

  // Resolve category or source
  const category = transaction.categoryId
    ? categories.find((c) => c.id === transaction.categoryId)
    : null;

  const subCategory =
    category && transaction.subCategoryId
      ? category.subcategories?.find((s) => s.id === transaction.subCategoryId)
      : null;

  const source = transaction.sourceId
    ? incomeSources.find((s) => s.id === transaction.sourceId)
    : null;

  const subSource =
    source && transaction.incomeSubSourceId
      ? source.subcategories?.find((s) => s.id === transaction.incomeSubSourceId)
      : null;

  const getDetails = () => {
    switch (transaction.type) {
      case 'income': {
        const srcName = source ? getIncomeSourceName(source, language) : translations[language].dashboard.addIncome;
        const subName = subSource ? getIncomeSubSourceName(subSource, language) : null;
        return {
          title: subName ? `${srcName} › ${subName}` : srcName,
          icon: source?.icon || 'Briefcase',
          color: source?.color || '#059669',
          amountPrefix: '+ ',
          amountClass: 'text-positive dark:text-positive font-bold',
          badgeText: translations[language].dashboard.addIncome,
          badgeBg: 'bg-positive dark:bg-positive/50 text-positive dark:text-positive',
        };
      }
      case 'expense': {
        let catName = category ? getCategoryName(category, language) : '';
        if (!catName || catName === translations[language].dashboard.addExpense) {
          const rawCat =
            (transaction as any).categoryName ||
            (transaction as any).category ||
            transaction.categoryId;
          if (rawCat) {
            catName = translateCategoryText(rawCat, language);
          }
        }
        if (!catName) {
          catName = translations[language].dashboard.addExpense;
        }

        let subName = subCategory ? getSubCategoryName(subCategory, language) : null;
        if (!subName && transaction.subCategoryId) {
          const translatedSub = translateCategoryText(transaction.subCategoryId, language);
          if (translatedSub && translatedSub !== transaction.subCategoryId) {
            subName = translatedSub;
          }
        }

        return {
          title: subName ? `${catName} › ${subName}` : catName,
          icon: category?.icon || 'Utensils',
          color: getCategoryVisualColor(category?.id),
          amountPrefix: '- ',
          amountClass: 'text-negative dark:text-negative font-bold',
          badgeText: translations[language].dashboard.addExpense,
          badgeBg: 'bg-negative dark:bg-negative/50 text-negative dark:text-negative',
        };
      }
      case 'contribution': {
        const catName = category ? getCategoryName(category, language) : translations[language].categories.goalBadge;
        return {
          title: `${tCommon.savingFor} ${catName}`,
          icon: category?.icon || 'Target',
          color: getCategoryVisualColor(category?.id),
          amountPrefix: '- ',
          amountClass: 'text-info dark:text-info font-bold',
          badgeText: translations[language].dashboard.addContribution,
          badgeBg: 'bg-info dark:bg-info/50 text-info dark:text-info',
        };
      }
      case 'goal_withdraw': {
        const catName = category ? getCategoryName(category, language) : '';
        return {
          title: catName ? `${tCommon.savingFor} : ${catName}` : translations[language].categories.returnToBalance,
          icon: 'Wallet',
          color: '#f59e0b',
          amountPrefix: '+ ',
          amountClass: 'text-warning dark:text-warning font-bold',
          badgeText: translations[language].categories.returnToBalance,
          badgeBg: 'bg-warning dark:bg-warning/50 text-warning dark:text-warning',
        };
      }
      case 'adjustment': {
        const isPositive = (Number(transaction.amount) || 0) >= 0;
        const adjTitle =
          transaction.note ||
          (language === 'ar'
            ? 'تعديل الرصيد'
            : language === 'en'
            ? 'Balance Adjustment'
            : 'Ajustement du solde');
        return {
          title: adjTitle,
          icon: 'SlidersHorizontal',
          color: '#6366f1',
          amountPrefix: isPositive ? '+ ' : '- ',
          amountClass: isPositive
            ? 'text-accent dark:text-accent font-bold'
            : 'text-muted dark:text-muted font-bold',
          badgeText: language === 'ar' ? 'تسوية' : language === 'en' ? 'Adjustment' : 'Ajustement',
          badgeBg: 'bg-accent dark:bg-accent/50 text-accent dark:text-accent',
        };
      }
    }
  };

  const details = getDetails();
  const IconComp = getCategoryIcon(details.icon);

  const handleDelete = () => {
    const deletedTx = transaction;
    deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
    showToast({
      message:
        language === 'ar'
          ? 'تم حذف المعاملة'
          : language === 'en'
          ? 'Transaction deleted'
          : 'Transaction supprimée',
      actionText: language === 'ar' ? 'تراجع' : language === 'en' ? 'Undo' : 'Annuler',
      onAction: () => {
        addTransaction(deletedTx);
      },
    });
  };

  return (
    <>
      <SwipeRow
        onDelete={handleSwipeDelete}
        onEdit={() => {
          window.dispatchEvent(new CustomEvent('flouss:edit-transaction', { detail: { transaction } }));
        }}
      >
        <div
          data-press="row"
          className="group interactive-row flex items-center justify-between p-2.5 sm:p-3 rounded-control bg-surface border border-border-subtle hover:bg-surface-raised transition-colors w-full min-w-0"
        >
          {/* Left: Icon & Names */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-8 h-8 rounded-control flex items-center justify-center text-accent-contrast shrink-0"
              style={{ backgroundColor: details.color }}
            >
              <IconComp className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="min-w-0 flex-1 text-xs sm:text-sm font-medium text-content truncate">
                  {details.title}
                </h4>
                <span
                  title={transaction.type === 'adjustment' ? translations[language].summaryScopes.adjustment : undefined}
                  className={`shrink-0 flex-shrink-0 whitespace-nowrap text-caption font-medium px-1.5 py-0.5 rounded-control border ${details.badgeBg} ${transaction.type === 'adjustment' ? 'bg-accent/10 text-accent dark:text-accent border-accent/30' : ''}`}
                >
                  {details.badgeText}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted mt-0.5">
                <span className="shrink-0 flex-shrink-0 whitespace-nowrap">{formatDateTime(transaction.date, language)}</span>
                {transaction.note && (
                  <>
                    <span className="shrink-0 flex-shrink-0">•</span>
                    <span className="min-w-0 truncate text-muted">
                      {translateCategoryText(transaction.note, language) || transaction.note}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Amount & Delete action */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 flex-shrink-0 whitespace-nowrap ms-2">
            <MoneyText
              amount={transaction.type === 'adjustment' ? Math.abs(transaction.amount) : transaction.amount}
              prefix={details.amountPrefix}
              className={`shrink-0 flex-shrink-0 whitespace-nowrap text-xs sm:text-sm font-semibold tabular-nums ${details.amountClass}`}
            />

            <button
              onClick={() => setShowDeleteConfirm(true)}
              title={t.deleteTransactionTitle}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-muted hover:text-negative hover:bg-negative dark:hover:bg-negative/40 transition-colors cursor-pointer"
              aria-label={tCommon.delete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </SwipeRow>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t.deleteTransactionTitle}
        maxWidth="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-negative dark:bg-negative/60 text-negative flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <p className="text-xs text-muted dark:text-muted leading-relaxed">
            {t.deleteTransactionDesc}
          </p>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteConfirm(false)}
            >
              {tCommon.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
            >
              {tCommon.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
