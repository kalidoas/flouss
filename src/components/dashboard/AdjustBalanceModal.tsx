import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { translations } from '../../i18n/translations';
import { formatMAD } from '../../utils/formatters';
import { playHapticFeedback } from '../../utils/haptics';
import {
  ArrowUpRight,
  ArrowDownRight,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface AdjustBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
}) => {
  const { reconcileCurrentBalance, language } = useAppStore();
  const tWallet = translations[language].walletCard;
  const tCommon = translations[language].common;

  // Clean initial value without unnecessary decimals if whole number
  const initialStr = useMemo(() => {
    const val = typeof currentBalance === 'number' && !isNaN(currentBalance) ? currentBalance : 0;
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }, [currentBalance]);

  const [targetStr, setTargetStr] = useState<string>(initialStr);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state whenever modal opens or currentBalance changes
  useEffect(() => {
    if (isOpen) {
      setTargetStr(initialStr);
      setIsSubmitting(false);
    }
  }, [isOpen, initialStr]);

  // Clean numeric target parsing (handles both comma and dot)
  const targetNumeric = useMemo(() => {
    const sanitized = targetStr.replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }, [targetStr]);

  const diff = useMemo(() => {
    return Math.round((targetNumeric - currentBalance) * 100) / 100;
  }, [targetNumeric, currentBalance]);

  const handleQuickDelta = (delta: number) => {
    playHapticFeedback('selection');
    const newTarget = Math.max(0, Math.round((targetNumeric + delta) * 100) / 100);
    setTargetStr(newTarget.toString());
  };

  const handleReset = () => {
    playHapticFeedback('selection');
    setTargetStr(initialStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      playHapticFeedback('success');
      await reconcileCurrentBalance(targetNumeric);
      onClose();
    } catch (err) {
      console.error('Error reconciling balance:', err);
      playHapticFeedback('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={tWallet.adjustBalanceTitle}
      subtitle={tWallet.adjustBalanceSubtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Comparison Header Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Current Live Calculated Balance */}
          <div className="p-3 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              {tWallet.currentCalculated}
            </span>
            <span className="text-base font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {formatMAD(currentBalance, false, language)}
            </span>
          </div>

          {/* Real-time Adjustment Delta */}
          <div
            className={`p-3 rounded-2xl border transition-colors ${
              diff > 0
                ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : diff < 0
                ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/20 text-rose-700 dark:text-rose-300'
                : 'bg-zinc-100/80 dark:bg-zinc-800/60 border-black/[0.04] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-semibold opacity-75 uppercase tracking-wider block">
              {tWallet.adjustmentImpact}
            </span>
            <div className="flex items-center gap-1 text-base font-bold tabular-nums">
              {diff > 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>+{formatMAD(diff, false, language)}</span>
                </>
              ) : diff < 0 ? (
                <>
                  <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                  <span>{formatMAD(diff, false, language)}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>0 {translations[language].currency}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Big Apple-Style Numeric Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
            {tWallet.newBalanceLabel}
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              placeholder="0.00"
              className="w-full text-3xl font-extrabold py-3.5 px-4 rounded-2xl border border-blue-500/30 dark:border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition-all pr-24 tabular-nums"
            />
            <span className="absolute right-3.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/25 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
              {translations[language].currency}
            </span>
          </div>

          {/* Quick Increment/Decrement Chips & Reset Button */}
          <div className="flex items-center justify-between gap-1.5 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {[-100, -50, 10, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickDelta(val)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                    val > 0
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center gap-1 transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{tWallet.resetToCalculated}</span>
            </button>
          </div>
        </div>

        {/* Minimalist Info Callout */}
        <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] opacity-90">
            {tWallet.explanationText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={isSubmitting}>
            {tCommon.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting}
            icon={<Check className="w-4 h-4 stroke-[2.5]" />}
          >
            {isSubmitting ? '...' : tWallet.confirmAdjustment}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
