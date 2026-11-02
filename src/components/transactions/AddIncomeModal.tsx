import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  getTodayDateStr,
  getCurrentTimeStr,
  toIsoDateTime,
} from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getIncomeSourceName, getIncomeSubSourceName } from '../../utils/i18nHelpers';
import { ArrowUpRight, Repeat, Tag, Check } from 'lucide-react';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceId?: string;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  defaultSourceId,
}) => {
  const { incomeSources, addTransaction, recentNotes, language } = useAppStore();
  const t = translations[language].common;
  const tInc = translations[language].income;

  const [amountStr, setAmountStr] = useState('');
  const [sourceId, setSourceId] = useState(defaultSourceId || (incomeSources[0]?.id ?? ''));
  const [subSourceId, setSubSourceId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(new Date().getDate());
  const [error, setError] = useState('');

  const numericAmount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;

  const selectedSource = useMemo(
    () => incomeSources.find((s) => s.id === sourceId),
    [incomeSources, sourceId]
  );

  const availableSubSources = selectedSource?.subcategories || [];

  const handleSelectSource = (id: string) => {
    setSourceId(id);
    setSubSourceId(null);
    setError('');
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.')) || 0;
    setAmountStr((current + addVal).toString());
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError(t.amountRequired);
      return;
    }
    if (!sourceId) {
      setError(t.sourceRequired);
      return;
    }

    const isoDate = toIsoDateTime(date, time);

    addTransaction({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'income',
      amount: numericAmount,
      sourceId,
      incomeSubSourceId: subSourceId || undefined,
      date: isoDate,
      note: note.trim() || undefined,
      isRecurring,
      recurringDay: isRecurring ? recurringDay : undefined,
      createdAt: new Date().toISOString(),
    });

    setAmountStr('');
    setNote('');
    setSubSourceId(null);
    setIsRecurring(false);
    setError('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t.transactionTitleIncome}
      subtitle={t.transactionSubtitleIncome}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {t.amount}
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="0,00"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setError('');
              }}
              className="w-full text-3xl font-bold py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all pr-20 tabular-nums"
            />
            <span className="absolute right-4 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl uppercase tracking-wider">
              {translations[language].currency}
            </span>
          </div>

          {/* Quick amount adder chips */}
          <div className="flex gap-1.5 mt-2">
            {[100, 500, 1000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>

          {error && <p className="text-xs font-medium text-rose-500 mt-1.5">{error}</p>}
        </div>

        {/* Source Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t.source}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            {incomeSources.map((source) => {
              const IconComp = getCategoryIcon(source.icon);
              const isSelected = sourceId === source.id;
              const srcName = getIncomeSourceName(source, language);
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => handleSelectSource(source.id)}
                  className={`relative p-2.5 rounded-2xl text-center border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold min-h-[76px] ${
                    isSelected
                      ? 'border-emerald-500 bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500 shadow-sm'
                      : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: source.color }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold leading-tight line-clamp-2 px-0.5 break-words">
                    {srcName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Income Sub-source Chips */}
        {availableSubSources.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t.incomeSubSource}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSubSourceId(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  subSourceId === null
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t.noPrecision}
              </button>

              {availableSubSources.map((sub) => {
                const isSubSelected = subSourceId === sub.id;
                const subName = getIncomeSubSourceName(sub, language);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSubSourceId(sub.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSubSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {subName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date AND Time */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t.date}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label={t.time}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {/* Recurring Income Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {tInc.repeatMonthly}
                </p>
                <p className="text-[11px] text-slate-400">
                  {t.recurringHint}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {isRecurring && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                {tInc.repeatDay}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={recurringDay}
                onChange={(e) => setRecurringDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Note with suggestions */}
        <div>
          <Input
            label={t.note}
            type="text"
            placeholder={t.notePlaceholderIncome}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {recentNotes && recentNotes.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {t.suggestions}
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {recentNotes.slice(0, 10).map((n, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNote(n)}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            icon={<ArrowUpRight className="w-4 h-4" />}
          >
            {t.saveIncome}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
