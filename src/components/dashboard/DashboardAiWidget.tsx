import React, { useState } from 'react';
import { ArrowRight, Sparkles, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { triggerHaptic } from '../../utils/haptics';
import { deriveDashboardInsight } from '../../utils/dashboard';
import { Category, Transaction } from '../../types';

export interface DashboardAiWidgetProps {
  transactions?: Transaction[];
  categories?: Category[];
  language?: 'ar' | 'fr' | 'en';
  uid?: string;
}

export const DashboardAiWidget: React.FC<DashboardAiWidgetProps> = (props) => {
  const storeLanguage = useAppStore((s) => s.language);
  const storeTransactions = useAppStore((s) => s.transactions);
  const storeCategories = useAppStore((s) => s.categories);
  const storeFirebaseUser = useAppStore((s) => s.firebaseUser);
  const setActiveScreen = useAppStore((s) => s.setActiveScreen);

  const language = props.language ?? storeLanguage;
  const transactions = props.transactions ?? storeTransactions ?? [];
  const categories = props.categories ?? storeCategories ?? [];
  const uid = props.uid ?? storeFirebaseUser?.uid ?? 'anon';
  const dismissStorageKey = `flouss_dismiss_getting_started_${uid}`;

  const [tipDismissed, setTipDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissStorageKey) === 'true';
    } catch {
      return false;
    }
  });

  const locale = language === 'ar' || language === 'fr' || language === 'en' ? language : 'en';

  // ── RULE 1: Hide every AI/insight card when transactions.length < 3 ──
  // A "Getting started" card is allowed ONLY as a dismissible onboarding tip, never styled as an insight.
  if (transactions.length < 3) {
    if (tipDismissed) return null;

    const handleDismiss = () => {
      setTipDismissed(true);
      try {
        localStorage.setItem(dismissStorageKey, 'true');
      } catch {}
    };

    const tip = {
      title: {
        en: 'Getting started',
        fr: 'Pour commencer',
        ar: 'البداية',
      }[locale],
      desc: {
        en: 'Record at least 3 transactions over time to unlock automated insights and smart trend detection.',
        fr: 'Enregistrez au moins 3 transactions pour débloquer les analyses automatiques et la détection des tendances.',
        ar: 'سجل على الأقل 3 معاملات مع الوقت باش تفتح التحليلات الذكية وتتبع المصاريف.',
      }[locale],
      action: {
        en: 'Add first expense',
        fr: 'Ajouter une dépense',
        ar: 'زيد أول مصروف',
      }[locale],
    };

    return (
      <section
        data-testid="getting-started-tip"
        aria-label={tip.title}
        className="relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface/70 p-4 shadow-xs backdrop-blur-sm transition-all"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/15 text-muted">
              <Info className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold text-foreground">{tip.title}</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss onboarding tip"
            className="rounded p-1 text-muted hover:bg-muted/10 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">{tip.desc}</p>
        <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(40);
              window.dispatchEvent(new CustomEvent('flouss:quick-add', { detail: { type: 'expense' } }));
            }}
            className="inline-flex min-h-7 items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:underline"
          >
            <span>{tip.action}</span>
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </button>
        </div>
      </section>
    );
  }

  // ── RULE 2: Derive AI insight (weekly comparison ONLY if >= 2 weeks of data) ──
  const currentInsight = deriveDashboardInsight(transactions, categories);
  if (!currentInsight) return null;

  return (
    <section
      data-testid="ai-insight-card"
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
          <span className="text-[10px] text-zinc-400">
            {locale === 'ar' ? 'ملخص من بياناتك' : locale === 'fr' ? 'Basé sur vos données' : 'Based on your data'}
          </span>
        </div>
      </div>
    </section>
  );
};
