import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { AppleGlassCard } from '../common/AppleGlassCard';
import { PrivacyCurrency } from '../common/PrivacyCurrency';
import { calculateAvailableBalance, selectFinancialSummary } from '../../utils/calculations';
import { getCurrentMonthStr } from '../../utils/formatters';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface AIAssistantCardProps {
  onQuickAction?: () => void;
}

export const AIAssistantCard: React.FC<AIAssistantCardProps> = ({ onQuickAction }) => {
  const { initialBalance, transactions, language, setActiveScreen } = useAppStore();
  const currentMonth = getCurrentMonthStr();

  const balance = calculateAvailableBalance(initialBalance, transactions);

  const monthSummary = selectFinancialSummary(transactions, { month: currentMonth });
  const incomeThisMonth = monthSummary.income;
  const expenseThisMonth = monthSummary.expenses;

  const isAr = language === 'ar';
  const isEn = language === 'en';

  const isHealthy = balance > 0;

  return (
    <AppleGlassCard
      className="p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between space-y-4"
      spotlightColor="rgba(99, 102, 241, 0.2)"
      enableTilt={false}
    >
      {/* Ambient AI Neon Glow */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.5)] border border-white/25">
              <Sparkles className="w-4 h-4" />
            </div>
            {/* Pulsing online badge */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white dark:border-zinc-900" />
            </span>
          </div>

          <div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>{isAr ? 'المساعد المالي الذكي' : isEn ? 'AI Financial Assistant' : 'Assistant Financier IA'}</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                Pro
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isAr ? 'تحليل لحظي لمؤشراتك المالية' : isEn ? 'Live financial health intelligence' : 'Analyse continue de votre santé financière'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>{isAr ? '100% محلي وخاص' : isEn ? '100% Private' : '100% Privé'}</span>
        </div>
      </div>

      {/* Dynamic AI Financial Tip */}
      <div className="relative z-10 p-3.5 rounded-2xl bg-white/70 dark:bg-zinc-800/60 backdrop-blur-xl border border-black/[0.05] dark:border-white/[0.08] space-y-2">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-3.5 h-3.5" />
          </div>

          <div className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed min-w-0">
            {isHealthy ? (
              <span>
                {isAr ? (
                  <>
                    أداء مالي رائع هذا الشهر! لديك{' '}
                    <PrivacyCurrency amount={balance} className="font-bold text-emerald-600 dark:text-emerald-400" />{' '}
                    متاحة كفائض للادخار أو تحويلها نحو أهدافك المالية.
                  </>
                ) : isEn ? (
                  <>
                    Great job managing your budget! You have{' '}
                    <PrivacyCurrency amount={balance} className="font-bold text-emerald-600 dark:text-emerald-400" />{' '}
                    left to save or invest toward your goals.
                  </>
                ) : (
                  <>
                    Excellent travail de gestion budgétaire ! Vous disposez de{' '}
                    <PrivacyCurrency amount={balance} className="font-bold text-emerald-600 dark:text-emerald-400" />{' '}
                    de marge disponible pour booster votre épargne.
                  </>
                )}
              </span>
            ) : (
              <span>
                {isAr
                  ? 'تنبيه: نفقاتك هذا الشهر تضغط على رصيدك المتاح. ننصحك بالاطلاع على تفصيل الفئات لترشيد المصاريف.'
                  : isEn
                  ? 'Heads up: Spending has surpassed your inflows this month. Review your category limits to stay balanced.'
                  : 'Attention : Vos dépenses du mois pèsent sur votre solde. Vérifiez vos plafonds par catégorie pour rééquilibrer votre budget.'}
              </span>
            )}
          </div>
        </div>

        {/* Action Link */}
        <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.05] text-[11px]">
          <span className="text-zinc-400 dark:text-zinc-500">
            {isAr
              ? `المداخيل: +${incomeThisMonth.toFixed(0)} DH • المصاريف: -${expenseThisMonth.toFixed(0)} DH`
              : `Entrées: +${incomeThisMonth.toFixed(0)} DH • Sorties: -${expenseThisMonth.toFixed(0)} DH`}
          </span>

          <button
            onClick={() => {
              if (onQuickAction) onQuickAction();
              else setActiveScreen('categories');
            }}
            className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <span>{isAr ? 'عرض التفاصيل' : isEn ? 'Explore' : 'Optimiser'}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </AppleGlassCard>
  );
};
