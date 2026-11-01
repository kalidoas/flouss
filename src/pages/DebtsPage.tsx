import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { DebtItem, DebtType } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatMAD } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { PrivacyCurrency } from '../components/common/PrivacyCurrency';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Coins,
  Check,
} from 'lucide-react';

export const DebtsPage: React.FC = () => {
  const {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    settleDebt,
    recordDebtPayment,
    hideBalance,
    language,
  } = useAppStore();

  const tDebt = translations[language].debts;

  const [activeTab, setActiveTab] = useState<'all' | 'lend' | 'borrow' | 'settled'>('all');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('lend');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtPaid, setDebtPaid] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Partial Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');

  // Financial Summaries
  const summary = useMemo(() => {
    let lendTotal = 0;
    let lendPaid = 0;
    let borrowTotal = 0;
    let borrowPaid = 0;

    (debts || []).forEach((d) => {
      if (d.isSettled) return;
      if (d.type === 'lend') {
        lendTotal += d.totalAmount;
        lendPaid += d.paidAmount || 0;
      } else {
        borrowTotal += d.totalAmount;
        borrowPaid += d.paidAmount || 0;
      }
    });

    const toCollect = lendTotal - lendPaid;
    const toPay = borrowTotal - borrowPaid;
    const net = toCollect - toPay;

    return { toCollect, toPay, net };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return (debts || []).filter((d) => {
      // Tab filter
      if (activeTab === 'settled') {
        if (!d.isSettled) return false;
      } else {
        if (d.isSettled && activeTab !== 'all') return false;
        if (activeTab === 'lend' && d.type !== 'lend') return false;
        if (activeTab === 'borrow' && d.type !== 'borrow') return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.personName.toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [debts, activeTab, search]);

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setDebtPerson('');
    setDebtType('lend');
    setDebtTotal('');
    setDebtPaid('');
    setDebtDueDate('');
    setDebtNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (debt: DebtItem) => {
    setEditingDebt(debt);
    setDebtPerson(debt.personName);
    setDebtType(debt.type);
    setDebtTotal(debt.totalAmount.toString());
    setDebtPaid(debt.paidAmount ? debt.paidAmount.toString() : '');
    setDebtDueDate(debt.dueDate || '');
    setDebtNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotal);
    const paid = debtPaid ? parseFloat(debtPaid) : 0;
    if (!debtPerson.trim() || isNaN(total) || total <= 0) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        personName: debtPerson.trim(),
        type: debtType,
        totalAmount: total,
        paidAmount: Math.min(total, Math.max(0, paid)),
        dueDate: debtDueDate || undefined,
        notes: debtNotes.trim() || undefined,
      });
    } else {
      const finalPaid = Math.min(total, Math.max(0, paid));
      addDebt({
        id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        personName: debtPerson.trim(),
        type: debtType,
        totalAmount: total,
        paidAmount: finalPaid,
        dueDate: debtDueDate || undefined,
        notes: debtNotes.trim() || undefined,
        isSettled: finalPaid >= total,
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  const handleOpenPayment = (id: string) => {
    setPaymentDebtId(id);
    setPartialAmount('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(partialAmount);
    if (paymentDebtId && !isNaN(amt) && amt > 0) {
      recordDebtPayment(paymentDebtId, amt);
    }
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-page pb-20 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {tDebt.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {tDebt.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {tDebt.subtitle}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          <span>{tDebt.newDebt}</span>
        </Button>
      </div>

      {/* Summary Hero Cards: Apple HIG Glass Surfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* On me doit */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            <span>{tDebt.theyOweMe}</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <PrivacyCurrency
            amount={summary.toCollect}
            className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight"
          />
        </motion.div>

        {/* Je dois */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">
            <span>{tDebt.iOwe}</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <PrivacyCurrency
            amount={summary.toPay}
            className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight"
          />
        </motion.div>

        {/* Net */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            <span>{tDebt.netBalance}</span>
            <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </div>
          <PrivacyCurrency
            amount={summary.net}
            showSign={true}
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              summary.net >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </motion.div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 font-medium ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {tDebt.all}
          </button>
          <button
            onClick={() => setActiveTab('lend')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 font-medium ${
              activeTab === 'lend'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {tDebt.lent}
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 font-medium ${
              activeTab === 'borrow'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {tDebt.borrowed}
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 font-medium ${
              activeTab === 'settled'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {tDebt.settled}
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tDebt.searchPlaceholder}
          className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-all"
        />
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="w-5 h-5" />}
            title={tDebt.emptyTitle}
            description={tDebt.subtitle}
            action={
              <Button
                onClick={handleOpenAdd}
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                <span>{tDebt.addDebt}</span>
              </Button>
            }
          />
        ) : (
          filteredDebts.map((debt) => {
            const isLend = debt.type === 'lend';
            const remaining = Math.max(0, debt.totalAmount - (debt.paidAmount || 0));
            const progress = Math.min(
              100,
              Math.round(((debt.paidAmount || 0) / debt.totalAmount) * 100)
            );

            return (
              <motion.div
                key={debt.id}
                whileHover={{ y: -2 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  debt.isSettled
                    ? 'bg-white/50 dark:bg-zinc-900/35 border-black/[0.04] dark:border-white/[0.05] opacity-75'
                    : 'bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border-black/[0.06] dark:border-white/[0.08] shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          isLend
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isLend ? tDebt.lent : tDebt.borrowed}
                      </span>
                      <h4 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight">
                        {debt.personName}
                      </h4>
                      {debt.isSettled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 stroke-[3]" /> {tDebt.settled}
                        </span>
                      )}
                    </div>

                    {debt.notes && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{debt.notes}</p>
                    )}

                    {debt.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {tDebt.dueDateLabel} {debt.dueDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                        {tDebt.remainingLabel}
                      </div>
                      <PrivacyCurrency
                        amount={remaining}
                        className={`text-base sm:text-lg font-bold tracking-tight block ${
                          debt.isSettled
                            ? 'text-zinc-400 line-through'
                            : isLend
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      />
                      {debt.paidAmount > 0 && !debt.isSettled && (
                        <div className="text-[10px] text-zinc-400 tabular-nums">
                          <PrivacyCurrency amount={debt.paidAmount} /> {tDebt.alreadyPaid}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => settleDebt(debt.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          debt.isSettled
                            ? 'text-emerald-600 bg-emerald-500/15 border border-emerald-500/20'
                            : 'text-zinc-400 hover:text-emerald-600 hover:bg-emerald-500/10'
                        }`}
                        title={debt.isSettled ? 'Annuler' : 'Marquer réglé'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      {!debt.isSettled && (
                        <button
                          onClick={() => handleOpenPayment(debt.id)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          + {tDebt.recordPayment}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(debt)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={tDebt.editDebt}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteDebt(debt.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Repayment Progress bar */}
                {debt.paidAmount > 0 && !debt.isSettled && (
                  <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.05]">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                      <span>{tDebt.recoveryRate}</span>
                      <span className="tabular-nums font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT DEBT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? tDebt.editDebt : tDebt.newDebt}
        subtitle={tDebt.subtitle}
      >
        <form onSubmit={handleSaveDebt} className="space-y-4 pt-2">
          {/* Debt Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDebtType('lend')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                debtType === 'lend'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-black/[0.05] dark:border-white/[0.06] text-zinc-500'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 mx-auto mb-1 stroke-[2.2]" />
              <span className="text-xs block font-semibold">{tDebt.lent}</span>
            </button>

            <button
              type="button"
              onClick={() => setDebtType('borrow')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                debtType === 'borrow'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-black/[0.05] dark:border-white/[0.06] text-zinc-500'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 mx-auto mb-1 stroke-[2.2]" />
              <span className="text-xs block font-semibold">{tDebt.borrowed}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tDebt.partyNameLabel} *
            </label>
            <input
              type="text"
              required
              value={debtPerson}
              onChange={(e) => setDebtPerson(e.target.value)}
              placeholder={tDebt.partyNamePlaceholder}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {tDebt.totalAmountLabel} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={debtTotal}
                onChange={(e) => setDebtTotal(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {tDebt.initialPaidLabel}
              </label>
              <input
                type="number"
                step="any"
                value={debtPaid}
                onChange={(e) => setDebtPaid(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tDebt.dueDateOptional}
            </label>
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tDebt.notesLabel}
            </label>
            <textarea
              rows={2}
              value={debtNotes}
              onChange={(e) => setDebtNotes(e.target.value)}
              placeholder={tDebt.notesPlaceholder}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tDebt.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {editingDebt ? tDebt.save : tDebt.confirm}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PARTIAL PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={tDebt.paymentModalTitle}
        subtitle={tDebt.paymentModalSubtitle}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tDebt.paymentAmountLabel} *
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              {tDebt.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {tDebt.confirmPayment}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
