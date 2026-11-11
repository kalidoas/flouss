import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import {
  getTodayDateStr,
  getCurrentTimeStr,
  toIsoDateTime,
} from '../../utils/formatters';
import { getCategoryIcon } from '../../utils/icons';
import { translations } from '../../i18n/translations';
import { getIncomeSourceName, getIncomeSubSourceName } from '../../utils/i18nHelpers';
import { ArrowUpRight, Repeat, Tag, Check, RotateCcw } from 'lucide-react';

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
  const [sourceId, setSourceId] = useState(defaultSourceId || '');
  const [subSourceId, setSubSourceId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number>(new Date().getDate());
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSourceId(defaultSourceId || '');
      setSubSourceId(null);
      setIsRecurring(false);
      setError('');
    }
  }, [isOpen, defaultSourceId]);

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
      maxHeight="max-h-[88dvh]"
    >
      {/* Flex column ensures confirm button stays visible */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {/* Amount */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
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
                className="w-full text-3xl font-bold py-3 px-4 rounded-2xl border border-white/10 bg-white/5 text-emerald-400 placeholder:text-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all pr-20 rtl:pr-4 rtl:pl-20 tabular-nums"
              />
              <span className="absolute right-4 rtl:right-auto rtl:left-4 text-xs font-bold text-zinc-300 bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl uppercase tracking-wider select-none">
                {translations[language].currency}
              </span>
            </div>

            {/* Quick amount adder chips */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[100, 500, 1000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="rounded-full px-3 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>

            {error && <p className="text-xs font-medium text-rose-400 mt-1.5">{error}</p>}
          </div>

          {/* ── DRILL-DOWN Source Picker ── */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
              {t.source}
            </label>

            {selectedSource ? (
              <div className="space-y-3">
                {/* Selected Source Pill */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.06] border border-purple-500/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: selectedSource.color }}
                    >
                      {React.createElement(getCategoryIcon(selectedSource.icon), { className: 'w-4 h-4' })}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {getIncomeSourceName(selectedSource, language)}
                      </p>
                      {subSourceId && (
                        <p className="text-[10px] text-purple-300 truncate">
                          {getIncomeSubSourceName(
                            availableSubSources.find((s) => s.id === subSourceId)!,
                            language
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSourceId(''); setSubSourceId(null); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-400 hover:text-white text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {language === 'ar' ? 'تغيير' : language === 'en' ? 'Change' : 'Modifier'}
                  </button>
                </div>

                {/* Sub-source chips (shown immediately below the pill) */}
                {availableSubSources.length > 0 && (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      {t.incomeSubSource}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSubSourceId(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                          subSourceId === null
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
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
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                              isSubSelected
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {subName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Source Grid (shown only when no source selected) */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1.5 rounded-2xl border border-white/10 bg-white/[0.02]">
                {incomeSources.map((source) => {
                  const IconComp = getCategoryIcon(source.icon);
                  const isSelected = sourceId === source.id;
                  const srcName = getIncomeSourceName(source, language);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleSelectSource(source.id)}
                      className={`relative p-2.5 rounded-2xl text-center border flex flex-col items-center justify-center gap-1.5 transition-all duration-200 text-xs font-semibold min-h-[72px] cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)] text-white'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 rtl:right-auto rtl:left-1.5 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: source.color }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium leading-tight line-clamp-2 px-0.5 break-words">
                        {srcName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date AND Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {t.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-mono py-2.5 px-3.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {t.time}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-mono py-2.5 px-3.5 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Recurring Income Toggle */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {tInc.repeatMonthly}
                  </p>
                  <p className="text-[11px] text-zinc-400">
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
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-white/10">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  {tInc.repeatDay}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full py-2 px-3 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                />
              </div>
            )}
          </div>

          {/* Note with suggestions */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              {t.note}
            </label>
            <input
              type="text"
              placeholder={t.notePlaceholderIncome}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs py-2.5 px-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />

            {recentNotes && recentNotes.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-400" /> {t.suggestions}
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {recentNotes.slice(0, 10).map((n, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNote(n)}
                      className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Submit (always visible) */}
        <div className="flex gap-2.5 pt-3 border-t border-white/[0.08] shrink-0">
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
