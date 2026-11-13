import React, { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { triggerHaptic } from '../../utils/haptics';

type Insight = {
  message: Record<'ar' | 'fr' | 'en', string>;
  tag: Record<'ar' | 'fr' | 'en', string>;
  action: Record<'ar' | 'fr' | 'en', string>;
  screen: 'expenses';
  addExpense?: boolean;
};

export const DashboardAiWidget: React.FC = () => {
  const { language, transactions = [], setActiveScreen } = useAppStore();

  const insights = useMemo<Insight[]>(() => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const expenses = transactions.filter((transaction) => transaction.type === 'expense');
    const monthExpenses = expenses.filter((transaction) => transaction.date?.startsWith(monthPrefix));
    const weekExpenses = expenses.filter((transaction) => {
      const timestamp = Date.parse(transaction.date);
      return Number.isFinite(timestamp) && timestamp >= weekStart.getTime();
    });

    if (transactions.length === 0) {
      return [{
        message: {
          en: 'Your personal insights will appear here after you record a few transactions.',
          fr: 'Vos résumés apparaîtront ici après quelques transactions.',
          ar: 'غادي يبان ليك الملخص هنا من بعد ما تسجل شي معاملات.',
        },
        tag: { en: 'Getting started', fr: 'Pour commencer', ar: 'البداية' },
        action: { en: 'Add first expense', fr: 'Ajouter une dépense', ar: 'زيد أول مصروف' },
        screen: 'expenses',
        addExpense: true,
      }];
    }

    return [{
      message: {
        en: `You recorded ${weekExpenses.length} expense${weekExpenses.length === 1 ? '' : 's'} this week and ${monthExpenses.length} this month.`,
        fr: `Vous avez enregistré ${weekExpenses.length} dépense${weekExpenses.length === 1 ? '' : 's'} cette semaine et ${monthExpenses.length} ce mois-ci.`,
        ar: `سجلتي ${weekExpenses.length} مصروف هاد السيمانة و${monthExpenses.length} هاد الشهر.`,
      },
      tag: { en: 'Your activity', fr: 'Votre activité', ar: 'النشاط ديالك' },
      action: { en: 'View expenses', fr: 'Voir les dépenses', ar: 'شوف المصاريف' },
      screen: 'expenses',
    }];
  }, [transactions]);

  const currentInsight = insights[0];
  const locale = language === 'ar' || language === 'fr' || language === 'en' ? language : 'en';

  return (
    <section
      data-spotlight="true"
      aria-label={locale === 'ar' ? 'ملخص نشاطك' : locale === 'fr' ? 'Résumé de votre activité' : 'Activity summary'}
      className="spotlight-card relative flex h-fit flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_24px_rgba(99,102,241,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl group"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-500/15 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/25" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />

      <div className="relative z-10 mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">Flouss Insights</span>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-indigo-300">
              {currentInsight.tag[locale]}
            </span>
          </div>
        </div>

      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <p className="text-xs font-medium leading-relaxed text-zinc-300">{currentInsight.message[locale]}</p>
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(40);
              if (currentInsight.addExpense) {
                window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'expense' } }));
              } else {
                setActiveScreen(currentInsight.screen);
              }
            }}
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-bold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            <span>{currentInsight.action[locale]}</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </button>
          <span className="text-[10px] text-zinc-400">{locale === 'ar' ? 'ملخص من بياناتك' : locale === 'fr' ? 'Basé sur vos données' : 'Based on your data'}</span>
        </div>
      </div>
    </section>
  );
};
