import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { TaskItem, TaskCategory, TaskFrequency, PrayerKey, StudyModuleItem, GymWorkoutLog, ProgramTrack } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { translations } from '../i18n/translations';
import confetti from 'canvas-confetti';
import { createGoogleCalendarEvent } from '../services/googleCalendar';
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
  Moon,
  Sunrise,
  Sun,
  Sunset,
  MoonStar,
  BookOpen,
  Dumbbell,
  Trophy,
  Check,
  X,
  LayoutGrid,
  Target,
  Clock,
  Bell,
  Loader2,
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
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    language,
    salatLogs,
    toggleSalatPrayer,
    studyModules,
    addStudyModule,
    toggleStudyModule,
    deleteStudyModule,
    gymLogs,
    addGymLog,
    deleteGymLog,
    programTracks,
    addProgramTrack,
    deleteProgramTrack,
    addProgramSubTask,
    toggleProgramSubTask,
    deleteProgramSubTask,
    showToast,
  } = useAppStore();
  const tTask = translations[language].tasks;
  const tCommon = translations[language].common;

  const todayStr = useMemo(() => formatISODate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'daily' | 'month' | 'stats'>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Drill-down Modal State for Program Tracks
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackIcon, setNewTrackIcon] = useState('🎯');
  const [newTrackColor, setNewTrackColor] = useState('#3b82f6');
  const [newSubTaskInput, setNewSubTaskInput] = useState('');

  // Routine Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('routine');
  const [taskFrequency, setTaskFrequency] = useState<TaskFrequency>('daily');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskScheduledDate, setTaskScheduledDate] = useState<string>(todayStr);
  const [taskScheduledTime, setTaskScheduledTime] = useState<string>('10:00');
  const [syncToCalendar, setSyncToCalendar] = useState<boolean>(false);
  const [isCalendarSaving, setIsCalendarSaving] = useState<boolean>(false);

  // ── Study Module Input State ──
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleSubject, setModuleSubject] = useState('');

  // ── Gym Workout Input State ──
  const [gymMuscles, setGymMuscles] = useState('');
  const [gymExercises, setGymExercises] = useState('');
  const [gymTomorrowPlan, setGymTomorrowPlan] = useState('');

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

  // ── Salat Prayers for Selected Date ──
  const selectedDatePrayers = useMemo(() => {
    return (salatLogs ?? {})[selectedDate] ?? [];
  }, [salatLogs, selectedDate]);

  const allPrayersCompletedToday = selectedDatePrayers.length === 5;

  // ── Gamification / Level System Calculation ──
  // Salat prayer = 50 XP (highest points)
  // Subtasks (Coding, English, Custom) = 10 XP dynamic points
  // Gym workout = 40 XP
  // Study module = 30 XP
  // Routine task completion = 15 XP
  const gamificationStats = useMemo(() => {
    let totalSalatCount = 0;
    Object.values(salatLogs ?? {}).forEach((prayers) => {
      totalSalatCount += (prayers || []).length;
    });

    let totalSubTasksXP = 0;
    (programTracks ?? []).forEach((track) => {
      (track.subtasks ?? []).forEach((sub) => {
        const count = (sub.completedDates ?? []).length;
        totalSubTasksXP += count * (sub.points || 10);
      });
    });

    const totalGymCount = (gymLogs ?? []).length;
    const totalStudyCount = (studyModules ?? []).filter((m) => m.completed).length;

    let totalTasksCount = 0;
    (tasks ?? []).forEach((t) => {
      totalTasksCount += (t.completedDates || []).length;
    });

    const totalXP =
      totalSalatCount * 50 +
      totalSubTasksXP +
      totalGymCount * 40 +
      totalStudyCount * 30 +
      totalTasksCount * 15;

    const level = Math.floor(totalXP / 200) + 1;
    const xpInLevel = totalXP % 200;
    const progressPercent = Math.min(100, Math.round((xpInLevel / 200) * 100));

    return {
      totalXP,
      level,
      xpInLevel,
      xpToNextLevel: 200 - xpInLevel,
      progressPercent,
      totalSalatCount,
      totalSubTasksXP,
      totalGymCount,
      totalStudyCount,
    };
  }, [salatLogs, programTracks, gymLogs, studyModules, tasks]);

  const activeTrack = useMemo(() => {
    return (programTracks || []).find((t) => t.id === selectedTrackId) || null;
  }, [programTracks, selectedTrackId]);

  const handleToggleSalat = (prayer: PrayerKey) => {
    toggleSalatPrayer(selectedDate, prayer);
    const wasCompleted = selectedDatePrayers.includes(prayer);
    if (!wasCompleted && selectedDatePrayers.length === 4) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    addStudyModule(moduleTitle.trim(), moduleSubject.trim() || undefined);
    setModuleTitle('');
    setModuleSubject('');
  };

  const handleAddGym = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymMuscles.trim()) return;
    addGymLog({
      date: selectedDate,
      muscleGroups: gymMuscles.trim(),
      exercises: gymExercises.trim() || undefined,
      tomorrowPlan: gymTomorrowPlan.trim() || undefined,
    });
    setGymMuscles('');
    setGymExercises('');
    setGymTomorrowPlan('');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

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
    setTaskScheduledDate(selectedDate || todayStr);
    setTaskScheduledTime('10:00');
    setSyncToCalendar(false);
    setIsCalendarSaving(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskFrequency(task.frequency);
    setTaskNotes(task.notes || '');
    setTaskScheduledDate(task.scheduledDate || selectedDate || todayStr);
    setTaskScheduledTime(task.scheduledTime || '10:00');
    setSyncToCalendar(Boolean(task.addToGoogleCalendar || task.googleCalendarEventId));
    setIsCalendarSaving(false);
    setIsModalOpen(true);
  };

  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskInput.trim() || !selectedTrackId) return;
    addProgramSubTask(selectedTrackId, newSubTaskInput.trim(), 10);
    setNewSubTaskInput('');
  };

  const handleCreateProgramTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    addProgramTrack(newTrackTitle.trim(), newTrackIcon, newTrackColor);
    setNewTrackTitle('');
    setIsAddTrackModalOpen(false);
  };

  const handleToggleSubTask = (trackId: string, subId: string) => {
    toggleProgramSubTask(trackId, subId, selectedDate);
    const track = (programTracks || []).find((t) => t.id === trackId);
    const sub = (track?.subtasks || []).find((s) => s.id === subId);
    const wasCompleted = (sub?.completedDates || []).includes(selectedDate);
    if (!wasCompleted) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let calendarEventId: string | undefined = editingTask?.googleCalendarEventId;

    if (syncToCalendar) {
      setIsCalendarSaving(true);
      try {
        const calRes = await createGoogleCalendarEvent({
          title: taskTitle.trim(),
          description: taskNotes.trim() || undefined,
          scheduledDate: taskScheduledDate || selectedDate || todayStr,
          scheduledTime: taskScheduledTime || '10:00',
          durationMinutes: 30,
        });

        if (calRes.success && calRes.eventId) {
          calendarEventId = calRes.eventId;
          showToast({
            message: tTask.googleCalendarSynced,
          });
        } else if (calRes.error) {
          showToast({
            message: `${tTask.googleCalendarFailed}: ${calRes.error}`,
          });
        }
      } catch (err: any) {
        showToast({
          message: `${tTask.googleCalendarFailed}: ${err?.message || ''}`,
        });
      } finally {
        setIsCalendarSaving(false);
      }
    }

    const scheduledDateTime = taskScheduledDate && taskScheduledTime
      ? `${taskScheduledDate}T${taskScheduledTime}`
      : undefined;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        notes: taskNotes.trim() || undefined,
        scheduledDate: taskScheduledDate,
        scheduledTime: taskScheduledTime,
        scheduledDateTime,
        addToGoogleCalendar: syncToCalendar,
        googleCalendarEventId: calendarEventId,
      });
    } else {
      addTask({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        notes: taskNotes.trim() || undefined,
        scheduledDate: taskScheduledDate,
        scheduledTime: taskScheduledTime,
        scheduledDateTime,
        addToGoogleCalendar: syncToCalendar,
        googleCalendarEventId: calendarEventId,
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

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAddTrackModalOpen(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            <span>{tTask.addProgram || 'Nouveau programme'}</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            variant="secondary"
            icon={<ListTodo className="w-4 h-4 stroke-[2]" />}
          >
            <span>{tTask.newTask}</span>
          </Button>
        </div>
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
          <div className="flex flex-wrap items-center gap-3">
            {/* Gamification Level Badge */}
            <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-emerald-500/15 border border-amber-500/25 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">
                    {tTask.levelTitle || 'Niveau & Points XP'}
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Lvl {gamificationStats.level}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">
                    {gamificationStats.totalXP} {tTask.xpPoints}
                  </span>
                  <span className="text-[10px] text-zinc-400 tabular-nums">
                    ({gamificationStats.progressPercent}% {tTask.xpNextLevel})
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
                  {tTask.streak}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
                  {overallStreak} {tTask.streakDays || 'j 🔥'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">
                  {tTask.monthAverage}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white tabular-nums">
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
          title={language === 'ar' ? 'اليوم السابق' : language === 'en' ? 'Previous day' : 'Jour précédent'}
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
          title={language === 'ar' ? 'اليوم التالي' : language === 'en' ? 'Next day' : 'Jour suivant'}
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
        <div className="space-y-8">
          {/* 1. BENTO GRID OF PROGRAM TRACKS */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-blue-600" />
                  <span>{tTask.title}</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {language === 'ar'
                    ? 'اضغط على أي بطاقة لفتح التفاصيل وإضافة المهام الفرعية مباشرة'
                    : language === 'en'
                    ? 'Click any card to open detail view & add sub-tasks inline'
                    : 'Cliquez sur une carte pour ouvrir le suivi détaillé et ajouter des sous-tâches'}
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {(programTracks ?? []).length} {language === 'ar' ? 'برامج' : 'programmes'}
              </span>
            </div>

            {/* Apple Bento Grid Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(programTracks ?? []).map((track) => {
                const isSalat = track.type === 'salat';
                const isGym = track.type === 'gym';
                const isStudy = track.type === 'study';

                // Salat calculation
                const salatDone = selectedDatePrayers.length;
                const salatPercent = Math.round((salatDone / 5) * 100);

                // Subtasks calculation
                const subtasks = track.subtasks ?? [];
                const subtasksDone = subtasks.filter((s) => (s.completedDates ?? []).includes(selectedDate)).length;
                const subtasksPercent = subtasks.length > 0 ? Math.round((subtasksDone / subtasks.length) * 100) : 0;

                // Gym calculation
                const gymToday = (gymLogs ?? []).find((g) => g.date === selectedDate);

                // Study calculation
                const studyDone = (studyModules ?? []).filter((m) => m.completed).length;
                const studyTotal = (studyModules ?? []).length;
                const studyPercent = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;

                return (
                  <motion.div
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    whileHover={{ y: -3, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative cursor-pointer rounded-3xl p-5 bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_0_rgba(0,0,0,0.3)] hover:border-black/[0.14] dark:hover:border-white/[0.18] transition-all flex flex-col justify-between min-h-[175px]"
                  >
                    {/* Top Row: Prominent Frosted Icon & XP Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-transform group-hover:scale-105 shrink-0"
                        style={{
                          backgroundColor: `${track.color || '#3b82f6'}18`,
                          border: `1px solid ${track.color || '#3b82f6'}30`,
                        }}
                      >
                        {track.icon || '🎯'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isSalat ? (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            +50 XP (Max)
                          </span>
                        ) : isGym ? (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                            +40 XP
                          </span>
                        ) : isStudy ? (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                            +30 XP
                          </span>
                        ) : (
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                            +10 XP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Quick Preview */}
                    <div className="my-3">
                      <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {track.title}
                      </h3>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                        {isSalat
                          ? (language === 'ar' ? '5 صلوات يومية (الحد الأقصى للنقاط)' : '5 prières quotidiennes (Score max)')
                          : isGym
                          ? (gymToday ? `✓ ${gymToday.muscleGroups}` : (tTask.gymSubtitle || 'Journal des séances'))
                          : isStudy
                          ? (`${studyDone} / ${studyTotal} ${tTask.completedModules || 'modules'}`)
                          : subtasks.length > 0
                          ? subtasks.map((s) => s.title).join(' • ')
                          : (tTask.noSubtasks || 'Cliquez pour ajouter des sous-tâches')}
                      </p>
                    </div>

                    {/* Bottom: Fluid Progress Bar & Open Trigger */}
                    <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-600 dark:text-zinc-400 tabular-nums">
                          {isSalat ? (
                            `${salatDone} / 5`
                          ) : isGym ? (
                            gymToday ? (language === 'ar' ? 'تمت الحصة اليوم' : 'Séance validée') : (language === 'ar' ? 'لم تسجل بعد' : 'En attente')
                          ) : isStudy ? (
                            `${studyDone} / ${studyTotal}`
                          ) : (
                            `${subtasksDone} / ${subtasks.length}`
                          )}
                        </span>

                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          <span>{tTask.openProgram || 'Ouvrir'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${
                              isSalat
                                ? salatPercent
                                : isGym
                                ? gymToday ? 100 : 0
                                : isStudy
                                ? studyPercent
                                : subtasksPercent
                            }%`,
                            backgroundColor: track.color || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add New Program Track Card */}
              <motion.div
                onClick={() => setIsAddTrackModalOpen(true)}
                whileHover={{ y: -3, transition: { type: 'spring', stiffness: 350, damping: 25 } }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer rounded-3xl p-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all flex flex-col items-center justify-center text-center min-h-[175px] group bg-zinc-50/50 dark:bg-zinc-900/30"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 flex items-center justify-center mb-3 transition-colors">
                  <Plus className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tTask.addProgram || 'Nouveau programme'}
                </span>
                <span className="text-[11px] text-zinc-400 mt-0.5">
                  {language === 'ar' ? 'إضافة مسار أو مهارة جديدة' : 'Créer une compétence ou habitude'}
                </span>
              </motion.div>
            </div>
          </div>

          {/* 4. DAILY ROUTINES / CUSTOM TASKS LIST */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {tTask.todayList} ({filteredTasks.length})
              </h3>
            </div>

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

                          {task.scheduledTime && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full tabular-nums">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{task.scheduledTime}</span>
                              {task.addToGoogleCalendar && <Bell className="w-2.5 h-2.5 text-blue-500 animate-pulse" />}
                            </span>
                          )}

                          <span className="text-[10px] font-bold text-zinc-400 tabular-nums">
                            +15 XP
                          </span>
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
                        title={tCommon.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
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
                <span className="font-bold block mb-1">🔥 {tTask.consistencyTips}</span>
                {tTask.rule21Days}
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold block mb-1">⚡ {tTask.streak}</span>
                {tTask.ruleNeverBreak}
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

          {/* Date & Time Picker */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{tTask.dateTimeLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                  {tTask.datePickerLabel}
                </label>
                <input
                  type="date"
                  value={taskScheduledDate}
                  onChange={(e) => setTaskScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                  {tTask.timePickerLabel}
                </label>
                <input
                  type="time"
                  value={taskScheduledTime}
                  onChange={(e) => setTaskScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Google Calendar Native Phone Alarm Toggle */}
            <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <label htmlFor="calendar-alarm-toggle" className="text-xs font-bold text-zinc-900 dark:text-white cursor-pointer select-none">
                    {tTask.googleCalendarToggle}
                  </label>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    {tTask.googleCalendarDesc}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  id="calendar-alarm-toggle"
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600 shadow-xs"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tTask.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={isCalendarSaving}>
              {isCalendarSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Google Calendar...</span>
                </span>
              ) : editingTask ? (
                tTask.save
              ) : (
                tTask.create
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── PROGRAM TRACK DETAIL DRILL-DOWN MODAL (APPLE FLOATING MODAL) ── */}
      <Modal
        isOpen={Boolean(selectedTrackId && activeTrack)}
        onClose={() => setSelectedTrackId(null)}
        title={activeTrack?.title}
        subtitle={
          selectedDate === todayStr
            ? (language === 'ar' ? 'اليوم' : language === 'en' ? 'Today' : "Aujourd'hui")
            : selectedDate
        }
        maxWidth="lg"
      >
        {activeTrack && (
          <div className="space-y-4 pt-1">
            {/* 1. SALAT TRACK DETAIL */}
            {activeTrack.type === 'salat' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      🕌
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        {tTask.salatSection || 'Prières (Salat)'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tTask.salatMaxReward || 'Score maximal : +50 XP / prière'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block tabular-nums">
                      {selectedDatePrayers.length} / 5
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">
                      +{selectedDatePrayers.length * 50} XP
                    </span>
                  </div>
                </div>

                {/* 5 Daily Prayers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {[
                    { key: 'fajr' as PrayerKey, icon: Sunrise, label: tTask.fajr },
                    { key: 'dhuhr' as PrayerKey, icon: Sun, label: tTask.dhuhr },
                    { key: 'asr' as PrayerKey, icon: Sun, label: tTask.asr },
                    { key: 'maghrib' as PrayerKey, icon: Sunset, label: tTask.maghrib },
                    { key: 'isha' as PrayerKey, icon: MoonStar, label: tTask.isha },
                  ].map((prayer) => {
                    const isCompleted = selectedDatePrayers.includes(prayer.key);
                    const Icon = prayer.icon;

                    return (
                      <button
                        key={prayer.key}
                        type="button"
                        onClick={() => handleToggleSalat(prayer.key)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold tracking-tight">{prayer.label}</span>
                        <span
                          className={`text-[10px] mt-0.5 font-bold tabular-nums ${
                            isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                          }`}
                        >
                          +50 XP
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Celebratory Banner if 5/5 Completed */}
                {allPrayersCompletedToday && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-200">
                        {tTask.salatCompletedAll}
                      </span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-lg shadow-2xs">
                      +250 XP
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* 2. SUBTASKS TRACKS DETAIL (CODING, ENGLISH, CUSTOM) */}
            {(activeTrack.type === 'coding' || activeTrack.type === 'english' || activeTrack.type === 'custom') && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{tTask.dynamicPointsNotice?.replace('{points}', '10') || '+10 XP par tâche réalisée'}</span>
                  </div>
                  <span className="font-bold text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {(activeTrack.subtasks || []).filter((s) => (s.completedDates || []).includes(selectedDate)).length} / {(activeTrack.subtasks || []).length}
                  </span>
                </div>

                {/* Inline Add Subtask Input Form */}
                <form onSubmit={handleAddSubTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubTaskInput}
                    onChange={(e) => setNewSubTaskInput(e.target.value)}
                    placeholder={
                      activeTrack.type === 'coding'
                        ? (language === 'ar' ? 'مثال: Vue.js, Node.js, Python...' : 'ex : Vue.js, Node.js, Docker...')
                        : activeTrack.type === 'english'
                        ? (language === 'ar' ? 'مثال: Listening, Grammar, Vocabulary...' : 'ex : Listening, Grammar, Speaking...')
                        : (tTask.subTaskPlaceholder || 'ex : Nouvelle sous-tâche...')
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    <span>{tTask.addSubTask || 'Ajouter'}</span>
                  </Button>
                </form>

                {/* Subtasks List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(activeTrack.subtasks || []).length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-4 text-center">
                      {tTask.noSubtasks || 'Aucune sous-tâche. Ajoutez-en une ci-dessus !'}
                    </p>
                  ) : (
                    (activeTrack.subtasks || []).map((sub) => {
                      const isDone = (sub.completedDates || []).includes(selectedDate);
                      return (
                        <div
                          key={sub.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            isDone
                              ? 'bg-blue-500/10 border-blue-500/25 text-zinc-400 dark:text-zinc-500'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSubTask(activeTrack.id, sub.id)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-transparent hover:text-zinc-400'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-zinc-400' : ''}`}>
                              {sub.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                              +{sub.points || 10} XP
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteProgramSubTask(activeTrack.id, sub.id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                              title={tCommon.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {activeTrack.type === 'custom' && (
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        deleteProgramTrack(activeTrack.id);
                        setSelectedTrackId(null);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1.5 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'حذف هذا البرنامج' : 'Supprimer ce programme'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. GYM TRACK DETAIL */}
            {activeTrack.type === 'gym' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold">
                    <Dumbbell className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>+40 XP / {language === 'ar' ? 'حصة تدريبية' : 'séance validée'}</span>
                  </div>
                  <span className="font-bold text-zinc-500 tabular-nums">
                    {(gymLogs ?? []).length} {tTask.workoutHistory || 'séances'}
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleAddGym} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                        {tTask.muscleGroups} *
                      </label>
                      <input
                        type="text"
                        required
                        value={gymMuscles}
                        onChange={(e) => setGymMuscles(e.target.value)}
                        placeholder={tTask.musclePlaceholder}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                        {tTask.tomorrowPlan}
                      </label>
                      <input
                        type="text"
                        value={gymTomorrowPlan}
                        onChange={(e) => setGymTomorrowPlan(e.target.value)}
                        placeholder={tTask.tomorrowPlaceholder}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                      {tTask.exercisesLabel}
                    </label>
                    <input
                      type="text"
                      value={gymExercises}
                      onChange={(e) => setGymExercises(e.target.value)}
                      placeholder={tTask.exercisesPlaceholder}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button type="submit" variant="primary" size="sm" icon={<Dumbbell className="w-3.5 h-3.5" />}>
                      <span>{tTask.addWorkoutBtn || 'Enregistrer la séance'}</span>
                    </Button>
                  </div>
                </form>

                {/* Workout History */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(gymLogs ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2 text-center">
                      {tTask.noWorkoutsYet}
                    </p>
                  ) : (
                    (gymLogs ?? []).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white truncate">
                              {log.muscleGroups}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                              {log.date}
                            </span>
                          </div>
                          {log.exercises && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {log.exercises}
                            </p>
                          )}
                          {log.tomorrowPlan && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                              ➜ {log.tomorrowPlan}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            +40 XP
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteGymLog(log.id)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                            title={tCommon.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. STUDY TRACK DETAIL */}
            {activeTrack.type === 'study' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>+30 XP / {language === 'ar' ? 'وحدة دراسية' : 'module complété'}</span>
                  </div>
                  <span className="font-bold text-zinc-500 tabular-nums">
                    {(studyModules ?? []).filter((m) => m.completed).length} / {(studyModules ?? []).length}
                  </span>
                </div>

                {/* Quick Add Module Form */}
                <form onSubmit={handleAddModule} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder={tTask.modulePlaceholder || 'Nom du module ou matière...'}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={moduleSubject}
                    onChange={(e) => setModuleSubject(e.target.value)}
                    placeholder={tTask.subjectPlaceholder || 'Discipline (optionnel)...'}
                    className="sm:w-44 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    <span>{tCommon.confirm}</span>
                  </Button>
                </form>

                {/* Modules List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(studyModules ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-2 text-center">
                      {language === 'ar' ? 'لا توجد وحدات دراسية مسجلة حالياً.' : 'Aucun module pour le moment.'}
                    </p>
                  ) : (
                    (studyModules ?? []).map((mod) => (
                      <div
                        key={mod.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          mod.completed
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-zinc-400 dark:text-zinc-500'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleStudyModule(mod.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              mod.completed
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-transparent hover:text-zinc-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <div className="truncate">
                            <span className={`text-xs font-bold block ${mod.completed ? 'line-through text-zinc-400' : ''}`}>
                              {mod.title}
                            </span>
                            {mod.subject && (
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {mod.subject}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            +30 XP
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteStudyModule(mod.id)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                            title={tCommon.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── CREATE NEW PROGRAM TRACK MODAL ── */}
      <Modal
        isOpen={isAddTrackModalOpen}
        onClose={() => setIsAddTrackModalOpen(false)}
        title={tTask.addProgram || 'Nouveau programme'}
        subtitle={
          language === 'ar'
            ? 'إنشاء مسار جديد وتتبع مهاراتك اليومية'
            : 'Créez un nouveau track de compétences ou habitudes'
        }
      >
        <form onSubmit={handleCreateProgramTrack} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {tTask.programName || 'Nom du programme'} *
            </label>
            <input
              type="text"
              required
              value={newTrackTitle}
              onChange={(e) => setNewTrackTitle(e.target.value)}
              placeholder="ex : Deutsch (Allemand), Marketing, UI/UX..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {language === 'ar' ? 'أيقونة' : 'Icône / Emoji'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {['🎯', '🚀', '🧠', '💼', '🎨', '📖'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewTrackIcon(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                      newTrackIcon === emoji
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 scale-105'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {language === 'ar' ? 'لون' : 'Couleur'}
              </label>
              <div className="flex gap-2 flex-wrap items-center pt-1">
                {['#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTrackColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newTrackColor === color
                        ? 'scale-125 ring-2 ring-offset-2 ring-blue-500'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsAddTrackModalOpen(false)}>
              {tTask.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {tCommon.confirm}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
