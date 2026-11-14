import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AmountKeypad } from '../common/AmountKeypad';
import { CategoryChipRow } from '../common/CategoryChipRow';
import { CustomDatePicker } from '../common/CustomDatePicker';
import {
  getTodayDateStr,
  getCurrentTimeStr,
  toIsoDateTime,
} from '../../utils/formatters';
import { translations } from '../../i18n/translations';
import { Check, Clock3 } from 'lucide-react';

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
  const { incomeSources, addTransaction, language } = useAppStore();
  const t = translations[language].common;

  const [amountStr, setAmountStr] = useState('');
  const [sourceId, setSourceId] = useState(defaultSourceId || '');
  const [subSourceId, setSubSourceId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDateStr());
  const [time, setTime] = useState(getCurrentTimeStr());
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay] = useState<number>(new Date().getDate());
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSourceId(defaultSourceId || '');
      setSubSourceId(null);
      setIsRecurring(false);
      setError('');
      setAmountStr('');
      setNote('');
      setDate(getTodayDateStr());
      setTime(getCurrentTimeStr());
    }
  }, [isOpen, defaultSourceId]);

  useEffect(() => {
    if (incomeSources.length && !sourceId) {
      setSourceId(incomeSources[0].id);
    }
  }, [incomeSources, sourceId]);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.transactionTitleIncome}
      subtitle={t.transactionSubtitleIncome}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* 1. Large Amount Readout with tactile In-App Keypad */}
        <AmountKeypad
          amount={amountStr}
          onChange={(val) => {
            setAmountStr(val);
            setError('');
          }}
          currency={translations[language].currency}
        />

        {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

        {/* 2. One-Row Income Source Chips */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
            {t.source}
          </span>
          <CategoryChipRow
            incomeSources={incomeSources}
            selectedId={sourceId}
            onSelect={handleSelectSource}
            language={language}
            type="income"
          />
        </div>

        {/* Optional Subsource Chips */}
        {availableSubSources.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {availableSubSources.map((sub) => {
              const isSelected = subSourceId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubSourceId(isSelected ? null : sub.id)}
                  className={`min-h-[36px] px-3 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-surface-raised border border-border-subtle text-muted hover:text-content'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Reused Date & Time Picker */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wider block">
            {t.date} & {t.time}
          </span>
          <CustomDatePicker
            value={date}
            onChange={(d) => setDate(d)}
            includeTime={true}
            timeValue={time}
            onTimeChange={(tm) => setTime(tm)}
          />
        </div>

        {/* 4. Optional Note Input */}
        <label className="block rounded-2xl border border-border-subtle bg-surface px-3.5 py-2">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-muted">
            <Clock3 className="h-3 w-3" />
            {t.note}
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholderIncome}
            className="min-h-9 w-full bg-transparent text-xs text-content placeholder:text-muted focus:outline-none"
          />
        </label>

        {/* 5. Sticky Full-Width Save Button */}
        <div className="sticky bottom-0 bg-surface/95 dark:bg-[#0A0A0C]/95 pt-2 border-t border-border-subtle dark:border-white/10 backdrop-blur-md">
          <Button
            type="submit"
            variant="income"
            fullWidth
            icon={<Check className="w-4 h-4 stroke-[2.5]" />}
            className="min-h-[48px] text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {t.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
