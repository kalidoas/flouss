import React, { useState } from 'react';
import { Transaction } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatMAD, formatDateTime } from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
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
import { PrivacyCurrency } from '../common/PrivacyCurrency';
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
          amountClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
          badgeText: translations[language].dashboard.addIncome,
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
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
          color: category?.color || '#f43f5e',
          amountPrefix: '- ',
          amountClass: 'text-rose-600 dark:text-rose-400 font-bold',
          badgeText: translations[language].dashboard.addExpense,
          badgeBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300',
        };
      }
      case 'contribution': {
        const catName = category ? getCategoryName(category, language) : translations[language].categories.goalBadge;
        return {
          title: `${tCommon.savingFor} ${catName}`,
          icon: category?.icon || 'Target',
          color: category?.color || '#3b82f6',
          amountPrefix: '- ',
          amountClass: 'text-blue-600 dark:text-blue-400 font-bold',
          badgeText: translations[language].dashboard.addContribution,
          badgeBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
        };
      }
      case 'goal_withdraw': {
        const catName = category ? getCategoryName(category, language) : '';
        return {
          title: catName ? `${tCommon.savingFor} : ${catName}` : translations[language].categories.returnToBalance,
          icon: 'Wallet',
          color: '#f59e0b',
          amountPrefix: '+ ',
          amountClass: 'text-amber-600 dark:text-amber-400 font-bold',
          badgeText: translations[language].categories.returnToBalance,
          badgeBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
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
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-zinc-600 dark:text-zinc-400 font-bold',
          badgeText: language === 'ar' ? 'تسوية' : language === 'en' ? 'Adjustment' : 'Ajustement',
          badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
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
      <SwipeRow onDelete={handleSwipeDelete}>
        <div
          data-press="row"
          className="group interactive-row flex items-center justify-between p-2.5 sm:p-3 rounded-md bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] hover:bg-[#fbfbfa] dark:hover:bg-[#252525] transition-colors"
        >
          {/* Left: Icon & Names */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: details.color }}
            >
              <IconComp className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="min-w-0 flex-1 text-xs sm:text-sm font-medium text-[#37352f] dark:text-[#ecebed] truncate">
                  {details.title}
                </h4>
                <span className={`shrink-0 whitespace-nowrap text-[10px] font-medium px-1.5 py-0.2 rounded border ${details.badgeBg}`}>
                  {details.badgeText}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#787774] dark:text-[#9b9a97] mt-0.5">
                <span className="shrink-0 whitespace-nowrap">{formatDateTime(transaction.date, language)}</span>
                {transaction.note && (
                  <>
                    <span className="shrink-0">•</span>
                    <span className="min-w-0 truncate max-w-[140px] sm:max-w-xs text-[#787774] dark:text-[#9b9a97]">
                      {translateCategoryText(transaction.note, language) || transaction.note}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Amount & Delete action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
            <PrivacyCurrency
              amount={transaction.type === 'adjustment' ? Math.abs(transaction.amount) : transaction.amount}
              prefix={details.amountPrefix}
              className={`text-xs sm:text-sm font-semibold ${details.amountClass}`}
            />

            <button
              onClick={() => setShowDeleteConfirm(true)}
              title={t.deleteTransactionTitle}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-[#787774] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
