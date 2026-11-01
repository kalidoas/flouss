import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { SubscriptionItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatMAD, getCurrentMonthStr } from '../utils/formatters';
import { translations } from '../i18n/translations';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionPaid,
    hideBalance,
    language,
  } = useAppStore();

  const tSub = translations[language].subscriptions;
  const currentMonth = useMemo(() => getCurrentMonthStr(), []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('5');
  const [subCategory, setSubCategory] = useState('Télécom');
  const [subNotes, setSubNotes] = useState('');

  // Calculations
  const stats = useMemo(() => {
    let totalMonthly = 0;
    let totalPaidThisMonth = 0;

    (subscriptions || []).forEach((sub) => {
      totalMonthly += sub.amount;
      const isPaid = (sub.paidMonths || []).includes(currentMonth);
      if (isPaid) {
        totalPaidThisMonth += sub.amount;
      }
    });

    const remaining = totalMonthly - totalPaidThisMonth;
    const progress = totalMonthly > 0 ? Math.round((totalPaidThisMonth / totalMonthly) * 100) : 0;

    return { totalMonthly, totalPaidThisMonth, remaining, progress };
  }, [subscriptions, currentMonth]);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setSubName('');
    setSubAmount('');
    setSubDay('5');
    setSubCategory('Télécom');
    setSubNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubAmount(sub.amount.toString());
    setSubDay(sub.billingDay.toString());
    setSubCategory(sub.category || 'Général');
    setSubNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(subAmount);
    const day = parseInt(subDay, 10);
    if (!subName.trim() || isNaN(amount) || amount <= 0) return;

    if (editingSub) {
      updateSubscription(editingSub.id, {
        name: subName.trim(),
        amount,
        billingDay: isNaN(day) ? 1 : Math.min(31, Math.max(1, day)),
        category: subCategory.trim(),
        notes: subNotes.trim() || undefined,
      });
    } else {
      addSubscription({
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: subName.trim(),
        amount,
        billingDay: isNaN(day) ? 1 : Math.min(31, Math.max(1, day)),
        category: subCategory.trim(),
        notes: subNotes.trim() || undefined,
        paidMonths: [],
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-page pb-20 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {tSub.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {tSub.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {tSub.subtitle}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          <span>{tSub.newSubscription}</span>
        </Button>
      </div>

      {/* Hero Summary: Apple HIG Translucent Surface */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 sm:p-7 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              {tSub.totalMonthly}
            </span>
            <div
              className={`text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums transition-[filter] duration-200 ${
                hideBalance ? 'privacy-blur' : ''
              }`}
            >
              {formatMAD(stats.totalMonthly, false, language)}{' '}
              <span className="text-xs sm:text-sm font-normal text-zinc-400">/ mois</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 rounded-2xl border border-black/[0.04] dark:border-white/[0.05]">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                {tSub.paidThisMonth}
              </span>
              <span
                className={`text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight transition-[filter] duration-200 ${
                  hideBalance ? 'privacy-blur' : ''
                }`}
              >
                {formatMAD(stats.totalPaidThisMonth, false, language)}
              </span>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                {tSub.remaining}
              </span>
              <span
                className={`text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight transition-[filter] duration-200 ${
                  hideBalance ? 'privacy-blur' : ''
                }`}
              >
                {formatMAD(stats.remaining, false, language)}
              </span>
            </div>
          </div>
        </div>

        {/* Apple Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{tSub.progress}</span>
            <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">
              {stats.progress}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-5 h-5" />}
            title={tSub.emptyTitle}
            description={tSub.emptyDesc}
            action={
              <Button
                onClick={handleOpenAdd}
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                <span>{tSub.addFirst}</span>
              </Button>
            }
          />
        ) : (
          subscriptions.map((sub) => {
            const isPaid = (sub.paidMonths || []).includes(currentMonth);

            return (
              <motion.div
                key={sub.id}
                whileHover={{ y: -2 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isPaid
                    ? 'bg-white/60 dark:bg-zinc-900/40 border-black/[0.04] dark:border-white/[0.05]'
                    : 'bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border-black/[0.06] dark:border-white/[0.08] shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06]">
                        {sub.category || 'Abonnement'}
                      </span>
                      <h4 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight">
                        {sub.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{tSub.dayOfMonth.replace('{day}', String(sub.billingDay))}</span>
                      </div>
                      {sub.notes && <span>• {sub.notes}</span>}
                    </div>
                  </div>

                  {/* Amount and Status Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight transition-[filter] duration-200 ${
                          hideBalance ? 'privacy-blur' : ''
                        }`}
                      >
                        {formatMAD(sub.amount, false, language)}
                      </div>
                      <span
                        className={`text-[10px] font-semibold ${
                          isPaid
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isPaid ? tSub.paidBadge : tSub.pendingBadge}
                      </span>
                    </div>

                    {/* Quick Paid Toggle Button */}
                    <button
                      onClick={() => toggleSubscriptionPaid(sub.id, currentMonth)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isPaid
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPaid ? tSub.paid : tSub.markPaid}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={tSub.editSubscription}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT SUBSCRIPTION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? tSub.editSubscription : tSub.newSubscription}
        subtitle={tSub.subtitle}
      >
        <form onSubmit={handleSaveSub} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tSub.nameLabel} *
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder={tSub.namePlaceholder}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {tSub.amountLabel} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {tSub.dayLabel}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tSub.categoryLabel}
            </label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Ex: Télécom, Sport, Logement..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tSub.notesLabel}
            </label>
            <textarea
              rows={2}
              value={subNotes}
              onChange={(e) => setSubNotes(e.target.value)}
              placeholder={tSub.notesPlaceholder}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tSub.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {editingSub ? tSub.save : tSub.add}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
