import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { DebtItem, DebtType } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatMAD } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { playHapticFeedback } from '../utils/haptics';
import confetti from 'canvas-confetti';
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
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';

export const DebtsPage: React.FC = () => {
  const {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    settleDebt,
    recordDebtPayment,
    language,
    showToast,
  } = useAppStore();

  const tDebt = translations[language].debts;

  const [activeTab, setActiveTab] = useState<'all' | 'lend' | 'borrow' | 'settled'>('all');
  const [search, setSearch] = useState('');
  const [inlinePaymentInput, setInlinePaymentInput] = useState<Record<string, string>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('lend');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtPaid, setDebtPaid] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

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

  const counts = useMemo(() => {
    const all = (debts || []).length;
    const lend = (debts || []).filter((d) => d.type === 'lend' && !d.isSettled).length;
    const borrow = (debts || []).filter((d) => d.type === 'borrow' && !d.isSettled).length;
    const settled = (debts || []).filter((d) => d.isSettled).length;
    return { all, lend, borrow, settled };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return (debts || []).filter((d) => {
      if (activeTab === 'settled') {
        if (!d.isSettled) return false;
      } else {
        if (d.isSettled && activeTab !== 'all') return false;
        if (activeTab === 'lend' && d.type !== 'lend') return false;
        if (activeTab === 'borrow' && d.type !== 'borrow') return false;
      }

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
      playHapticFeedback('light');
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
      playHapticFeedback('success');
    }

    setIsModalOpen(false);
  };

  const handleQuickPercentagePay = (debt: DebtItem, percent: number) => {
    const remaining = Math.max(0, debt.totalAmount - (debt.paidAmount || 0));
    if (remaining <= 0) return;

    const fractionAmount = Math.round(debt.totalAmount * (percent / 100));
    const payAmount = Math.min(remaining, Math.max(1, fractionAmount));
    const willSettle = (debt.paidAmount || 0) + payAmount >= debt.totalAmount;

    recordDebtPayment(debt.id, payAmount);

    if (willSettle) {
      playHapticFeedback('success');
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });
      showToast({
        message: language === 'ar'
          ? `🎉 تم تسوية دين "${debt.personName}" بالكامل!`
          : `🎉 Debt with "${debt.personName}" fully settled!`,
      });
    } else {
      playHapticFeedback('selection');
      showToast({
        message: language === 'ar'
          ? `✓ تم تسجيل سداد ${formatMAD(payAmount)} لـ "${debt.personName}"`
          : `✓ Recorded ${formatMAD(payAmount)} payment for "${debt.personName}"`,
      });
    }
  };

  const handleSettleToggle = (debt: DebtItem) => {
    settleDebt(debt.id);
    if (!debt.isSettled) {
      playHapticFeedback('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast({
        message: language === 'ar'
          ? `🎉 تم تسوية دين "${debt.personName}" بنجاح!`
          : `🎉 Debt with "${debt.personName}" settled!`,
      });
    } else {
      playHapticFeedback('light');
    }
  };

  const handleInlineCustomPay = (debt: DebtItem) => {
    const raw = inlinePaymentInput[debt.id];
    const amt = parseFloat(raw || '0');
    if (isNaN(amt) || amt <= 0) return;

    const remaining = Math.max(0, debt.totalAmount - (debt.paidAmount || 0));
    const willSettle = (debt.paidAmount || 0) + amt >= debt.totalAmount;

    recordDebtPayment(debt.id, amt);
    setInlinePaymentInput((prev) => ({ ...prev, [debt.id]: '' }));

    if (willSettle) {
      playHapticFeedback('success');
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });
      showToast({
        message: language === 'ar'
          ? `🎉 تم تسوية دين "${debt.personName}" بالكامل!`
          : `🎉 Debt with "${debt.personName}" fully settled!`,
      });
    } else {
      playHapticFeedback('selection');
      showToast({
        message: language === 'ar'
          ? `✓ تم تسجيل سداد ${formatMAD(amt)} لـ "${debt.personName}"`
          : `✓ Recorded ${formatMAD(amt)} payment for "${debt.personName}"`,
      });
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 animate-page pb-24 select-text">
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tDebt.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {tDebt.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
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

      {/* ── 3-Column Glowing Metric Bento Strip (Cosmic Living Glow) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* On me doit (They owe me) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] group hover:border-emerald-500/30 transition-all duration-300 after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-emerald-400/50 after:to-transparent"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              {tDebt.theyOweMe}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <MoneyText
            amount={summary.toCollect}
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums block"
          />
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {counts.lend} {counts.lend === 1 ? 'dossier en cours' : 'dossiers en cours'}
          </span>
        </motion.div>

        {/* Je dois (I owe) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] group hover:border-rose-500/30 transition-all duration-300 after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-rose-400/50 after:to-transparent"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              {tDebt.iOwe}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <MoneyText
            amount={summary.toPay}
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums block"
          />
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {counts.borrow} {counts.borrow === 1 ? 'dossier en cours' : 'dossiers en cours'}
          </span>
        </motion.div>

        {/* Solde Net */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] group hover:border-indigo-500/30 transition-all duration-300 after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-indigo-400/50 after:to-transparent"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {tDebt.netBalance}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Coins className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <MoneyText
            amount={summary.net}
            showSign={true}
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums block ${
              summary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          />
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {summary.net >= 0 ? '✓ Position créditrice nette' : '⚠️ Position débitrice nette'}
          </span>
        </motion.div>
      </div>

      {/* ── Single-Row Sleek Glass Toolbar (Filters & Search) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tDebt.all} ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lend')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'lend'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tDebt.lent} ({counts.lend})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('borrow')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'borrow'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tDebt.borrowed} ({counts.borrow})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'settled'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tDebt.settled} ({counts.settled})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tDebt.searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      {/* ── Debts 2-Column Bento Grid ── */}
      {filteredDebts.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="w-5 h-5 text-indigo-400" />}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredDebts.map((debt) => {
            const isLend = debt.type === 'lend';
            const remaining = Math.max(0, debt.totalAmount - (debt.paidAmount || 0));
            const progress = Math.min(
              100,
              Math.round(((debt.paidAmount || 0) / debt.totalAmount) * 100)
            );
            const quarter = Math.round(debt.totalAmount * 0.25);
            const half = Math.round(debt.totalAmount * 0.5);

            return (
              <motion.div
                key={debt.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
                  debt.isSettled
                    ? 'bg-white/5 border-white/[0.04] opacity-75'
                    : 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Glowing Squircle Avatar */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        debt.isSettled
                          ? 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400'
                          : isLend
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                          : 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                      }`}
                    >
                      {debt.personName.trim().charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm sm:text-base text-white tracking-tight">
                          {debt.personName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLend
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isLend ? tDebt.lent : tDebt.borrowed}
                        </span>
                      </div>

                      {debt.dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 tabular-nums">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>
                            {tDebt.dueDateLabel} {debt.dueDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSettleToggle(debt)}
                      className={`p-2 rounded-xl transition-all ${
                        debt.isSettled
                          ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
                          : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent'
                      }`}
                      title={debt.isSettled ? 'Annuler le règlement' : 'Marquer réglé'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(debt)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                      title={tDebt.editDebt}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDebt(debt.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {debt.notes && (
                  <p className="text-xs text-zinc-400 mt-2.5 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">
                    {debt.notes}
                  </p>
                )}

                {/* Amount Row */}
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider block">
                      {tDebt.remainingLabel}
                    </span>
                    <MoneyText
                      amount={remaining}
                      className={`text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums block ${
                        debt.isSettled
                          ? 'text-zinc-500 line-through'
                          : isLend
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider block">
                      {tDebt.totalAmountLabel}
                    </span>
                    <MoneyText
                      amount={debt.totalAmount}
                      className="text-sm font-semibold text-zinc-300 tabular-nums block"
                    />
                    {debt.paidAmount > 0 && !debt.isSettled && (
                      <span className="text-[11px] text-zinc-400 tabular-nums">
                        <MoneyText amount={debt.paidAmount} /> {tDebt.alreadyPaid}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{tDebt.recoveryRate}</span>
                    <span className="tabular-nums font-bold text-white">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* ── 1-Tap Quick-Repay Chips & Inline Payment (User requirement) ── */}
                {!debt.isSettled && (
                  <div className="mt-3.5 pt-3 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {language === 'ar' ? 'سداد سريع بنقرة واحدة' : '1-Tap Quick Repay'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* +25% Chip */}
                      {quarter > 0 && quarter < remaining && (
                        <button
                          type="button"
                          onClick={() => handleQuickPercentagePay(debt, 25)}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-zinc-200 active:scale-95 transition-all"
                        >
                          +25% ({formatMAD(quarter)})
                        </button>
                      )}

                      {/* +50% Chip */}
                      {half > 0 && half < remaining && (
                        <button
                          type="button"
                          onClick={() => handleQuickPercentagePay(debt, 50)}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-zinc-200 active:scale-95 transition-all"
                        >
                          +50% ({formatMAD(half)})
                        </button>
                      )}

                      {/* Settle 100% Chip */}
                      <button
                        type="button"
                        onClick={() => handleSettleToggle(debt)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-400 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {language === 'ar' ? 'تسوية 100%' : 'Settle 100%'}
                      </button>
                    </div>

                    {/* Inline Custom Payment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        step="any"
                        value={inlinePaymentInput[debt.id] || ''}
                        onChange={(e) =>
                          setInlinePaymentInput((prev) => ({
                            ...prev,
                            [debt.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleInlineCustomPay(debt);
                          }
                        }}
                        placeholder={
                          language === 'ar'
                            ? 'مبلغ مخصص (Enter)...'
                            : 'Custom amount (press Enter)...'
                        }
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 text-xs px-3 py-1.5 rounded-xl text-white placeholder-zinc-500 outline-none tabular-nums transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleInlineCustomPay(debt)}
                        className="rounded-xl bg-white text-zinc-950 font-bold px-3 py-1.5 text-xs hover:bg-zinc-200 active:scale-95 transition-all shrink-0"
                      >
                        {tDebt.recordPayment}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT DEBT MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? tDebt.editDebt : tDebt.newDebt}
        subtitle={tDebt.subtitle}
      >
        <form onSubmit={handleSaveDebt} className="space-y-4 pt-2">
          {/* Debt Type Selector */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDebtType('lend')}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                debtType === 'lend'
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 mx-auto mb-1 stroke-[2.5]" />
              <span className="text-xs block font-bold">{tDebt.lent}</span>
            </button>

            <button
              type="button"
              onClick={() => setDebtType('borrow')}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                debtType === 'borrow'
                  ? 'bg-rose-500/15 border-rose-500/35 text-rose-400 font-bold shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 mx-auto mb-1 stroke-[2.5]" />
              <span className="text-xs block font-bold">{tDebt.borrowed}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {tDebt.partyNameLabel} *
            </label>
            <input
              type="text"
              required
              value={debtPerson}
              onChange={(e) => setDebtPerson(e.target.value)}
              placeholder={tDebt.partyNamePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                {tDebt.totalAmountLabel} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={debtTotal}
                onChange={(e) => setDebtTotal(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500 font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                {tDebt.initialPaidLabel}
              </label>
              <input
                type="number"
                step="any"
                value={debtPaid}
                onChange={(e) => setDebtPaid(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {tDebt.dueDateOptional}
            </label>
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {tDebt.notesLabel}
            </label>
            <textarea
              rows={2}
              value={debtNotes}
              onChange={(e) => setDebtNotes(e.target.value)}
              placeholder={tDebt.notesPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tDebt.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {editingDebt ? tDebt.save : tDebt.confirm}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
