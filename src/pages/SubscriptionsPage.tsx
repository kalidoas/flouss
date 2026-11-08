import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { SubscriptionItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { MoneyText } from '../components/common/PrivacyCurrency';
import { formatMAD, getCurrentMonthStr } from '../utils/formatters';
import { translations } from '../i18n/translations';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Receipt,
  Check,
  Bell,
} from 'lucide-react';
import {
  buildMonthlyBillRRule,
  deleteCalendarEventByFloussId,
  handleBillPaidCalendarInstance,
  syncEntityToGoogleCalendar,
  formatRFC3339WithOffset,
  getStoredGoogleAccessToken,
} from '../services/googleCalendar';

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
  const tCommon = translations[language].common;
  const currentMonth = useMemo(() => getCurrentMonthStr(), []);
  const today = useMemo(() => new Date(), []);
  const currentDay = today.getDate();

  // Filter tab state
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('5');
  const [subCategory, setSubCategory] = useState('Télécom');
  const [subNotes, setSubNotes] = useState('');
  const [subReminderEnabled, setSubReminderEnabled] = useState(false);

  // Comprehensive Analytics Calculations
  const stats = useMemo(() => {
    let totalMonthly = 0;
    let totalPaidThisMonth = 0;
    let paidItemsCount = 0;
    let pendingItemsCount = 0;

    const list = subscriptions || [];
    list.forEach((sub) => {
      totalMonthly += sub.amount;
      const isPaid = (sub.paidMonths || []).includes(currentMonth);
      if (isPaid) {
        totalPaidThisMonth += sub.amount;
        paidItemsCount++;
      } else {
        pendingItemsCount++;
      }
    });

    const remaining = Math.max(0, totalMonthly - totalPaidThisMonth);
    const progress = totalMonthly > 0 ? Math.round((totalPaidThisMonth / totalMonthly) * 100) : 0;

    // Billing days distribution for timeline
    const daysMap = new Map<number, { count: number; hasPending: boolean; hasPaid: boolean; total: number }>();
    list.forEach((sub) => {
      const isPaid = (sub.paidMonths || []).includes(currentMonth);
      const day = Math.min(31, Math.max(1, sub.billingDay));
      const existing = daysMap.get(day) || { count: 0, hasPending: false, hasPaid: false, total: 0 };
      existing.count += 1;
      existing.total += sub.amount;
      if (isPaid) existing.hasPaid = true;
      else existing.hasPending = true;
      daysMap.set(day, existing);
    });

    return {
      totalMonthly,
      totalPaidThisMonth,
      remaining,
      progress,
      paidItemsCount,
      pendingItemsCount,
      activeCount: list.length,
      daysMap,
    };
  }, [subscriptions, currentMonth]);

  // Filtered List
  const filteredSubscriptions = useMemo(() => {
    const list = [...(subscriptions || [])];
    // Sort by billing day ascending
    list.sort((a, b) => a.billingDay - b.billingDay);

    if (activeFilter === 'paid') {
      return list.filter((s) => (s.paidMonths || []).includes(currentMonth));
    }
    if (activeFilter === 'pending') {
      return list.filter((s) => !(s.paidMonths || []).includes(currentMonth));
    }
    return list;
  }, [subscriptions, currentMonth, activeFilter]);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setSubName('');
    setSubAmount('');
    setSubDay('5');
    setSubCategory('Télécom');
    setSubNotes('');
    setSubReminderEnabled(Boolean(getStoredGoogleAccessToken()));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubAmount(sub.amount.toString());
    setSubDay(sub.billingDay.toString());
    setSubCategory(sub.category || 'Général');
    setSubNotes(sub.notes || '');
    setSubReminderEnabled(Boolean(sub.reminderEnabled || sub.googleCalendarEventId));
    setIsModalOpen(true);
  };

  const handleSaveSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(subAmount);
    const day = parseInt(subDay, 10);
    if (!subName.trim() || isNaN(amount) || amount <= 0) return;

    const validatedDay = isNaN(day) ? 1 : Math.min(31, Math.max(1, day));
    const subId = editingSub?.id || 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    let gCalEventId = editingSub?.googleCalendarEventId;

    if (subReminderEnabled) {
      const now = new Date();
      const startDay = Math.min(validatedDay, 28);
      const startDate = new Date(now.getFullYear(), now.getMonth(), startDay, 9, 0, 0);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
      const rrule = buildMonthlyBillRRule(validatedDay);

      try {
        const res = await syncEntityToGoogleCalendar({
          floussId: subId,
          title: `Facture : ${subName.trim()} (${amount} MAD)`,
          description: `Rappel de charge récurrente Flouss. Montant : ${amount} MAD`,
          startDateTime: formatRFC3339WithOffset(startDate),
          endDateTime: formatRFC3339WithOffset(endDate),
          entityType: 'bill',
          rrule,
          remindersMinutes: [1440, 0], // 1 day before + on due date at 09:00
        });
        if (res.success && res.eventId) {
          gCalEventId = res.eventId;
        }
      } catch {}
    } else if (editingSub?.googleCalendarEventId) {
      deleteCalendarEventByFloussId(subId).catch(() => {});
      gCalEventId = undefined;
    }

    if (editingSub) {
      updateSubscription(editingSub.id, {
        name: subName.trim(),
        amount,
        billingDay: validatedDay,
        category: subCategory.trim(),
        notes: subNotes.trim() || undefined,
        reminderEnabled: subReminderEnabled,
        googleCalendarEventId: gCalEventId,
      });
    } else {
      addSubscription({
        id: subId,
        name: subName.trim(),
        amount,
        billingDay: validatedDay,
        category: subCategory.trim(),
        notes: subNotes.trim() || undefined,
        paidMonths: [],
        reminderEnabled: subReminderEnabled,
        googleCalendarEventId: gCalEventId,
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  // Helper for due badge
  const getDueBadge = (sub: SubscriptionItem, isPaid: boolean) => {
    if (isPaid) {
      return {
        label: (tSub.paidOnDay || 'Payé (jour {day})').replace('{day}', String(sub.billingDay)),
        colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: <Check className="w-3 h-3 stroke-[2.5]" />,
      };
    }

    const diff = sub.billingDay - currentDay;
    if (diff === 0) {
      return {
        label: tSub.dueToday || 'Échéance aujourd’hui',
        colorClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse',
        icon: <AlertCircle className="w-3 h-3" />,
      };
    }
    if (diff > 0) {
      return {
        label: (tSub.dueInDays || 'Dans {days} jours').replace('{days}', String(diff)),
        colorClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: <Clock className="w-3 h-3" />,
      };
    }
    return {
      label: (tSub.overdueBy || 'En retard ({days} j)').replace('{days}', String(Math.abs(diff))),
      colorClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: <AlertCircle className="w-3 h-3" />,
    };
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-page pb-24 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              {tSub.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {tSub.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {tSub.subtitle} • {(tSub.activeCount || '{count} abonnements actifs').replace('{count}', String(stats.activeCount))}
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

      {/* 3 BENTO KPI CARDS - APPLE GLASSMORPHISM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Total Liability */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-card p-5 bg-surface backdrop-blur-2xl border border-border-subtle shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-caption font-bold uppercase tracking-wider text-muted block">
                {tSub.monthlyLiability}
              </span>
              <MoneyText
                amount={stats.totalMonthly}
                className="text-2xl sm:text-3xl font-black tracking-tight text-content"
              />
            </div>
            <div className="w-10 h-10 rounded-card bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/15">
              <Receipt className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1 font-semibold text-content">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {stats.activeCount} {(tSub.activeCount || 'actifs').replace('{count}', '')}
            </span>
            <span>•</span>
            <span>100% {tSub.subtitle}</span>
          </div>
        </motion.div>

        {/* KPI 2: Paid This Month */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-card p-5 bg-surface backdrop-blur-2xl border border-border-subtle shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-caption font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {tSub.paidThisMonth}
              </span>
              <MoneyText
                amount={stats.totalPaidThisMonth}
                className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div className="w-10 h-10 rounded-card bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/15">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {(tSub.paidCount || '{count} payés').replace('{count}', String(stats.paidItemsCount))}
            </span>
            <span className="font-bold tabular-nums text-content">
              {stats.progress}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </motion.div>

        {/* KPI 3: Remaining Due This Month */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-card p-5 bg-surface backdrop-blur-2xl border border-border-subtle shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-caption font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                {tSub.remainingThisMonth}
              </span>
              <MoneyText
                amount={stats.remaining}
                className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400"
              />
            </div>
            <div className="w-10 h-10 rounded-card bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/15">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {(tSub.pendingCount || '{count} en attente').replace('{count}', String(stats.pendingItemsCount))}
            </span>
            <span className="font-semibold text-zinc-500">
              {stats.totalMonthly > 0 ? 100 - stats.progress : 0}%
            </span>
          </div>
          {/* Inverted progress */}
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-2">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.totalMonthly > 0 ? 100 - stats.progress : 0}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* MONTHLY BILLING SCHEDULE STRIP */}
      {stats.activeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-card p-5 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl border border-border-subtle space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-content">
                {tSub.calendarTitle || 'Calendrier des prélèvements'}
              </h3>
            </div>
            <span className="text-caption font-semibold text-muted">
              {language === 'ar' ? `اليوم: ${currentDay}` : `Aujourd’hui : jour ${currentDay}`}
            </span>
          </div>

          {/* 31-day visual timeline strip */}
          <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-16 lg:grid-cols-31 gap-1.5 pt-1 overflow-x-auto pb-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const dayData = stats.daysMap.get(day);
              const isToday = day === currentDay;

              let dotClass = 'bg-zinc-100 dark:bg-zinc-800/80 text-muted border-transparent';
              if (dayData) {
                if (dayData.hasPending && day < currentDay) {
                  dotClass = 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 font-bold';
                } else if (dayData.hasPending) {
                  dotClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold';
                } else {
                  dotClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold';
                }
              }

              return (
                <div
                  key={day}
                  title={
                    dayData
                      ? `Jour ${day}: ${dayData.count} abonnement(s) (${formatMAD(dayData.total, false, language)})`
                      : `Jour ${day}`
                  }
                  className={`relative flex flex-col items-center justify-center p-1.5 rounded-control border text-caption tabular-nums transition-all ${dotClass} ${
                    isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-xs' : ''
                  }`}
                >
                  <span className="font-semibold">{day}</span>
                  {dayData && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        dayData.hasPending ? (day < currentDay ? 'bg-rose-500' : 'bg-amber-500') : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-muted hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {tSub.allFilter || 'Tous'} ({stats.activeCount})
        </button>

        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all ${
            activeFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-muted hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {tSub.pendingFilter} ({stats.pendingItemsCount})
        </button>

        <button
          onClick={() => setActiveFilter('paid')}
          className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all ${
            activeFilter === 'paid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-muted hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {tSub.paidFilter || 'Payés'} ({stats.paidItemsCount})
        </button>
      </div>

      {/* SUBSCRIPTIONS ANALYTICAL LIST */}
      <div className="space-y-3">
        {filteredSubscriptions.length === 0 ? (
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
          filteredSubscriptions.map((sub) => {
            const isPaid = (sub.paidMonths || []).includes(currentMonth);
            const dueBadge = getDueBadge(sub, isPaid);

            return (
              <motion.div
                key={sub.id}
                layout
                whileHover={{ y: -2 }}
                className={`p-4 sm:p-5 rounded-card border transition-all ${
                  isPaid
                    ? 'bg-white/60 dark:bg-zinc-900/40 border-border-subtle'
                    : 'bg-surface backdrop-blur-xl border-border-subtle shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-caption font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-muted border border-black/[0.04] dark:border-white/[0.06]">
                        {sub.category || 'Abonnement'}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-content tracking-tight">
                        {sub.name}
                      </h4>
                      {/* Due timing indicator */}
                      <span
                        className={`inline-flex items-center gap-1 text-caption font-bold px-2 py-0.5 rounded-full border ${dueBadge.colorClass}`}
                      >
                        {dueBadge.icon}
                        <span>{dueBadge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted">
                      <div className="flex items-center gap-1 tabular-nums font-medium">
                        <Calendar className="w-3.5 h-3.5 text-muted" />
                        <span>{tSub.dayOfMonth.replace('{day}', String(sub.billingDay))}</span>
                      </div>
                      {sub.notes && <span className="truncate max-w-xs">• {sub.notes}</span>}
                    </div>
                  </div>

                  {/* Amount and Status Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <div className="text-right">
                      <MoneyText
                        amount={sub.amount}
                        className="text-base sm:text-lg font-black text-content tracking-tight"
                      />
                      <span
                        className={`text-caption font-bold block ${
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
                      onClick={() => {
                        toggleSubscriptionPaid(sub.id, currentMonth);
                        handleBillPaidCalendarInstance(sub.id, currentMonth).catch(() => {});
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold transition-all ${
                        isPaid
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-content hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                      <span>{isPaid ? tSub.paid : tSub.markPaid}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1.5 rounded-control text-muted hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title={tSub.editSubscription}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          deleteSubscription(sub.id);
                          deleteCalendarEventByFloussId(sub.id).catch(() => {});
                        }}
                        className="p-1.5 rounded-control text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title={tCommon.delete}
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
            <label className="block text-xs font-bold text-content mb-1">
              {tSub.nameLabel} *
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder={tSub.namePlaceholder}
              className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-content mb-1">
                {tSub.amountLabel} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content mb-1">
                {tSub.dayLabel}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
                className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-content mb-1">
              {tSub.categoryLabel}
            </label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Ex: Télécom, Sport, Logement..."
              className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-content mb-1">
              {tSub.notesLabel}
            </label>
            <textarea
              rows={2}
              value={subNotes}
              onChange={(e) => setSubNotes(e.target.value)}
              placeholder={tSub.notesPlaceholder}
              className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
