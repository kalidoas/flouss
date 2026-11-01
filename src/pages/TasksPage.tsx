import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { TaskItem, TaskCategory, TaskFrequency } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { translations } from '../i18n/translations';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Calendar,
  BarChart2,
  ListTodo,
  Trash2,
  Edit2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

const CATEGORY_CONFIG: Record<
  TaskCategory,
  { fr: string; ar: string; en: string; icon: string; color: string; bg: string; border: string }
> = {
  routine: {
    fr: 'Routine',
    ar: 'روتين',
    en: 'Routine',
    icon: '⚡',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  deen: {
    fr: 'Deen & Spiritualité',
    ar: 'دين وصلاة',
    en: 'Faith & Prayer',
    icon: '🕌',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  sport: {
    fr: 'Sport & Santé',
    ar: 'رياضة وصحة',
    en: 'Sport & Fitness',
    icon: '🏋️',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  work: {
    fr: 'Travail & Études',
    ar: 'عمل ودراسة',
    en: 'Work & Career',
    icon: '💻',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  study: {
    fr: 'Apprentissage',
    ar: 'تعلّم',
    en: 'Learning & Reading',
    icon: '📚',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  finance: {
    fr: 'Finances',
    ar: 'مالية',
    en: 'Personal Finance',
    icon: '💰',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  health: {
    fr: 'Bien-être & Eau',
    ar: 'صحة وماء',
    en: 'Health & Hydration',
    icon: '💧',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  discipline: {
    fr: 'Discipline & Sobriété',
    ar: 'انضباط ووعي',
    en: 'Focus & Discipline',
    icon: '🛡️',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  running: {
    fr: 'Course / Jri',
    ar: 'جري',
    en: 'Running',
    icon: '🏃',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  other: {
    fr: 'Autre',
    ar: 'أخرى',
    en: 'Other',
    icon: '📌',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
  },
};

const FREQUENCY_LABELS: Record<TaskFrequency, { fr: string; ar: string; en: string }> = {
  daily: { fr: 'Tous les jours', ar: 'يومياً', en: 'Every day' },
  weekdays: { fr: 'Jours ouvrés (Lun-Ven)', ar: 'أيام العمل (إثنين-جمعة)', en: 'Weekdays (Mon-Fri)' },
  weekends: { fr: 'Week-end (Sam-Dim)', ar: 'نهاية الأسبوع', en: 'Weekends (Sat-Sun)' },
  custom_days: { fr: 'Jours choisis', ar: 'أيام محددة', en: 'Selected days' },
};

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TasksPage: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, language } = useAppStore();
  const tTask = translations[language].tasks;

  const todayStr = useMemo(() => formatISODate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'daily' | 'month' | 'stats'>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('routine');
  const [taskFrequency, setTaskFrequency] = useState<TaskFrequency>('daily');
  const [taskNotes, setTaskNotes] = useState('');

  // Generate 7 days around selected date for quick navigation strip
  const dateStrip = useMemo(() => {
    const curr = new Date(selectedDate);
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';
    for (let i = -3; i <= 3; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      const str = formatISODate(d);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
      days.push({
        dateStr: str,
        dayName,
        dayNum: d.getDate(),
        isToday: str === todayStr,
      });
    }
    return days;
  }, [selectedDate, todayStr, language]);

  // Tasks applicable for selected day
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      if (task.isArchived) return false;
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

      // Filter by frequency if needed
      const dayOfWeek = new Date(selectedDate).getDay(); // 0 is Sunday, 6 is Saturday
      if (task.frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return false;
      }
      if (task.frequency === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) {
        return false;
      }
      return true;
    });
  }, [tasks, selectedCategory, selectedDate]);

  // Daily statistics for selected day
  const dailyStats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) =>
      (t.completedDates || []).includes(selectedDate)
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [filteredTasks, selectedDate]);

  // Streak calculations per task
  const calculateStreak = (task: TaskItem): number => {
    const completedSet = new Set(task.completedDates || []);
    let streak = 0;
    const checkDate = new Date();

    const todayISO = formatISODate(checkDate);
    if (!completedSet.has(todayISO)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const iso = formatISODate(checkDate);
      if (completedSet.has(iso)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Overall active streak across any task
  const overallStreak = useMemo(() => {
    let max = 0;
    (tasks || []).forEach((t) => {
      const s = calculateStreak(t);
      if (s > max) max = s;
    });
    return max;
  }, [tasks]);

  // Monthly stats for current month
  const currentMonthStr = selectedDate.substring(0, 7); // YYYY-MM
  const monthDaysCount = useMemo(() => {
    const [y, m] = currentMonthStr.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }, [currentMonthStr]);

  const monthStats = useMemo(() => {
    let totalPossible = 0;
    let totalCompleted = 0;

    (tasks || []).forEach((task) => {
      if (task.isArchived) return;
      const completedInMonth = (task.completedDates || []).filter((d) =>
        d.startsWith(currentMonthStr)
      ).length;
      totalCompleted += completedInMonth;
      totalPossible += monthDaysCount;
    });

    const rate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    return { totalCompleted, totalPossible, rate };
  }, [tasks, currentMonthStr, monthDaysCount]);

  const handleToggle = (taskId: string) => {
    toggleTaskCompletion(taskId, selectedDate);
    const task = tasks.find((t) => t.id === taskId);
    const wasCompleted = (task?.completedDates || []).includes(selectedDate);

    // If completing the task and reaching 100% for today, burst confetti
    if (!wasCompleted && dailyStats.completed + 1 === dailyStats.total && dailyStats.total > 0) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskCategory('routine');
    setTaskFrequency('daily');
    setTaskNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskFrequency(task.frequency);
    setTaskNotes(task.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        notes: taskNotes.trim() || undefined,
      });
    } else {
      addTask({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        notes: taskNotes.trim() || undefined,
        completedDates: [],
        createdAt: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-page pb-20 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {tTask.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {tTask.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {tTask.subtitle}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          <span>{tTask.newTask}</span>
        </Button>
      </div>

      {/* Hero Progress Card: Apple HIG Surface */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 sm:p-7 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_12px_40px_0_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{tTask.todayProgress}</span>
              <span>•</span>
              <span className="font-mono tabular-nums">
                {selectedDate === todayStr ? (language === 'ar' ? 'اليوم' : language === 'en' ? 'Today' : "Aujourd'hui") : selectedDate}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">
                {dailyStats.percentage}%
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                ({dailyStats.completed} / {dailyStats.total} {tTask.completedDays})
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full sm:w-80 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${dailyStats.percentage}%` }}
              />
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
                  {tTask.streak}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                  {overallStreak} j 🔥
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
                  {tTask.monthAverage}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
                  {monthStats.rate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Date Strip Navigator: Apple Segmented Pill Container */}
      <div className="bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl rounded-2xl p-2.5 sm:p-3 border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(formatISODate(d));
          }}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {dateStrip.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[54px] py-2 px-2.5 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold scale-105'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">
                  {item.dayName}
                </span>
                <span className="text-base font-bold mt-0.5 tabular-nums">{item.dayNum}</span>
                {item.isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected ? 'bg-amber-300' : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + 1);
            setSelectedDate(formatISODate(d));
          }}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {selectedDate !== todayStr && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors shrink-0"
          >
            {language === 'ar' ? 'اليوم' : language === 'en' ? 'Today' : "Aujourd'hui"}
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-black/[0.04] dark:border-white/[0.05] pb-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'daily'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>{tTask.todayList}</span>
        </button>

        <button
          onClick={() => setActiveTab('month')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'month'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{tTask.monthlyMatrix}</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'stats'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>{tTask.statsTab}</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
          }`}
        >
          {tTask.all} (<span className="tabular-nums">{tasks.length}</span>)
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => (
          <button
            key={catKey}
            onClick={() => setSelectedCategory(catKey)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
              selectedCategory === catKey
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <span>{conf.icon}</span>
            <span>{conf[language] || conf.fr}</span>
          </button>
        ))}
      </div>

      {/* VIEW 1: DAILY TASKS (CHECK OFF VIEW) */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<ListTodo className="w-5 h-5" />}
              title={tTask.noTasksToday}
              description={tTask.subtitle}
              action={
                <Button onClick={handleOpenAdd} variant="primary" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>{tTask.addTask}</span>
                </Button>
              }
            />
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = (task.completedDates || []).includes(selectedDate);
              const streak = calculateStreak(task);
              const conf = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;

              return (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -1 }}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20 shadow-xs'
                      : 'bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border-black/[0.06] dark:border-white/[0.08] shadow-xs hover:border-black/[0.12] dark:hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* The Check Button */}
                    <button
                      onClick={() => handleToggle(task.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90 shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      aria-label="Toggle task"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                      ) : (
                        <Circle className="w-6 h-6 stroke-[1.8]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm tracking-tight truncate ${
                            isCompleted
                              ? 'line-through text-zinc-400 dark:text-zinc-500'
                              : 'text-zinc-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}
                        >
                          <span>{conf.icon}</span>
                          <span>{conf[language] || conf.fr}</span>
                        </span>

                        <span className="text-[11px] text-zinc-400">
                          {FREQUENCY_LABELS[task.frequency]?.[language] ||
                            FREQUENCY_LABELS[task.frequency]?.fr}
                        </span>

                        {streak > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full tabular-nums">
                            🔥 {streak} j
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title={tTask.editTask}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: MONTHLY MATRIX / PROGRAM (TRACK ENTIRE MONTH) */}
      {activeTab === 'month' && (
        <div className="bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl rounded-3xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>{tTask.matrixTitle}</span>
              <span className="text-xs font-medium text-zinc-400">({currentMonthStr})</span>
            </h3>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full tabular-nums">
              {monthDaysCount} {tTask.daysInMonth}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/[0.05] dark:border-white/[0.06] text-zinc-400 font-semibold">
                  <th className="py-2.5 px-3 min-w-[140px]">{tTask.taskRoutine}</th>
                  {Array.from({ length: monthDaysCount }, (_, i) => i + 1).map((day) => {
                    const dayStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                    const isToday = dayStr === todayStr;
                    return (
                      <th
                        key={day}
                        className={`text-center py-2 px-1 min-w-[28px] tabular-nums ${
                          isToday
                            ? 'text-blue-600 font-bold bg-blue-500/10 rounded-t'
                            : ''
                        }`}
                      >
                        {day}
                      </th>
                    );
                  })}
                  <th className="py-2 px-3 text-right">{tTask.score}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {tasks.map((task) => {
                  const completedSet = new Set(task.completedDates || []);
                  let taskCountInMonth = 0;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                        {task.title}
                      </td>

                      {Array.from({ length: monthDaysCount }, (_, i) => i + 1).map((day) => {
                        const dayStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                        const isDone = completedSet.has(dayStr);
                        if (isDone) taskCountInMonth++;

                        return (
                          <td key={day} className="text-center py-2 px-0.5">
                            <button
                              onClick={() => toggleTaskCompletion(task.id, dayStr)}
                              className={`w-5 h-5 rounded-md mx-auto flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-blue-600 text-white font-bold text-[10px]'
                                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-transparent'
                              }`}
                              title={`${task.title} - ${dayStr}`}
                            >
                              ✓
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {taskCountInMonth}/{monthDaysCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: STATS & EVALUATIONS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl rounded-3xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{tTask.monthAverage}</span>
            </h3>

            <div className="space-y-3">
              {tasks.map((task) => {
                const completedInMonth = (task.completedDates || []).filter((d) =>
                  d.startsWith(currentMonthStr)
                ).length;
                const percentage = Math.round((completedInMonth / monthDaysCount) * 100);

                return (
                  <div key={task.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-700 dark:text-zinc-300">{task.title}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {completedInMonth} / {monthDaysCount} j ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl rounded-3xl p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>{tTask.consistencyTips}</span>
            </h3>
            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">🔥 21 Days Habit Rule:</span>
                Consistency creates automaticity. Sticking to a routine for 21 days solidifies it into effortless second nature.
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block mb-1">⚡ Never Break The Chain:</span>
                Even on tough or busy days, complete 5 minutes of your routine to protect your momentum streak!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? tTask.editTask : tTask.newTask}
        subtitle={tTask.subtitle}
      >
        <form onSubmit={handleSaveTask} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {tTask.taskTitleLabel} *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={tTask.taskTitlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {tTask.categoryLabel}
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.icon} {c[language] || c.fr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {tTask.frequencyLabel}
              </label>
              <select
                value={taskFrequency}
                onChange={(e) => setTaskFrequency(e.target.value as TaskFrequency)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v[language] || v.fr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {tTask.notesLabel}
            </label>
            <textarea
              rows={2}
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              placeholder={tTask.notesPlaceholder}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tTask.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? tTask.save : tTask.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
