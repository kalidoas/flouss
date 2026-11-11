import React, { useState } from 'react';
import { Sparkles, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { triggerHaptic } from '../../utils/haptics';

export const DashboardAiWidget: React.FC = () => {
  const { language, transactions = [], setActiveScreen } = useAppStore();
  const [insightIndex, setInsightIndex] = useState(0);

  const insights = [
    {
      en: 'Watch out, high Fast Food spending this week — 28% higher than last week. Consider setting a daily lunch cap.',
      fr: 'Attention, dépenses élevées en Fast Food cette semaine (+28%). Pensez à fixer un plafond repas.',
      ar: 'انتبه، مصاريف الوجبات السريعة مرتفعة هذا الأسبوع بنسبة 28%. فكر في وضع حد يومي للغداء.',
      tag: { en: 'Spending Alert', fr: 'Alerte Dépenses', ar: 'تنبيه إنفاق' },
      action: { en: 'View Expenses', fr: 'Voir dépenses', ar: 'عرض المصاريف' },
      screen: 'expenses' as const,
    },
    {
      en: 'Great rhythm! You completed 100% of your morning habits 4 days in a row.',
      fr: 'Excellent rythme ! 100% de vos habitudes matinales accomplies 4 jours d’affilée.',
      ar: 'إيقاع رائع! أنجزت 100% من عاداتك الصباحية لـ 4 أيام متتالية.',
      tag: { en: 'Habit Streak', fr: 'Série Positive', ar: 'سلسلة إنجاز' },
      action: { en: 'Open Program', fr: 'Ouvrir programme', ar: 'فتح البرنامج' },
      screen: 'tasks' as const,
    },
    {
      en: 'Recurring subscription due in 3 days. Your projected end-of-month savings remain healthy.',
      fr: 'Abonnement récurrent prélevé dans 3 jours. Votre prévision d’épargne reste optimale.',
      ar: 'اشتراك دوري مستحق خلال 3 أيام. توقعاتك للادخار نهاية الشهر ممتازة.',
      tag: { en: 'Cash Flow', fr: 'Trésorerie', ar: 'التدفق المالي' },
      action: { en: 'Check Bills', fr: 'Vérifier factures', ar: 'مراجعة الفواتير' },
      screen: 'subscriptions' as const,
    },
  ];

  const currentInsight = insights[insightIndex % insights.length];

  const handleNextInsight = () => {
    triggerHaptic(40);
    setInsightIndex((prev) => (prev + 1) % insights.length);
  };

  return (
    <div
      data-spotlight="true"
      className="spotlight-card relative overflow-hidden rounded-2xl bg-white/5 p-4 backdrop-blur-xl border border-white/10 shadow-[0_0_24px_rgba(99,102,241,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)] group h-fit flex flex-col justify-between"
    >
      {/* Animated Subtle Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-500" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">Flouss AI</span>
            <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.2 text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">
              {currentInsight.tag[language] || currentInsight.tag.en}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextInsight}
          title={language === 'ar' ? 'فكرة تالية' : 'Insight suivant'}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Dynamic Placeholder Insight Text */}
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
          {currentInsight[language] || currentInsight.en}
        </p>

        {/* Action Button */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(40);
              setActiveScreen(currentInsight.screen);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 active:scale-95 duration-200 transition-all"
          >
            <span>{currentInsight.action[language] || currentInsight.action.en}</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </button>

          <span className="text-[10px] text-zinc-400 font-mono">
            Copilot • {insightIndex + 1}/{insights.length}
          </span>
        </div>
      </div>
    </div>
  );
};
