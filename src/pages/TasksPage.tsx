import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TaskItem, TaskCategory, TaskFrequency } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
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
  { label: string; labelAr: string; icon: string; color: string; bg: string; border: string }
> = {
  routine: {
    label: 'Routine',
    labelAr: 'روتين',
    icon: '⚡',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/50',
  },
  deen: {
    label: 'Deen & Spiritualité',
    labelAr: 'دين وصلاة',
    icon: '🕌',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/50',
  },
  sport: {
    label: 'Sport & Santé',
    labelAr: 'رياضة وصحة',
    icon: '🏋️',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800/50',
  },
  work: {
    label: 'Travail & Études',
    labelAr: 'عمل ودراسة',
    icon: '💻',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/50',
  },
  study: {
    label: 'Apprentissage',
    labelAr: 'تعلّم',
    icon: '📚',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800/50',
  },
  finance: {
    label: 'Finances',
    labelAr: 'مالية',
    icon: '💰',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800/50',
  },
  health: {
    label: 'Bien-être & Eau',
    labelAr: 'صحة وماء',
    icon: '💧',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800/50',
  },
  discipline: {
    label: 'Discipline & Sobriété',
    labelAr: 'انضباط ووعي',
    icon: '🛡️',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/50',
  },
  running: {
    label: 'Course / Jri',
    labelAr: 'جري',
    icon: '🏃',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800/50',
  },
  other: {
    label: 'Autre',
    labelAr: 'أخرى',
    icon: '📌',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
  },
};

