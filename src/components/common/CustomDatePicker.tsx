import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, Clock3, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getIntlLocale } from '../../utils/formatters';
import { playHapticFeedback } from '../../utils/haptics';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm'
  onChange: (value: string) => void;
  timeValue?: string; // 'HH:mm'
  onTimeChange?: (time: string) => void;
  includeTime?: boolean;
  label?: string;
  className?: string;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  timeValue,
  onTimeChange,
  includeTime = false,
  label,
  className = '',
}) => {
  const language = useAppStore((s) => s.language);
  const locale = getIntlLocale(language);

  // Extract date part ('YYYY-MM-DD')
  const datePart = value ? value.slice(0, 10) : getTodayStr();

  // Extract or resolve time part ('HH:mm')
  const resolvedTime =
    timeValue !== undefined
      ? timeValue
      : value && value.includes('T')
      ? value.slice(11, 16)
      : '12:00';

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  // Calendar navigation state
  const initialYear = Number(datePart.slice(0, 4)) || new Date().getFullYear();
  const initialMonth = Number(datePart.slice(5, 7)) - 1 || new Date().getMonth();
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
        setIsTimeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();
  const isToday = datePart === todayStr;
  const isYesterday = datePart === yesterdayStr;

  const setDate = (newDateStr: string) => {
    playHapticFeedback('selection');
    if (includeTime && !timeValue) {
      onChange(`${newDateStr}T${resolvedTime}`);
    } else {
      onChange(newDateStr);
    }
  };

  const setTime = (newTimeStr: string) => {
    playHapticFeedback('selection');
    if (onTimeChange) {
      onTimeChange(newTimeStr);
    } else if (includeTime) {
      onChange(`${datePart}T${newTimeStr}`);
    }
  };

  // Format date display label
  const formattedDateLabel = (() => {
    try {
      const [y, m, d] = datePart.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
      }).format(dt);
    } catch {
      return datePart;
    }
  })();

  // Month navigation
  const prevMonth = () => {
    playHapticFeedback('light');
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    playHapticFeedback('light');
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Localized Month-Year header
  const monthYearLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(viewYear, viewMonth, 1));

  // Build month grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon = 0
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  // Weekday abbreviations
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date(2024, 0, 1 + i); // Jan 1 2024 was Monday
    return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d);
  });

  const i18nLabels = {
    today: language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today',
    yesterday: language === 'ar' ? 'الأمس' : language === 'fr' ? 'Hier' : 'Yesterday',
    time: language === 'ar' ? 'الوقت' : language === 'fr' ? 'Heure' : 'Time',
    date: language === 'ar' ? 'التاريخ' : language === 'fr' ? 'Date' : 'Date',
  };

  const [hour, minute] = resolvedTime.split(':').map(Number);

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
          {label}
        </span>
      )}

      {/* Preset Chips + Calendar & Time Triggers Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Today Chip */}
        <button
          type="button"
          onClick={() => {
            setDate(todayStr);
            setIsCalendarOpen(false);
          }}
          className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isToday
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border-subtle text-muted hover:text-content hover:bg-surface-raised dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          {i18nLabels.today}
        </button>

        {/* Yesterday Chip */}
        <button
          type="button"
          onClick={() => {
            setDate(yesterdayStr);
            setIsCalendarOpen(false);
          }}
          className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            isYesterday
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border-subtle text-muted hover:text-content hover:bg-surface-raised dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          {i18nLabels.yesterday}
        </button>

        {/* Calendar Picker Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsTimeOpen(false);
            setIsCalendarOpen((prev) => !prev);
          }}
          aria-expanded={isCalendarOpen}
          className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            !isToday && !isYesterday
              ? 'bg-accent text-white shadow-xs'
              : 'bg-surface border border-border-subtle text-muted hover:text-content hover:bg-surface-raised dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="capitalize">{formattedDateLabel}</span>
        </button>

        {/* Optional Time Picker Trigger */}
        {(includeTime || onTimeChange) && (
          <button
            type="button"
            onClick={() => {
              setIsCalendarOpen(false);
              setIsTimeOpen((prev) => !prev);
            }}
            aria-expanded={isTimeOpen}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isTimeOpen
                ? 'bg-accent text-white shadow-xs'
                : 'bg-surface border border-border-subtle text-muted hover:text-content hover:bg-surface-raised dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{resolvedTime}</span>
          </button>
        )}
      </div>

      {/* Calendar Dropdown Popover */}
      {isCalendarOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-72 rounded-2xl bg-surface dark:bg-[#12131C] text-content dark:text-white border border-border-subtle dark:border-white/10 p-3 shadow-xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Month/Year Nav Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle dark:border-white/10">
            <button
              type="button"
              onClick={prevMonth}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-muted hover:text-content hover:bg-surface-raised dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="text-xs font-bold capitalize">{monthYearLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-muted hover:text-content hover:bg-surface-raised dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

          {/* Weekday column headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {weekdays.map((wd, idx) => (
              <span key={idx} className="text-[10px] font-bold text-muted uppercase">
                {wd}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const currentCellDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = currentCellDate === datePart;
              const isCurrentDay = currentCellDate === todayStr;

              return (
                <button
                  key={currentCellDate}
                  type="button"
                  onClick={() => {
                    setDate(currentCellDate);
                    setIsCalendarOpen(false);
                  }}
                  className={`flex aspect-square items-center justify-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-white font-bold shadow-xs'
                      : isCurrentDay
                      ? 'bg-surface-raised text-accent font-bold border border-accent/40'
                      : 'text-content dark:text-zinc-200 hover:bg-surface-raised dark:hover:bg-white/10'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Picker Dropdown Popover */}
      {isTimeOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-64 rounded-2xl bg-surface dark:bg-[#12131C] text-content dark:text-white border border-border-subtle dark:border-white/10 p-3 shadow-xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle dark:border-white/10">
            <span className="text-xs font-bold">{i18nLabels.time}</span>
            <button
              type="button"
              onClick={() => setIsTimeOpen(false)}
              className="text-xs text-accent font-semibold hover:underline"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Hours column */}
            <div>
              <span className="block text-[10px] font-semibold text-muted uppercase mb-1">HH</span>
              <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1">
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      const newTime = `${String(h).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
                      setTime(newTime);
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-mono tabular-nums transition-colors ${
                      h === hour
                        ? 'bg-accent text-white font-bold'
                        : 'hover:bg-surface-raised dark:hover:bg-white/10 text-content dark:text-zinc-200'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes column */}
            <div>
              <span className="block text-[10px] font-semibold text-muted uppercase mb-1">MM</span>
              <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1">
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      const newTime = `${String(hour || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      setTime(newTime);
                      setIsTimeOpen(false);
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-mono tabular-nums transition-colors ${
                      m === minute
                        ? 'bg-accent text-white font-bold'
                        : 'hover:bg-surface-raised dark:hover:bg-white/10 text-content dark:text-zinc-200'
                    }`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
