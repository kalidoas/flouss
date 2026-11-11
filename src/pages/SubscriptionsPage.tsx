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
import { playHapticFeedback } from '../utils/haptics';
import confetti from 'canvas-confetti';
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
  Receipt,
  Check,
  Zap,
  CheckCheck,
} from 'lucide-react';
import {
  buildMonthlyBillRRule,
  deleteCalendarEventByFloussId,
  handleBillPaidCalendarInstance,
  syncEntityToGoogleCalendar,
  formatRFC3339WithOffset,
  getStoredGoogleAccessToken,
} from '../services/googleCalendar';
import { SwipeRow } from '../components/common/SwipeRow';

export const SubscriptionsPage: React.FC = () => {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionPaid,
    language,
    showToast,
  } = useAppStore();

  const tSub = translations[language].subscriptions;
  const tCommon = translations[language].common;
  const currentMonth = useMemo(() => getCurrentMonthStr(), []);
  const today = useMemo(() => new Date(), []);
  const currentDay = today.getDate();
  const daysInMonth = useMemo(() => {
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  }, [today]);

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

    // Billing days map
    const daysMap = new Map<number, { count: number; hasPending: boolean; hasPaid: boolean; total: number; names: string[] }>();
    list.forEach((sub) => {
      const isPaid = (sub.paidMonths || []).includes(currentMonth);
      const day = Math.min(31, Math.max(1, sub.billingDay));
      const existing = daysMap.get(day) || { count: 0, hasPending: false, hasPaid: false, total: 0, names: [] };
      existing.count += 1;
      existing.total += sub.amount;
      existing.names.push(sub.name);
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
          remindersMinutes: [1440, 0],
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
      playHapticFeedback('light');
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
      playHapticFeedback('success');
    }

    setIsModalOpen(false);
  };

  const handleTogglePaidWithCelebration = (sub: SubscriptionItem) => {
    const isCurrentlyPaid = (sub.paidMonths || []).includes(currentMonth);
    toggleSubscriptionPaid(sub.id, currentMonth);
    handleBillPaidCalendarInstance(sub.id, currentMonth).catch(() => {});

    if (!isCurrentlyPaid) {
      playHapticFeedback('success');
      const willCompleteAll = stats.pendingItemsCount === 1;
      if (willCompleteAll) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        showToast({
          message: language === 'ar'
            ? `🎉 تم سداد جميع اشتراكات الشهر بنجاح (100%)!`
            : language === 'en'
            ? `🎉 All subscriptions for this month are paid (100%)!`
            : `🎉 Tous les abonnements du mois sont payés (100%) !`,
        });
      } else {
        showToast({
          message: language === 'ar'
            ? `✓ تم تحديد "${sub.name}" كمدفوع!`
            : language === 'en'
            ? `✓ "${sub.name}" marked as paid!`
            : `✓ "${sub.name}" marqué comme payé !`,
        });
      }
    } else {
      playHapticFeedback('light');
    }
  };

  // Helper for due countdown badge: "⚡ Due in X days · Y% of load"
  const getDueBadge = (sub: SubscriptionItem, isPaid: boolean) => {
    const loadPercent = stats.totalMonthly > 0
      ? Math.round((sub.amount / stats.totalMonthly) * 100)
      : 0;

    if (isPaid) {
      return {
        label: `${tSub.paid} · ${loadPercent}% ${tSub.ofLoad}`,
        colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: <Check className="w-3 h-3 stroke-[2.5]" />,
      };
    }

    const diff = sub.billingDay - currentDay;
    if (diff === 0) {
      return {
        label: `${tSub.dueToday} · ${loadPercent}% ${tSub.ofLoad}`,
        colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse',
        icon: <AlertCircle className="w-3 h-3" />,
      };
    }
    if (diff > 0) {
      return {
        label: `${tSub.dueInDays.replace('{days}', String(diff))} · ${loadPercent}% ${tSub.ofLoad}`,
        colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
        icon: <Clock className="w-3 h-3" />,
      };
    }
    return {
      label: `${tSub.overdueBy.replace('{days}', String(Math.abs(diff)))} · ${loadPercent}% ${tSub.ofLoad}`,
      colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
      icon: <AlertCircle className="w-3 h-3" />,
    };
  };

  // Unique billing days for timeline radar
  const sortedUniqueBillingDays = useMemo(() => {
    const days = Array.from(stats.daysMap.keys());
    days.sort((a, b) => a - b);
    return days;
  }, [stats.daysMap]);

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 animate-page pb-24 select-text">
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tSub.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tSub.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {tSub.subtitle} • {(tSub.activeCount || '{count} abonnements').replace('{count}', String(stats.activeCount))}
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

      {/* ── 3 Bento KPI Cards (Living Cosmic Glow & Spotlight) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* KPI 1: Total Liability */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] group hover:border-indigo-500/30 transition-all duration-300 after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-indigo-400/50 after:to-transparent"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                {tSub.monthlyLiability}
              </span>
              <MoneyText
                amount={stats.totalMonthly}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white tabular-nums block"
              />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Receipt className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 font-semibold text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {tSub.activeCount.replace('{count}', String(stats.activeCount))}
            </span>
            <span>•</span>
            <span>100% {tSub.subtitle}</span>
          </div>
        </motion.div>

        {/* KPI 2: Paid This Month */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] group hover:border-emerald-500/30 transition-all duration-300 after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-emerald-400/50 after:to-transparent"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block">
                {tSub.paidThisMonth}
              </span>
              <MoneyText
                amount={stats.totalPaidThisMonth}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400 tabular-nums block"
              />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400">
              {(tSub.paidCount || '{count} payés').replace('{count}', String(stats.paidItemsCount))}
            </span>
            <span className="font-bold tabular-nums text-white">
              {stats.progress}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </motion.div>

        {/* KPI 3: Remaining Due This Month */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] group hover:border-amber-500/30 transition-all duration-300 after:absolute after:inset-x-8 after:bottom-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-amber-400/50 after:to-transparent"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block">
                {tSub.remainingThisMonth}
              </span>
              <MoneyText
                amount={stats.remaining}
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-400 tabular-nums block"
              />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-400">
              {(tSub.pendingCount || '{count} en attente').replace('{count}', String(stats.pendingItemsCount))}
            </span>
            <span className="font-semibold text-zinc-500">
              {stats.totalMonthly > 0 ? 100 - stats.progress : 0}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.totalMonthly > 0 ? 100 - stats.progress : 0}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* ── Compact Single-Row Monthly Timeline & Radar Bar (Replaces bulky 31 boxes) ── */}
      {stats.activeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-white/5 backdrop-blur-xl border border-white/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {tSub.radarTitle}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {tSub.paid}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {tSub.upcoming}
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                {tSub.todayDay.replace('{day}', String(currentDay))}
              </span>
            </div>
          </div>

          {/* Continuous Radar Track Bar */}
          <div className="relative pt-6 pb-4 px-2">
            {/* Background Line */}
            <div className="h-1.5 w-full bg-white/[0.08] rounded-full relative">
              {/* Elapsed Month Gradient Fill */}
              <div
                className="h-full bg-gradient-to-r from-indigo-500/40 to-indigo-500 rounded-full"
                style={{ width: `${Math.min(100, (currentDay / daysInMonth) * 100)}%` }}
              />

              {/* Today Glowing Indicator Pill */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                style={{ left: `${Math.min(100, (currentDay / daysInMonth) * 100)}%` }}
              >
                <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                <span className="absolute -top-6 text-[10px] font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded-full border border-indigo-500/30 whitespace-nowrap">
                  {language === 'ar' ? `اليوم (${currentDay})` : `J.${currentDay}`}
                </span>
              </div>

              {/* Mapped Subscription Event Nodes along the bar */}
              {sortedUniqueBillingDays.map((day) => {
                const info = stats.daysMap.get(day);
                if (!info) return null;
                const posPercent = Math.min(100, Math.max(0, (day / daysInMonth) * 100));
                const isPast = day < currentDay;
                const isToday = day === currentDay;

                let nodeColor = 'bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
                if (!info.hasPending) {
                  nodeColor = 'bg-emerald-400 border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
                } else if (isPast) {
                  nodeColor = 'bg-rose-400 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
                }

                return (
                  <div
                    key={day}
                    style={{ left: `${posPercent}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer z-10"
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 group-hover:scale-150 ${nodeColor}`} />

                    {/* Hover Floating Tooltip Card */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 bg-[#12131C] border border-white/10 rounded-xl px-2.5 py-1.5 shadow-xl text-center whitespace-nowrap z-30">
                      <div className="text-[11px] font-bold text-white">
                        {tSub.dayNumber.replace('{day}', String(day))} • {formatMAD(info.total)}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                        {info.names.join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scale Numbers below the bar */}
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-3">
              <span>1</span>
              <span>7</span>
              <span>15</span>
              <span>22</span>
              <span>{daysInMonth}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Single-Row Sleek Glass Filter Tabs ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeFilter === 'all'
              ? 'bg-white text-zinc-950 font-bold shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          {tSub.allFilter || 'Tous'} ({stats.activeCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeFilter === 'pending'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          {tSub.pendingFilter} ({stats.pendingItemsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('paid')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeFilter === 'paid'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          {tSub.paidFilter || 'Payés'} ({stats.paidItemsCount})
        </button>
      </div>

      {/* ── Subscriptions 2-Column Bento Grid ── */}
      {filteredSubscriptions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-5 h-5 text-indigo-400" />}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredSubscriptions.map((sub) => {
            const isPaid = (sub.paidMonths || []).includes(currentMonth);
            const dueBadge = getDueBadge(sub, isPaid);

            return (
              <SwipeRow
                key={sub.id}
                onDelete={() => {
                  deleteSubscription(sub.id);
                  deleteCalendarEventByFloussId(sub.id).catch(() => {});
                }}
                onEdit={() => handleOpenEdit(sub)}
              >
                <div
                  className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
                    isPaid
                      ? 'bg-white/5 border-white/[0.04] opacity-80'
                      : 'bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                  }`}
                >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                        {sub.category === 'Abonnement' ? tSub.defaultCategory : (sub.category || tSub.defaultCategory)}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-white tracking-tight truncate">
                        {sub.name}
                      </h4>
                    </div>

                    {/* Due Timing & Load Badge: "⚡ Due in X days · Y% of load" */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${dueBadge.colorClass}`}
                      >
                        {dueBadge.icon}
                        <span>{dueBadge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 pt-0.5">
                      <div className="flex items-center gap-1 tabular-nums font-medium">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{tSub.dayOfMonth.replace('{day}', String(sub.billingDay))}</span>
                      </div>
                      {sub.notes && (
                        <span className="truncate max-w-xs text-zinc-500">
                          • {sub.notes === 'Paiement mensuel' ? tSub.monthlyPayment : sub.notes === 'Prélèvement mensuel' ? tSub.monthlyDebit : sub.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                      title={tSub.editSubscription}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteSubscription(sub.id);
                        deleteCalendarEventByFloussId(sub.id).catch(() => {});
                      }}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title={tCommon.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount and 1-Click "Mark Paid" Button Row */}
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider block">
                      {isPaid ? tSub.paidBadge : tSub.pendingBadge}
                    </span>
                    <MoneyText
                      amount={sub.amount}
                      className={`text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums block ${
                        isPaid ? 'text-emerald-400' : 'text-white'
                      }`}
                    />
                  </div>

                  {/* High-Contrast 1-Click "Mark Paid" Pill Button (Requested by user) */}
                  <button
                    type="button"
                    onClick={() => handleTogglePaidWithCelebration(sub)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 ${
                      isPaid
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>{tSub.paid}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>{tSub.markPaid}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SwipeRow>
          );
        })}
        </div>
      )}

      {/* ── CREATE / EDIT SUBSCRIPTION MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? tSub.editSubscription : tSub.newSubscription}
        subtitle={tSub.subtitle}
      >
        <form onSubmit={handleSaveSub} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {tSub.nameLabel} *
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder={tSub.namePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                {tSub.amountLabel} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500 font-bold tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                {tSub.dayLabel}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500 tabular-nums font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {tSub.categoryLabel}
            </label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Ex: Télécom, Sport, Logement..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {tSub.notesLabel}
            </label>
            <textarea
              rows={2}
              value={subNotes}
              onChange={(e) => setSubNotes(e.target.value)}
              placeholder={tSub.notesPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
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