const FREQUENCY_LABELS: Record<TaskFrequency, { fr: string; ar: string }> = {
  daily: { fr: 'Tous les jours', ar: 'يومياً' },
  weekdays: { fr: 'Jours ouvrés (Lun-Ven)', ar: 'أيام العمل (إثنين-جمعة)' },
  weekends: { fr: 'Week-end (Sam-Dim)', ar: 'نهاية الأسبوع' },
  custom_days: { fr: 'Jours choisis', ar: 'أيام محددة' },
};

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TasksPage: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, language } = useAppStore();
  const isAr = language === 'ar';

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
    for (let i = -3; i <= 3; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      const str = formatISODate(d);
      const dayName = d.toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR', { weekday: 'short' });
      days.push({
        dateStr: str,
        dayName,
        dayNum: d.getDate(),
        isToday: str === todayStr,
      });
    }
    return days;
  }, [selectedDate, todayStr, isAr]);

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
    const completed = filteredTasks.filter((t) => (t.completedDates || []).includes(selectedDate)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [filteredTasks, selectedDate]);

  // Streak calculations per task
  const calculateStreak = (task: TaskItem): number => {
    const completedSet = new Set(task.completedDates || []);
    let streak = 0;
    const checkDate = new Date();

    // If today is completed, start from today, else start from yesterday
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
      const completedInMonth = (task.completedDates || []).filter((d) => d.startsWith(currentMonthStr)).length;
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
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        notes: taskNotes.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isAr ? 'البرنامج والمتابعة اليومية' : 'Programme & Suivi Mensuel'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {isAr ? 'تتبع يومي' : '100% Hors-ligne'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'كوشي على مهامك وعاداتك اليومية وتابع إحصائيات التزامك طيلة الشهر'
              : 'Cochez vos routines et suivez vos progrès jour par jour avec statistiques.'}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          className="flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isAr ? 'إضافة مهمة / عادة' : 'Nouvelle Tâche'}</span>
        </Button>
      </div>

      {/* Hero Progress Card */}
      <div className="rounded-lg bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#787774] dark:text-[#9b9a97] text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#2383e2]" />
              <span>{isAr ? 'تقدم اليوم' : 'Progression du Jour'}</span>
              <span>•</span>
              <span>{selectedDate === todayStr ? (isAr ? 'اليوم' : "Aujourd'hui") : selectedDate}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-semibold text-[#37352f] dark:text-[#ecebed] tracking-tight tabular-nums">
                {dailyStats.percentage}%
              </span>
              <span className="text-xs text-[#787774] dark:text-[#9b9a97]">
                ({dailyStats.completed} / {dailyStats.total} {isAr ? 'مكتملة' : 'complétées'})
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full sm:w-80 h-1.5 bg-[#f1f0ee] dark:bg-[#282828] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2383e2] rounded-full transition-all duration-300"
                style={{ width: `${dailyStats.percentage}%` }}
              />
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-md px-3 py-2 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] text-[#787774] block">{isAr ? 'أطول سلسلة' : 'Série en cours'}</span>
                <span className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed]">{overallStreak} {isAr ? 'يوم' : 'jours'} 🔥</span>
              </div>
            </div>

            <div className="bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-md px-3 py-2 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#787774] block">{isAr ? 'نسبة الشهر' : 'Moyenne du mois'}</span>
                <span className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed]">{monthStats.rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Strip Navigator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
        <button
          onClick={() => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() - 1);
            setSelectedDate(formatISODate(d));
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Jour précédent"
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
                className={`flex flex-col items-center justify-center min-w-[52px] py-2 px-2 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold scale-105'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">
                  {item.dayName}
                </span>
                <span className="text-base font-black mt-0.5">{item.dayNum}</span>
                {item.isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected ? 'bg-amber-300' : 'bg-emerald-500'
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
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Jour suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {selectedDate !== todayStr && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors shrink-0"
          >
            {isAr ? 'اليوم' : "Aujourd'hui"}
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'daily'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>{isAr ? 'قائمة اليوم' : 'Tâches du jour'}</span>
        </button>

        <button
          onClick={() => setActiveTab('month')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'month'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isAr ? 'برنامج الشهر كامل' : 'Matrice Mensuelle'}</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'stats'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>{isAr ? 'إحصائيات الإنجاز' : 'Statistiques'}</span>
        </button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          {isAr ? 'الكل' : 'Tous'} ({tasks.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => (
          <button
            key={catKey}
            onClick={() => setSelectedCategory(catKey)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 ${
              selectedCategory === catKey
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <span>{conf.icon}</span>
            <span>{isAr ? conf.labelAr : conf.label}</span>
          </button>
        ))}
      </div>

      {/* VIEW 1: DAILY TASKS (CHECK OFF VIEW) */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                ✨
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {isAr ? 'لا توجد مهام محددة لهذا اليوم' : 'Aucune tâche pour ce jour'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'أضف مهامك وعاداتك اليومية لتبدأ في تتبعها بكل سهولة'
                    : 'Créez votre première routine ou tâche pour lancer votre streak.'}
                </p>
              </div>
              <Button onClick={handleOpenAdd} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>{isAr ? 'إضافة مهمة' : 'Ajouter une tâche'}</span>
              </Button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = (task.completedDates || []).includes(selectedDate);
              const streak = calculateStreak(task);
              const conf = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;

              return (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* The Check Button */}
                    <button
                      onClick={() => handleToggle(task.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90 shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      aria-label="Cocher tâche"
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
                          className={`font-bold text-sm tracking-tight truncate ${
                            isCompleted
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${conf.bg} ${conf.color} ${conf.border}`}
                        >
                          <span>{conf.icon}</span>
                          <span>{isAr ? conf.labelAr : conf.label}</span>
                        </span>

                        <span className="text-[11px] text-slate-400">
                          {isAr
                            ? FREQUENCY_LABELS[task.frequency]?.ar
                            : FREQUENCY_LABELS[task.frequency]?.fr}
                        </span>

                        {streak > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            🔥 {streak} {isAr ? 'يوم' : 'j'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: MONTHLY MATRIX / PROGRAM (TRACK ENTIRE MONTH) */}
      {activeTab === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'مصفوفة إنجاز الشهر' : 'Matrice de Suivi du Mois'}</span>
              <span className="text-xs font-medium text-slate-400">({currentMonthStr})</span>
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
              {monthDaysCount} {isAr ? 'يوم في الشهر' : 'jours'}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3 min-w-[140px]">{isAr ? 'المهمة' : 'Tâche / Routine'}</th>
                  {Array.from({ length: monthDaysCount }, (_, i) => i + 1).map((day) => {
                    const dayStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
                    const isToday = dayStr === todayStr;
                    return (
                      <th
                        key={day}
                        className={`text-center py-2 px-1 min-w-[28px] ${
                          isToday ? 'text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 rounded-t' : ''
                        }`}
                      >
                        {day}
                      </th>
                    );
                  })}
                  <th className="py-2 px-3 text-right">{isAr ? 'المجموع' : 'Score'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tasks.map((task) => {
                  const completedSet = new Set(task.completedDates || []);
                  let taskCountInMonth = 0;

                  return (
                    <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
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
                                  ? 'bg-emerald-600 text-white font-bold text-[10px]'
                                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-transparent'
                              }`}
                              title={`${task.title} - ${dayStr}`}
                            >
                              ✓
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>{isAr ? 'أعلى العادات التزاماً' : 'Taux de Réussite par Routine'}</span>
            </h3>

            <div className="space-y-3">
              {tasks.map((task) => {
                const completedInMonth = (task.completedDates || []).filter((d) =>
                  d.startsWith(currentMonthStr)
                ).length;
                const percentage = Math.round((completedInMonth / monthDaysCount) * 100);

                return (
                  <div key={task.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{task.title}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {completedInMonth} / {monthDaysCount} j ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              <span>{isAr ? 'نصائح للاستمرارية' : 'Conseils & Motivation'}</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">🔥 قاعدة الـ 21 يوماً :</span>
                أي عادة كتلتزم بها لـ 21 يوم متتالية كتولي جزء تلقائي من روتينك اليومي بلا ما تعيا!
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block mb-1">⚡ لا تقطع السلسلة (Never Break The Chain) :</span>
                حتى يلا كان نهارك عامر، دير ولو 5 دقائق فـ العادة باش السلسلة ديالك تبقى شاعلة.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingTask
            ? isAr
              ? 'تعديل المهمة / العادة'
              : 'Modifier la tâche'
            : isAr
            ? 'إضافة مهمة أو عادة جديدة'
            : 'Nouvelle tâche ou routine'
        }
        subtitle={
          isAr
            ? 'حدد عنوان المهمة ونوعها ومعدل تكرارها'
            : 'Planifiez vos routines quotidiennes ou hebdomadaires.'
        }
      >
        <form onSubmit={handleSaveTask} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'عنوان المهمة / العادة' : 'Titre de la tâche'} *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={isAr ? 'مثال: قراءة 20 دقيقة، صلاة، رياضة...' : 'Ex: Salat à l’heure, Gym, Lecture...'}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'الفئة' : 'Catégorie'}
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.icon} {isAr ? c.labelAr : c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'التكرار' : 'Fréquence'}
              </label>
              <select
                value={taskFrequency}
                onChange={(e) => setTaskFrequency(e.target.value as TaskFrequency)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {isAr ? v.ar : v.fr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملاحظات وتفاصيل (اختياري)' : 'Notes ou objectif (facultatif)'}
            </label>
            <textarea
              rows={2}
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              placeholder={isAr ? 'أي تفاصيل إضافية...' : 'Détails, consignes ou motivation...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? (isAr ? 'حفظ التعديلات' : 'Enregistrer') : (isAr ? 'إضافة المهمة' : 'Créer la tâche')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
