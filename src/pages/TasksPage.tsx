import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { TaskItem, TaskSubItem, TaskCategory, TaskFrequency, PrayerKey, StudyModuleItem, GymWorkoutLog, ProgramTrack } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { translations } from '../i18n/translations';
import { getProgramTrackTitle } from '../utils/i18nHelpers';
import { playHapticFeedback, triggerHaptic } from '../utils/haptics';
import { GoogleCalendarAlarmModal } from '../components/common/GoogleCalendarAlarmModal';
import { DropdownPortal } from '../components/common/DropdownPortal';
import { UpcomingScheduleWidget } from '../components/meetings/UpcomingScheduleWidget';
import confetti from 'canvas-confetti';
import {
  createGoogleCalendarEvent,
  syncEntityToGoogleCalendar,
  deleteCalendarEventByFloussId,
  formatRFC3339WithOffset,
} from '../services/googleCalendar';
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
  ChevronUp,
  ChevronDown,
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
    color: 'text-zinc-600 dark:text-muted',
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

const WEEKDAY_OPTIONS = [
  { value: 0, ar: 'أحد', fr: 'Dim', en: 'Sun' },
  { value: 1, ar: 'إثن', fr: 'Lun', en: 'Mon' },
  { value: 2, ar: 'ثلا', fr: 'Mar', en: 'Tue' },
  { value: 3, ar: 'أرب', fr: 'Mer', en: 'Wed' },
  { value: 4, ar: 'خمي', fr: 'Jeu', en: 'Thu' },
  { value: 5, ar: 'جمع', fr: 'Ven', en: 'Fri' },
  { value: 6, ar: 'سبت', fr: 'Sam', en: 'Sat' },
];

const GYM_CHIPS = ['Chest', 'Back', 'Arms', 'Shoulders', 'Legs', 'Push', 'Pull', 'Core'] as const;

const GYM_CHIP_LABELS: Record<string, { ar: string; fr: string; en: string; icon: string }> = {
  Chest: { ar: 'الصدر (Chest)', fr: 'Pectoraux (Chest)', en: 'Chest', icon: '🫁' },
  Back: { ar: 'الظهر (Back)', fr: 'Dos (Back)', en: 'Back', icon: '🥋' },
  Arms: { ar: 'الذراعين (Arms)', fr: 'Bras (Arms)', en: 'Arms', icon: '💪' },
  Shoulders: { ar: 'الأكتاف (Shoulders)', fr: 'Épaules (Shoulders)', en: 'Shoulders', icon: '🦾' },
  Legs: { ar: 'الأرجل (Legs)', fr: 'Jambes (Legs)', en: 'Legs', icon: '🦵' },
  Push: { ar: 'Push (دفع)', fr: 'Push (Poussée)', en: 'Push', icon: '⚡' },
  Pull: { ar: 'Pull (سحب)', fr: 'Pull (Tirage)', en: 'Pull', icon: '🔥' },
  Core: { ar: 'البطن (Core)', fr: 'Abdos (Core)', en: 'Core', icon: '🎯' },
};

const ECONOMICS_S3_MODULES = [
  'Marketing de Base',
  'Comptabilité Analytique',
  'Économie Monétaire et Financière',
  'Échantillonnage et Estimation',
  'Problèmes Économiques et Sociaux',
  'Gestion des Ressources Humaines',
] as const;

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isScheduledOnDate(task: TaskItem, dateStr: string): boolean {
  if (task.isArchived) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  if (task.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (task.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
  if (task.frequency === 'custom_days') {
    let selectedDays = task.selectedDaysOfWeek || [];
    if (!selectedDays.length && task.scheduledDate) {
      const [scheduledYear, scheduledMonth, scheduledDay] = task.scheduledDate.split('-').map(Number);
      selectedDays = [new Date(scheduledYear, scheduledMonth - 1, scheduledDay).getDay()];
    }
    if (!selectedDays.length) selectedDays = [0, 1, 2, 3, 4, 5, 6];
    return selectedDays.includes(dayOfWeek);
  }
  return true;
}

interface TaskActionDropdownProps {
  task: TaskItem;
  onAlarm: () => void;
  onEdit: () => void;
  onDelete: () => void;
  alarmLabel: string;
  editLabel: string;
  deleteLabel: string;
}

const TaskActionDropdown: React.FC<TaskActionDropdownProps> = ({
  task,
  onAlarm,
  onEdit,
  onDelete,
  alarmLabel,
  editLabel,
  deleteLabel,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Task actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-white hover:bg-white/[0.06] focus-visible:outline-none transition-colors"
      >
        <span className="text-base leading-none">⋯</span>
      </button>

      <DropdownPortal
        isOpen={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        align="end"
        minWidth={176}
        className="w-48 rounded-2xl border border-white/[0.12] bg-[#0E0F17]/95 backdrop-blur-2xl p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)]"
      >
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAlarm();
            }}
            className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-start text-xs text-content hover:bg-white/[0.06] cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{alarmLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-start text-xs text-content hover:bg-white/[0.06] cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{editLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-start text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{deleteLabel}</span>
          </button>
        </div>
      </DropdownPortal>
    </div>
  );
};

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
    updateStudyModule,
    deleteStudyModule,
    gymLogs,
    addGymLog,
    deleteGymLog,
    programTracks,
    addProgramTrack,
    deleteProgramTrack,
    addProgramSubTask,
    updateProgramSubTask,
    toggleProgramSubTask,
    deleteProgramSubTask,
    showToast,
  } = useAppStore();
  const tTask = translations[language].tasks;
  const tCommon = translations[language].common;

  const [todayStr, setTodayStr] = useState(() => formatISODate(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'daily' | 'month' | 'stats'>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [inlineSubTaskInput, setInlineSubTaskInput] = useState<Record<string, string>>({});
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{ dateStr: string; count: number } | null>(null);

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
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [taskNotes, setTaskNotes] = useState('');
  const [taskScheduledDate, setTaskScheduledDate] = useState<string>(todayStr);
  const [taskScheduledTime, setTaskScheduledTime] = useState<string>('');
  const [syncToCalendar, setSyncToCalendar] = useState<boolean>(false);
  const [isCalendarSaving, setIsCalendarSaving] = useState<boolean>(false);

  // Keep the day selector correct if the app stays open across local midnight.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextToday = formatISODate(new Date());
      if (nextToday !== todayStr) {
        setTodayStr(nextToday);
        setSelectedDate((selected) => selected === todayStr ? nextToday : selected);
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [todayStr]);

  // ── Task Category Filter Dropdown State (no horizontal scrollbar) ──
  const [isTaskCategoryDropdownOpen, setIsTaskCategoryDropdownOpen] = useState(false);
  const taskCategoryDropdownTriggerRef = useRef<HTMLButtonElement>(null);

  // Dynamic Schedule Date Label logic: Today -> "Today", Today + 1 -> "Tomorrow", else Weekday name
  const getScheduleDateLabel = (dateStr: string): string => {
    const now = new Date();
    const today = formatISODate(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = formatISODate(tomorrowDate);

    if (dateStr === today) {
      return language === 'ar' ? 'اليوم' : language === 'en' ? 'Today' : "Aujourd'hui";
    }
    if (dateStr === tomorrow) {
      return language === 'ar' ? 'غداً' : language === 'en' ? 'Tomorrow' : 'Demain';
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';
    const dayName = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(targetDate);
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };

  // ── Study Module Input State ──
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleSubject, setModuleSubject] = useState('');

  // ── Gym Workout Input State ──
  const [selectedGymMuscles, setSelectedGymMuscles] = useState<string[]>([]);
  const [gymMuscles, setGymMuscles] = useState('');
  const [gymExercises, setGymExercises] = useState('');
  const [gymTomorrowPlan, setGymTomorrowPlan] = useState('');

  // ── SubTask & Study Module Detail / Edit State ──
  const [editingSubTask, setEditingSubTask] = useState<{ trackId: string; subId: string; title: string; points: number } | null>(null);
  const [editingStudyModule, setEditingStudyModule] = useState<StudyModuleItem | null>(null);

  // ── Standalone Google Calendar Alarm Modal State ──
  const [alarmModalTaskTitle, setAlarmModalTaskTitle] = useState<string | null>(null);
  const [alarmModalDescription, setAlarmModalDescription] = useState<string>('');

  // Generate 7 days around selected date for quick navigation strip
  const dateStrip = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const curr = new Date(year, month - 1, day);
    const days: { dateStr: string; dayName: string; dayNum: number; isToday: boolean; taskCount: number; completedCount: number }[] = [];
    const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';
    for (let i = -3; i <= 3; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      const str = formatISODate(d);
      const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
      const scheduledTasks = (tasks || []).filter((task) => isScheduledOnDate(task, str));
      days.push({
        dateStr: str,
        dayName,
        dayNum: d.getDate(),
        isToday: str === todayStr,
        taskCount: scheduledTasks.length,
        completedCount: scheduledTasks.filter((task) => (task.completedDates || []).includes(str)).length,
      });
    }
    return days;
  }, [selectedDate, todayStr, language, tasks]);

  // Tasks applicable for selected day
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      if (task.isArchived) return false;
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

      return isScheduledOnDate(task, selectedDate);
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

  const duplicateSuggestions = useMemo(() => {
    const titles = (tasks || []).filter((task) => !task.isArchived).map((task) => task.title.toLowerCase());
    const hasCoding = titles.some((title) => title.includes('coding')) && titles.some((title) => title.includes('development'));
    const hasStudy = titles.some((title) => title.includes('study')) && titles.some((title) => title.includes('english'));
    return [
      ...(hasCoding ? ['CODING / DEVELOPMENT'] : []),
      ...(hasStudy ? ['Study / ENGLISH'] : []),
    ];
  }, [tasks]);

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

  // ── GitHub-style Habit Heatmap (365 Days / 52 Weeks) ──
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days: {
      dateStr: string;
      date: Date;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
      dayOfWeek: number;
      monthName: string;
      isToday: boolean;
    }[] = [];

    // Pre-build set of completed counts for fast lookup
    const countsByDate = new Map<string, number>();
    (tasks || []).forEach((t) => {
      (t.completedDates || []).forEach((d) => {
        countsByDate.set(d, (countsByDate.get(d) || 0) + 1);
      });
    });
    Object.entries(salatLogs || {}).forEach(([d, prayers]) => {
      if ((prayers || []).length === 5) {
        countsByDate.set(d, (countsByDate.get(d) || 0) + 1);
      }
    });
    (gymLogs || []).forEach((g) => {
      if (g.date) {
        countsByDate.set(g.date, (countsByDate.get(g.date) || 0) + 1);
      }
    });
    (programTracks || []).forEach((tr) => {
      (tr.subtasks || []).forEach((sub) => {
        (sub.completedDates || []).forEach((d) => {
          countsByDate.set(d, (countsByDate.get(d) || 0) + 1);
        });
      });
    });

    // 52 weeks ending today (364 days)
    const totalDays = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    // Align startDate to Monday (1)
    const startDay = startDate.getDay();
    const diffToMon = startDay === 0 ? -6 : 1 - startDay;
    startDate.setDate(startDate.getDate() + diffToMon);

    const curr = new Date(startDate);
    const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-US' : 'fr-FR';

    while (curr <= today || curr.getDay() !== 1) {
      const dateStr = formatISODate(curr);
      const count = countsByDate.get(dateStr) || 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 5) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      days.push({
        dateStr,
        date: new Date(curr),
        count,
        level,
        dayOfWeek: curr.getDay(),
        monthName: curr.toLocaleDateString(locale, { month: 'short' }),
        isToday: dateStr === todayStr,
      });

      curr.setDate(curr.getDate() + 1);
      if (curr > today && curr.getDay() === 1) break;
    }

    // Group into weeks
    const weeks: (typeof days)[] = [];
    let currentWeek: typeof days = [];
    days.forEach((d) => {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    let totalCompletions = 0;
    let maxCountInDay = 0;
    days.forEach((d) => {
      totalCompletions += d.count;
      if (d.count > maxCountInDay) maxCountInDay = d.count;
    });

    return { weeks, days, totalCompletions, maxCountInDay };
  }, [tasks, salatLogs, gymLogs, programTracks, language, todayStr]);

  const handleToggleSalat = (prayer: PrayerKey) => {
    playHapticFeedback('success');
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

  const handleQuickAddEconomicsModule = (moduleName: string) => {
    const exists = (studyModules || []).some(
      (m) => m.title.toLowerCase() === moduleName.toLowerCase()
    );
    if (exists) {
      showToast({
        message: language === 'ar'
          ? `الوحدة "${moduleName}" موجودة بالفعل في قائمتك.`
          : `Le module "${moduleName}" est déjà dans votre liste.`,
      });
      return;
    }
    addStudyModule(moduleName, 'Économie & Gestion (S3)');
    showToast({
      message: language === 'ar'
        ? `✓ تمت إضافة وحدة "${moduleName}" بنجاح!`
        : `✓ Module "${moduleName}" ajouté avec succès !`,
    });
  };

  const toggleMuscleChip = (chip: string) => {
    setSelectedGymMuscles((prev) =>
      prev.includes(chip) ? prev.filter((m) => m !== chip) : [...prev, chip]
    );
  };

  const handleAddGym = (e: React.FormEvent) => {
    e.preventDefault();
    const muscleText = selectedGymMuscles.length > 0
      ? selectedGymMuscles.join(', ')
      : gymMuscles.trim();
    if (!muscleText) {
      showToast({
        message: language === 'ar'
          ? 'يرجى اختيار مجموعة عضلية واحدة على الأقل'
          : 'Veuillez sélectionner au moins un groupe musculaire',
      });
      return;
    }
    addGymLog({
      date: selectedDate,
      muscleGroups: muscleText,
      exercises: gymExercises.trim() || undefined,
      tomorrowPlan: gymTomorrowPlan.trim() || undefined,
    });
    setSelectedGymMuscles([]);
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

  const getQuickChips = (task: TaskItem): string[] => {
    const title = (task.title || '').toLowerCase();
    if (title.includes('salat') || title.includes('prayer') || title.includes('صلاة')) {
      return language === 'ar'
        ? ['الوضوء', 'أذكار ما بعد الصلاة', 'سنة راتبة', 'قراءة وجه قرآن']
        : ['Ablution (Wudu)', 'Dhikr & Dua', 'Sunnah Prayer', 'Read 1 Page Quran'];
    }
    if (title.includes('gym') || title.includes('workout') || title.includes('تدريب') || title.includes('رياضة')) {
      return language === 'ar'
        ? ['إحماء 10 د', 'تمرين أولي', 'تمرين ثانوي', 'إطالة بعد التمرين']
        : ['10m Warmup', 'Primary Compound', 'Accessory Superset', 'Post-stretch'];
    }
    if (title.includes('english') || title.includes('study') || title.includes('دراسة') || title.includes('لغة')) {
      return language === 'ar'
        ? ['حفظ 5 كلمات', 'استماع بودكاست 15 د', 'قراءة مقال', 'مراجعة التكرار المتباعد']
        : ['5 New Vocabulary', '15m Podcast Listening', '1 Article Read', 'Anki SRS Review'];
    }
    if (title.includes('code') || title.includes('program') || title.includes('تطوير') || title.includes('برمجة')) {
      return language === 'ar'
        ? ['كتابة اختبار الوحدة', 'إصلاح الخلل', 'مراجعة الكود', 'توثيق الميزة']
        : ['Write Unit Test', 'Fix Edge Case', 'PR Review', 'Docs / Changelog'];
    }
    return language === 'ar'
      ? ['تحضير المتطلبات', 'التركيز 25 دقيقة (بومودورو)', 'مراجعة وتأكيد الإنجاز']
      : ['Prepare Materials', '25m Deep Pomodoro', 'Final Review & Wrap-up'];
  };

  const handleAddInlineSubTask = (taskId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentSubtasks = task.subtasks || [];
    const newSubItem: TaskSubItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: trimmed,
      completed: false,
    };
    const updatedSubtasks = [...currentSubtasks, newSubItem];
    updateTask(taskId, { subtasks: updatedSubtasks });
    setInlineSubTaskInput((prev) => ({ ...prev, [taskId]: '' }));
    playHapticFeedback('light');
  };

  const handleToggleInlineSubTask = (taskId: string, subId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);
    const anyUndone = updatedSubtasks.some((s) => !s.completed);
    const completedDates = task.completedDates || [];
    const isCompletedToday = completedDates.includes(selectedDate);

    let nextDates = completedDates;
    if (allDone && !isCompletedToday) {
      nextDates = [...completedDates, selectedDate];
      playHapticFeedback('success');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast({
        message: language === 'ar'
          ? `🎉 اكتملت جميع المهام الفرعية لـ "${task.title}" (+15 XP)!`
          : `🎉 All sub-tasks completed for "${task.title}" (+15 XP)!`,
      });
    } else if (anyUndone && isCompletedToday) {
      nextDates = completedDates.filter((d) => d !== selectedDate);
    }

    updateTask(taskId, {
      subtasks: updatedSubtasks,
      completedDates: nextDates,
    });
    playHapticFeedback('selection');
  };

  const handleDeleteInlineSubTask = (taskId: string, subId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = currentSubtasks.filter((s) => s.id !== subId);
    updateTask(taskId, { subtasks: updatedSubtasks });
    playHapticFeedback('light');
  };

  const handleManualTaskToggle = (task: TaskItem) => {
    const completedDates = task.completedDates || [];
    const isCompleted = completedDates.includes(selectedDate);
    const subtasks = task.subtasks || [];
    const willBeCompleted = !isCompleted;

    const nextSubtasks = subtasks.map((s) => ({
      ...s,
      completed: willBeCompleted,
    }));

    handleToggle(task.id);
    if (subtasks.length > 0) {
      updateTask(task.id, { subtasks: nextSubtasks });
    }
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskCategory('routine');
    setTaskFrequency('daily');
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
    setTaskNotes('');
    setTaskScheduledDate(selectedDate || todayStr);
    setTaskScheduledTime('');
    setSyncToCalendar(false);
    setIsCalendarSaving(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handleNewTask = () => handleOpenAdd();
    window.addEventListener('flouss:open-add-task', handleNewTask);
    return () => window.removeEventListener('flouss:open-add-task', handleNewTask);
  }, [selectedDate, todayStr]);

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskCategory(task.category);
    setTaskFrequency(task.frequency);
    const savedDays = task.selectedDaysOfWeek?.length ? task.selectedDaysOfWeek : null;
    if (task.frequency === 'custom_days' && !savedDays) {
      if (task.scheduledDate) {
        const [year, month, day] = task.scheduledDate.split('-').map(Number);
        setSelectedDaysOfWeek([new Date(year, month - 1, day).getDay()]);
      } else {
        setSelectedDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      }
    } else {
      setSelectedDaysOfWeek(savedDays || []);
    }
    setTaskNotes(task.notes || '');
    setTaskScheduledDate(task.scheduledDate || selectedDate || todayStr);
    setTaskScheduledTime(task.scheduledTime || '');
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

    const taskId = editingTask ? editingTask.id : ('task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    let calendarEventId: string | undefined = editingTask?.googleCalendarEventId;

    if (syncToCalendar) {
      setIsCalendarSaving(true);
      try {
        const datePart = taskScheduledDate || selectedDate || todayStr;
        const timePart = taskScheduledTime || '10:00';
        const [hours, minutes] = timePart.split(':').map((n) => parseInt(n, 10) || 0);
        const [year, month, day] = datePart.split('-').map((n) => parseInt(n, 10) || 1);
        const startDate = new Date(year, month - 1, day, hours, minutes, 0);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

        const calRes = await syncEntityToGoogleCalendar({
          floussId: taskId,
          title: taskTitle.trim(),
          description: taskNotes.trim() || undefined,
          startDateTime: formatRFC3339WithOffset(startDate),
          endDateTime: formatRFC3339WithOffset(endDate),
          entityType: 'task',
          remindersMinutes: [10, 0],
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
    } else if (editingTask?.googleCalendarEventId || editingTask?.addToGoogleCalendar) {
      deleteCalendarEventByFloussId(taskId).catch(() => {});
      calendarEventId = undefined;
    }

    const cleanTime = taskScheduledTime.trim() ? taskScheduledTime.trim() : undefined;
    const scheduledDateTime = taskScheduledDate && cleanTime
      ? `${taskScheduledDate}T${cleanTime}`
      : undefined;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        selectedDaysOfWeek: taskFrequency === 'custom_days' ? selectedDaysOfWeek : undefined,
        notes: taskNotes.trim() || undefined,
        scheduledDate: taskScheduledDate,
        scheduledTime: cleanTime,
        scheduledDateTime,
        addToGoogleCalendar: syncToCalendar,
        googleCalendarEventId: calendarEventId,
      });
    } else {
      addTask({
        id: taskId,
        title: taskTitle.trim(),
        category: taskCategory,
        frequency: taskFrequency,
        selectedDaysOfWeek: taskFrequency === 'custom_days' ? selectedDaysOfWeek : undefined,
        notes: taskNotes.trim() || undefined,
        scheduledDate: taskScheduledDate,
        scheduledTime: cleanTime,
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
            <h1 className="text-2xl sm:text-3xl font-bold text-content tracking-tight">
              {tTask.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-caption font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {tTask.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {tTask.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            <span>{tTask.newTask}</span>
          </Button>
        </div>
      </div>

      {/* Unified Gamified Command HUD (2-Column Bento Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Progress %, XP & Streak Strip */}
        <div className="zawa-bento zawa-spotlight p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{tTask.todayProgress}</span>
              <span>•</span>
              <span className="font-mono text-white tabular-nums">
                {getScheduleDateLabel(selectedDate)}
              </span>
            </div>

            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full tabular-nums">
              {dailyStats.completed} / {dailyStats.total} {tTask.completedDays}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums">
                {dailyStats.percentage}%
              </span>
              <span className="text-xs text-muted">
                {dailyStats.percentage === 100
                  ? (language === 'ar' ? '🎉 اكتملت جميع المهام!' : '🎉 All tasks done!')
                  : `${dailyStats.total - dailyStats.completed} ${language === 'ar' ? 'مهام متبقية' : 'tasks remaining'}`}
              </span>
            </div>

            {/* Glowing progress track */}
            <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                style={{ width: `${dailyStats.percentage}%` }}
              />
            </div>
          </div>

          {/* Gamified metric chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06] text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-zinc-200 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Lv {gamificationStats.level} · {gamificationStats.totalXP} {tTask.xpPoints}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-muted bg-white/[0.03] px-2 py-1 rounded-full">
              {gamificationStats.progressPercent}% {tTask.xpNextLevel}
            </span>

            {overallStreak > 0 && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{overallStreak} {tTask.streakDays}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full tabular-nums">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tTask.monthAverage} {monthStats.rate}%</span>
            </span>
          </div>
        </div>

        {/* Right Column: 7-Day Week Selector with Glowing Indigo Active Day Pill */}
        <div className="zawa-bento zawa-spotlight sticky top-2 z-30 p-4 flex flex-col justify-between bg-[#0D0E14]/95 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {language === 'ar' ? 'أسبوع المهمة' : 'Week Schedule'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const [y, m, d] = selectedDate.split('-').map(Number);
                  const dt = new Date(y, m - 1, d);
                  dt.setDate(dt.getDate() - 1);
                  setSelectedDate(formatISODate(dt));
                }}
                className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title={language === 'ar' ? 'اليوم السابق' : 'Previous day'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                title={selectedDate !== todayStr ? (language === 'ar' ? 'الرجوع إلى اليوم' : 'Jump to Today') : undefined}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize transition-colors ${
                  selectedDate === todayStr
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] cursor-pointer'
                }`}
              >
                {getScheduleDateLabel(selectedDate)}
              </button>

              <button
                type="button"
                onClick={() => {
                  const [y, m, d] = selectedDate.split('-').map(Number);
                  const dt = new Date(y, m - 1, d);
                  dt.setDate(dt.getDate() + 1);
                  setSelectedDate(formatISODate(dt));
                }}
                className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title={language === 'ar' ? 'اليوم التالي' : 'Next day'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Day Segmented Strip */}
          <div className="grid grid-cols-7 gap-1.5 py-3">
            {dateStrip.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  aria-pressed={isSelected}
                  aria-label={`${item.dayName} ${item.dayNum}: ${item.completedCount} / ${item.taskCount}`}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.04]'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {item.dayName}
                  </span>
                  <span className="text-sm font-bold mt-0.5 tabular-nums">
                    {item.dayNum}
                  </span>
                  <span className={`mt-1 text-[8px] font-semibold tabular-nums ${isSelected ? 'text-white/85' : 'text-muted'}`}>
                    {item.taskCount > 0
                      ? `${item.completedCount}/${item.taskCount}`
                      : language === 'ar' ? 'راحة' : language === 'fr' ? 'Repos' : 'Off'}
                  </span>
                  {item.isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-amber-300' : 'bg-indigo-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-muted text-center pt-1 border-t border-white/[0.06]">
            {language === 'ar' ? 'حدد أي يوم لعرض وتحديث المهام' : 'Select any day to inspect & check off tasks'}
          </div>
        </div>
      </div>

      {/* Sleek Single-Row Glass Toolbar */}
      <div className="zawa-bento p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: View Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>{tTask.todayList}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('month')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'month'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{tTask.matrixTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-zinc-950 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{tTask.statsTab}</span>
          </button>
        </div>

        {/* Right: Custom Glass Task Category Popover (No horizontal scrollbar) */}
        <div className="relative inline-block shrink-0">
          <button
            ref={taskCategoryDropdownTriggerRef}
            type="button"
            aria-expanded={isTaskCategoryDropdownOpen}
            onClick={() => setIsTaskCategoryDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 outline-none shadow-xs hover:border-white/[0.18] hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            {selectedCategory !== 'all' && CATEGORY_CONFIG[selectedCategory as TaskCategory] ? (
              <span>{CATEGORY_CONFIG[selectedCategory as TaskCategory].icon}</span>
            ) : (
              <ListTodo className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="truncate max-w-[130px]">
              {selectedCategory === 'all'
                ? `${tTask.all} (${tasks.length})`
                : CATEGORY_CONFIG[selectedCategory as TaskCategory]?.[language] ||
                  CATEGORY_CONFIG[selectedCategory as TaskCategory]?.fr ||
                  selectedCategory}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                isTaskCategoryDropdownOpen ? 'rotate-180 text-white' : ''
              }`}
            />
          </button>

          <DropdownPortal
            isOpen={isTaskCategoryDropdownOpen}
            onClose={() => setIsTaskCategoryDropdownOpen(false)}
            triggerRef={taskCategoryDropdownTriggerRef}
            align="end"
            minWidth={210}
            className="min-w-[210px] overflow-y-auto no-scrollbar rounded-2xl bg-[#12131C]/95 backdrop-blur-2xl border border-white/[0.12] p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)]"
          >
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setIsTaskCategoryDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ListTodo className="w-3.5 h-3.5 opacity-60" />
                  <span>{tTask.all}</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums opacity-80">
                  {tasks.length}
                </span>
              </button>

              <div className="h-px bg-white/[0.06] my-1" />

              {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => {
                const isSelected = selectedCategory === catKey;
                const catCount = tasks.filter((t) => t.category === catKey).length;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(catKey);
                      setIsTaskCategoryDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                      isSelected
                        ? 'bg-white text-zinc-950 font-bold shadow-xs'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{conf.icon}</span>
                      <span className="truncate">{conf[language] || conf.fr}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums opacity-80 shrink-0">
                      {catCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </DropdownPortal>
        </div>
      </div>

      {/* VIEW 1: DAILY TASKS (CHECK OFF VIEW) */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
              <span>{tTask.todayList} ({filteredTasks.length})</span>
            </h3>
            <span className="text-xs text-muted">
              {language === 'ar' ? 'اضغط لتوسيع المهام الفرعية' : language === 'en' ? 'Click card to expand sub-tasks' : 'Cliquez pour ouvrir les sous-tâches'}
            </span>
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => {
                const isCompleted = (task.completedDates || []).includes(selectedDate);
                const streak = calculateStreak(task);
                const conf = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;
                const subtasks = task.subtasks || [];
                const completedSubtasks = subtasks.filter((s) => s.completed);
                const subtasksCount = subtasks.length;
                const completedCount = completedSubtasks.length;
                const hasSubtasks = subtasksCount > 0;
                const percent = hasSubtasks
                  ? Math.round((completedCount / subtasksCount) * 100)
                  : isCompleted
                  ? 100
                  : 0;
                const isExpanded = expandedTaskId === task.id;
                const chips = getQuickChips(task);

                return (
                  <motion.div
                    key={task.id}
                    layout
                    onClick={() => setExpandedTaskId((prev) => (prev === task.id ? null : task.id))}
                    className={`zawa-bento zawa-spotlight p-4 cursor-pointer transition-all duration-300 ${
                      isCompleted
                        ? 'border-emerald-500/30 bg-[#0B0C12]/95 shadow-[0_0_24px_-6px_rgba(16,185,129,0.2)]'
                        : 'hover:border-white/[0.18]'
                    }`}
                  >
                    {/* Main Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Dynamic SVG Circular Progress Ring */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualTaskToggle(task);
                          }}
                          className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 mt-0.5"
                          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {hasSubtasks ? (
                            <div className="relative w-10 h-10 flex items-center justify-center">
                              <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke="rgba(255, 255, 255, 0.08)"
                                  strokeWidth="3"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke={isCompleted ? '#10b981' : '#6366f1'}
                                  strokeWidth="3"
                                  strokeDasharray="88"
                                  strokeDashoffset={88 - (88 * percent) / 100}
                                  strokeLinecap="round"
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                                ) : (
                                  <span className="text-[10px] font-bold text-indigo-400 tabular-nums">
                                    {completedCount}/{subtasksCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : isCompleted ? (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.4)]">
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-white/[0.03] text-zinc-500 border border-white/[0.12] hover:border-white/[0.25] flex items-center justify-center">
                              <Circle className="w-5 h-5 stroke-[1.8]" />
                            </div>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-semibold text-sm tracking-tight ${
                                isCompleted
                                  ? 'line-through text-muted'
                                  : 'text-content font-bold'
                              }`}
                            >
                              {task.title}
                            </span>

                            {hasSubtasks && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border tabular-nums ${
                                  isCompleted
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                                    : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
                                }`}
                              >
                                {completedCount} / {subtasksCount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.color} ${conf.border}`}
                            >
                              <span>{conf.icon}</span>
                              <span>{conf[language] || conf.fr}</span>
                            </span>

                            <span className="text-[11px] text-muted">
                              {FREQUENCY_LABELS[task.frequency]?.[language] ||
                                FREQUENCY_LABELS[task.frequency]?.fr}
                            </span>

                            {streak > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full tabular-nums">
                                🔥 {streak} j
                              </span>
                            )}

                            {Boolean(task.scheduledTime && task.scheduledTime.trim() !== '') && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full tabular-nums">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{task.scheduledTime}</span>
                                {task.addToGoogleCalendar && <Bell className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />}
                              </span>
                            )}

                            <span className="text-[11px] font-bold text-muted tabular-nums">
                              +15 XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right controls: chevron & actions dropdown */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-muted hover:text-white transition-colors"
                          aria-label="Toggle drawer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <TaskActionDropdown
                          task={task}
                          alarmLabel={tTask.googleCalendarAlarmBtn}
                          editLabel={tTask.editTask}
                          deleteLabel={tCommon.delete}
                          onAlarm={() => {
                            setAlarmModalTaskTitle(task.title);
                            setAlarmModalDescription(task.notes || '');
                          }}
                          onEdit={() => handleOpenEdit(task)}
                          onDelete={() => {
                            deleteTask(task.id);
                            deleteCalendarEventByFloussId(task.id).catch(() => {});
                          }}
                        />
                      </div>
                    </div>

                    {/* Inline Sub-Tasks Workspace Drawer */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 pt-3.5 border-t border-white/[0.08] space-y-3"
                        >
                          {/* Drawer Header & Mini Progress Bar */}
                          {hasSubtasks && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-zinc-300">
                                  {language === 'ar' ? 'تقدم المهام الفرعية' : 'Sub-tasks Progress'}
                                </span>
                                <span className="font-mono text-indigo-400 font-bold tabular-nums">
                                  {completedCount} / {subtasksCount} ({percent}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isCompleted
                                      ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                      : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Sub-tasks list */}
                          {hasSubtasks && (
                            <div className="space-y-1.5 pt-1">
                              {subtasks.map((sub) => (
                                <div
                                  key={sub.id}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                                    sub.completed
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-muted'
                                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-200 hover:bg-white/[0.06]'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleInlineSubTask(task.id, sub.id)}
                                    className="flex items-center gap-2.5 text-xs text-start min-w-0 flex-1"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                                        sub.completed
                                          ? 'bg-emerald-500 text-white shadow-xs'
                                          : 'border border-white/20 hover:border-white/40'
                                      }`}
                                    >
                                      {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span
                                      className={`truncate ${
                                        sub.completed ? 'line-through text-muted' : 'font-medium'
                                      }`}
                                    >
                                      {sub.title}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInlineSubTask(task.id, sub.id)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors ml-2"
                                    title="Delete sub-task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 1-Tap Smart Contextual Quick-Chips */}
                          <div className="pt-1 space-y-1.5">
                            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                              {language === 'ar' ? '⚡ اقتراحات سريعة بنقرة واحدة' : '⚡ 1-Tap Quick Suggestions'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {chips.map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => handleAddInlineSubTask(task.id, chip)}
                                  className="rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs px-2.5 py-1 text-zinc-300 active:scale-95 transition-all"
                                >
                                  + {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Add Sub-Task Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={inlineSubTaskInput[task.id] || ''}
                              onChange={(e) =>
                                setInlineSubTaskInput((prev) => ({
                                  ...prev,
                                  [task.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddInlineSubTask(task.id, inlineSubTaskInput[task.id] || '');
                                }
                              }}
                              placeholder={
                                language === 'ar'
                                  ? '+ أضف مهمة فرعية (Enter)...'
                                  : '+ Add sub-task (press Enter)...'
                              }
                              className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 text-xs px-3.5 py-2 rounded-xl text-white placeholder-zinc-500 outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleAddInlineSubTask(task.id, inlineSubTaskInput[task.id] || '')
                              }
                              className="rounded-xl bg-white text-zinc-950 font-semibold px-3 py-2 text-xs hover:bg-zinc-200 active:scale-95 transition-all shrink-0"
                            >
                              {language === 'ar' ? 'إضافة' : language === 'en' ? 'Add' : 'Ajouter'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* 7-Day Google Calendar & Meetings Integration */}
          <div className="pt-2">
            <UpcomingScheduleWidget />
          </div>
        </div>
      )}

      {/* VIEW 2: GITHUB-STYLE HABIT CONTRIBUTION HEATMAP (365-DAY / 52 WEEKS) */}
      {activeTab === 'month' && (
        <div className="zawa-bento p-5 border border-white/[0.08] shadow-2xl space-y-5">
          {/* Heatmap Header & High-Density Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2.5 tracking-tight">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>
                  {language === 'ar'
                    ? 'خريطة المساهمات وإنجاز العادات'
                    : language === 'fr'
                    ? 'Carte d’activité & Habitudes (GitHub Style)'
                    : 'Habit Contribution Heatmap'}
                </span>
                <span className="text-xs font-mono font-medium text-zinc-400">
                  (52 {language === 'ar' ? 'أسبوعاً' : 'semaines'})
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {language === 'ar'
                  ? 'سجل التزامك اليومي بالروتين والصلوات والرياضة على مدار 365 يوماً'
                  : 'Historique de régularité sur les 365 derniers jours (Salat, Gym, Routines)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tabular-nums">
                <Zap className="w-3.5 h-3.5" />
                <span>{heatmapData.totalCompletions} {language === 'ar' ? 'إنجازاً' : 'actions'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold tabular-nums">
                <Flame className="w-3.5 h-3.5" />
                <span>{overallStreak} {language === 'ar' ? 'أيام متتالية' : 'j de série'}</span>
              </span>
            </div>
          </div>


          {/* GitHub-style Contribution Matrix Container */}
          {/* Mobile: Monthly Calendar View | Desktop: Full 52-week heatmap */}

          {/* ── MOBILE: Current-Month Calendar Grid (7-col, fully contained) ── */}
          <div className="block md:hidden w-full">
            <div className="w-full">
              {/* Day-of-week header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {(language === 'ar'
                  ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
                  : language === 'fr'
                  ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
                  : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                ).map((d) => (
                  <div key={d} className="text-center text-[9px] font-mono text-zinc-500 pb-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Build current-month calendar */}
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                // Monday=0 offset
                const firstDayOfMonth = new Date(year, month, 1);
                const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // Mon=0
                const cells: (number | null)[] = [];
                for (let i = 0; i < startOffset; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                // Pad to full weeks
                while (cells.length % 7 !== 0) cells.push(null);

                return (
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                      if (day === null) return <div key={`empty-${idx}`} />;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayData = heatmapData.days?.find((d: any) => d.dateStr === dateStr);
                      const level = dayData?.level || 0;
                      const isToday = dateStr === new Date().toISOString().slice(0, 10);
                      const levelClass =
                        level === 4
                          ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                          : level === 3
                          ? 'bg-emerald-500/80 border-emerald-500/90'
                          : level === 2
                          ? 'bg-emerald-500/50 border-emerald-500/55'
                          : level === 1
                          ? 'bg-emerald-500/25 border-emerald-500/30'
                          : 'bg-white/[0.04] border-white/[0.05]';
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            triggerHaptic(40);
                            setSelectedDate(dateStr);
                            setActiveTab('daily');
                          }}
                          title={`${dateStr}: ${dayData?.count || 0} ${language === 'ar' ? 'مهام' : 'habitudes'}`}
                          className={`aspect-square w-full rounded-lg border flex items-center justify-center transition-all cursor-pointer ${levelClass} ${
                            isToday ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#0B0C12]' : ''
                          } active:scale-90 duration-150`}
                        >
                          <span className={`text-[9px] font-bold ${level > 0 ? 'text-white' : 'text-zinc-500'} ${isToday ? 'text-indigo-300' : ''}`}>
                            {day}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── DESKTOP: Full 52-week GitHub-style heatmap ── */}
          <div className="hidden md:block overflow-x-auto pb-3 pt-1 scrollbar-thin">
            <div className="min-w-max space-y-2 select-none">
              {/* Month Markers Row */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 ps-7">
                {heatmapData.weeks.map((week, wIdx) => {
                  const firstDay = week[0];
                  const showMonth = firstDay && (wIdx === 0 || firstDay.date.getDate() <= 7);
                  return (
                    <div key={wIdx} className="w-3.5 text-center shrink-0">
                      {showMonth ? firstDay.monthName : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid: 7 Rows (Mon - Sun) across 52+ Week Columns */}
              <div className="flex gap-2">
                {/* Day of Week Labels (Mon, Wed, Fri) */}
                <div className="flex flex-col justify-between text-[9px] font-mono text-zinc-400 py-0.5 shrink-0 w-5">
                  <span>{language === 'ar' ? 'اثن' : 'Lun'}</span>
                  <span>{language === 'ar' ? 'أرب' : 'Mer'}</span>
                  <span>{language === 'ar' ? 'جمع' : 'Ven'}</span>
                  <span>{language === 'ar' ? 'أحد' : 'Dim'}</span>
                </div>

                {/* Heatmap Columns */}
                <div className="flex gap-1">
                  {heatmapData.weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                      {week.map((day) => {
                        const levelClass =
                          day.level === 4
                            ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
                            : day.level === 3
                            ? 'bg-emerald-500/80 border-emerald-500/90'
                            : day.level === 2
                            ? 'bg-emerald-500/50 border-emerald-500/55'
                            : day.level === 1
                            ? 'bg-emerald-500/25 border-emerald-500/30'
                            : 'bg-white/[0.04] border-white/[0.05] hover:border-white/20';

                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => {
                              triggerHaptic(40);
                              setSelectedDate(day.dateStr);
                              setActiveTab('daily');
                            }}
                            onMouseEnter={() =>
                              setHoveredHeatmapDay({ dateStr: day.dateStr, count: day.count })
                            }
                            onMouseLeave={() => setHoveredHeatmapDay(null)}
                            title={`${day.dateStr}: ${day.count} ${
                              language === 'ar' ? 'مهام منجزة' : 'habitudes complétées'
                            }`}
                            className={`w-3.5 h-3.5 rounded-[3.5px] border transition-all cursor-pointer ${levelClass} ${
                              day.isToday ? 'ring-1.5 ring-indigo-400 ring-offset-1 ring-offset-[#0B0C12]' : ''
                            } hover:scale-125 active:scale-95 duration-150`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Heatmap Status Inspector & Legend */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
            <div className="text-zinc-400 flex items-center gap-2">
              {hoveredHeatmapDay ? (
                <span className="font-medium text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="tabular-nums font-mono text-emerald-300 font-bold">
                    {hoveredHeatmapDay.count}
                  </span>
                  <span>
                    {language === 'ar'
                      ? `عادة منجزة يوم ${hoveredHeatmapDay.dateStr}`
                      : `habitude(s) le ${hoveredHeatmapDay.dateStr}`}
                  </span>
                </span>
              ) : (
                <span className="text-zinc-500">
                  {language === 'ar'
                    ? 'اضغط على أي مربع للتنقل وتفقد مهام ذلك اليوم'
                    : 'Cliquez sur une case pour ouvrir les tâches de cette journée'}
                </span>
              )}
            </div>

            {/* Heatmap Scale Legend */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
              <span>{language === 'ar' ? 'أقل' : 'Moins'}</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-[3px] bg-white/[0.04] border border-white/[0.05]" />
                <span className="w-3 h-3 rounded-[3px] bg-emerald-500/25 border border-emerald-500/30" />
                <span className="w-3 h-3 rounded-[3px] bg-emerald-500/50 border border-emerald-500/55" />
                <span className="w-3 h-3 rounded-[3px] bg-emerald-500/80 border border-emerald-500/90" />
                <span className="w-3 h-3 rounded-[3px] bg-emerald-400 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              </div>
              <span>{language === 'ar' ? 'أكثر' : 'Plus'}</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STATS & EVALUATIONS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="zawa-bento p-5 border border-white/[0.08] shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2 tracking-tight">
              <Award className="w-5 h-5 text-amber-400" />
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
                      <span className="text-zinc-200">{task.title}</span>
                      <span className="text-emerald-400 font-mono tabular-nums">
                        {completedInMonth} / {monthDaysCount} j ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface backdrop-blur-2xl rounded-card p-5 border border-border-subtle shadow-xs space-y-4">
            <h3 className="font-bold text-base text-content flex items-center gap-2 tracking-tight">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>{tTask.consistencyTips}</span>
            </h3>
            <div className="space-y-3 text-xs text-zinc-600 dark:text-muted leading-relaxed">
              <div className="p-4 rounded-card bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">🔥 {tTask.consistencyTips}</span>
                {tTask.rule21Days}
              </div>
              <div className="p-4 rounded-card bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
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
            <label className="block text-xs font-bold text-content mb-1.5">
              {tTask.taskTitleLabel} *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={tTask.taskTitlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTask.categoryLabel}
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.icon} {c[language] || c.fr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTask.frequencyLabel}
              </label>
              <select
                value={taskFrequency}
                onChange={(e) => {
                  const frequency = e.target.value as TaskFrequency;
                  setTaskFrequency(frequency);
                  if (frequency === 'custom_days' && selectedDaysOfWeek.length === 0) {
                    const [year, month, day] = selectedDate.split('-').map(Number);
                    setSelectedDaysOfWeek([new Date(year, month - 1, day).getDay()]);
                  }
                }}
                className="w-full px-3 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v[language] || v.fr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {taskFrequency === 'custom_days' && (
            <fieldset className="rounded-card border border-border-subtle bg-surface p-3">
              <legend className="px-1 text-xs font-semibold text-content">
                {language === 'ar' ? 'اختار أيام التكرار' : language === 'fr' ? 'Choisissez les jours' : 'Choose repeat days'}
              </legend>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_OPTIONS.map((day) => {
                  const selected = selectedDaysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedDaysOfWeek((current) => selected
                        ? current.length > 1 ? current.filter((value) => value !== day.value) : current
                        : [...current, day.value].sort((a, b) => a - b))}
                      className={`min-h-10 rounded-control border text-[10px] font-bold transition-colors ${selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border-subtle bg-canvas text-muted hover:text-content'}`}
                    >{day[language]}</button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div>
            <label className="block text-xs font-bold text-content mb-1.5">
              {tTask.notesLabel}
            </label>
            <textarea
              rows={2}
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              placeholder={tTask.notesPlaceholder}
              className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date & Time Picker */}
          <div className="p-3.5 rounded-card bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-content">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{tTask.dateTimeLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-caption font-semibold text-muted mb-1">
                  {tTask.datePickerLabel}
                </label>
                <input
                  type="date"
                  value={taskScheduledDate}
                  onChange={(e) => setTaskScheduledDate(e.target.value)}
                  className="w-full min-w-[140px] px-4 py-2 rounded-xl bg-surface border border-zinc-200 dark:border-white/10 text-content text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-caption font-semibold text-muted mb-1">
                  {tTask.timePickerLabel}
                </label>
                <input
                  type="time"
                  value={taskScheduledTime}
                  onChange={(e) => setTaskScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-control bg-surface border border-zinc-200 dark:border-zinc-700 text-content text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Direct Instant Action Button: Add Alarm via Google Calendar */}
            <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setAlarmModalTaskTitle(taskTitle || 'Tâche Routine');
                  setAlarmModalDescription(taskNotes || 'Rappel Flouss');
                }}
                className="w-full py-2.5 px-4 rounded-control bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>{tTask.googleCalendarAlarmBtn}</span>
              </button>

              {/* Google Calendar Native Phone Alarm Toggle */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-control bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label htmlFor="calendar-alarm-toggle" className="text-xs font-bold text-content cursor-pointer select-none">
                      {tTask.googleCalendarToggle}
                    </label>
                    <p className="text-caption text-muted mt-0.5 leading-relaxed">
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
        title={getProgramTrackTitle(activeTrack, language)}
        subtitle={getScheduleDateLabel(selectedDate)}
        maxWidth="lg"
      >
        {activeTrack && (
          <div className="space-y-4 pt-1">
            {/* 1. SALAT TRACK DETAIL */}
            {activeTrack.type === 'salat' && (
              <div className="space-y-4">
                <div className="p-4 rounded-card bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-control bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      🕌
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-content">
                        {tTask.salatSection || 'Prières (Salat)'}
                      </h4>
                      <p className="text-xs text-muted">
                        {tTask.salatMaxReward || 'Score maximal : +50 XP / prière'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block tabular-nums">
                      {selectedDatePrayers.length} / 5
                    </span>
                    <span className="text-caption font-bold text-muted">
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
                        className={`flex flex-col items-center justify-center p-3.5 rounded-card border transition-all duration-200 active:scale-95 ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-muted border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-control flex items-center justify-center mb-1.5 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-zinc-200/80 dark:bg-zinc-700 text-muted'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold tracking-tight">{prayer.label}</span>
                        <span
                          className={`text-caption mt-0.5 font-bold tabular-nums ${
                            isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'
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
                    className="p-3.5 rounded-card bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-200">
                        {tTask.salatCompletedAll}
                      </span>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 bg-surface px-2 py-0.5 rounded-control shadow-2xs">
                      +250 XP
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* 2. SUBTASKS TRACKS DETAIL (CODING, ENGLISH, CUSTOM) */}
            {(activeTrack.type === 'coding' || activeTrack.type === 'english' || activeTrack.type === 'custom') && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-card bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3 text-xs">
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
                        ? (language === 'ar' ? 'مثال: Vue.js, Node.js, Python...' : language === 'en' ? 'e.g. Vue.js, Node.js, Docker...' : 'ex. : Vue.js, Node.js, Docker...')
                        : activeTrack.type === 'english'
                        ? (language === 'ar' ? 'مثال: Listening, Grammar, Vocabulary...' : language === 'en' ? 'e.g. Listening, Grammar, Speaking...' : 'ex. : Listening, grammaire, expression orale...')
                        : (tTask.subTaskPlaceholder || 'ex : Nouvelle sous-tâche...')
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    <span>{tTask.addSubTask || 'Ajouter'}</span>
                  </Button>
                </form>

                {/* Subtasks List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(activeTrack.subtasks || []).length === 0 ? (
                    <p className="text-xs text-muted italic py-4 text-center">
                      {tTask.noSubtasks || 'Aucune sous-tâche. Ajoutez-en une ci-dessus !'}
                    </p>
                  ) : (
                    (activeTrack.subtasks || []).map((sub) => {
                      const isDone = (sub.completedDates || []).includes(selectedDate);
                      return (
                        <div
                          key={sub.id}
                          className={`flex items-center justify-between p-3 rounded-card border transition-all ${
                            isDone
                              ? 'bg-blue-500/10 border-blue-500/25 text-muted dark:text-zinc-500'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-content'
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() =>
                              setEditingSubTask({
                                trackId: activeTrack.id,
                                subId: sub.id,
                                title: sub.title,
                                points: sub.points || 10,
                              })
                            }
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSubTask(activeTrack.id, sub.id);
                              }}
                              className={`w-6 h-6 rounded-control flex items-center justify-center transition-all shrink-0 ${
                                isDone
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-zinc-200 dark:bg-zinc-700 text-transparent hover:text-muted'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className={`text-xs font-bold truncate hover:underline ${isDone ? 'line-through text-muted' : ''}`}>
                              {sub.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setAlarmModalTaskTitle(`${getProgramTrackTitle(activeTrack, language)}: ${sub.title}`);
                                setAlarmModalDescription(`Rappel pour ${sub.title}`);
                              }}
                              className="p-1 rounded-control text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                              title={tTask.googleCalendarAlarmBtn}
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSubTask({
                                  trackId: activeTrack.id,
                                  subId: sub.id,
                                  title: sub.title,
                                  points: sub.points || 10,
                                })
                              }
                              className="p-1 rounded-control text-muted hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-caption font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                              +{sub.points || 10} XP
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteProgramSubTask(activeTrack.id, sub.id)}
                              className="p-1 rounded-control text-muted hover:text-rose-500 transition-colors"
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
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1.5 p-1 rounded-control hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'حذف هذا البرنامج' : language === 'en' ? 'Delete this program' : 'Supprimer ce programme'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. GYM TRACK DETAIL */}
            {activeTrack.type === 'gym' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-card bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold">
                    <Dumbbell className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>+40 XP / {language === 'ar' ? 'حصة تدريبية' : language === 'en' ? 'workout logged' : 'séance validée'}</span>
                  </div>
                  <span className="font-bold text-zinc-500 tabular-nums">
                    {(gymLogs ?? []).length} {tTask.workoutHistory || 'séances'}
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleAddGym} className="p-3.5 rounded-card bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-3.5">
                  {/* 1-Click Apple-style Muscle Group Toggle Chips */}
                  <div>
                    <label className="block text-caption font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>{tTask.muscleGroups} *</span>
                      {selectedGymMuscles.length > 0 && (
                        <span className="text-caption text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                          {selectedGymMuscles.length} {language === 'ar' ? 'محددة' : language === 'en' ? 'selected' : 'sélectionné(s)'}
                        </span>
                      )}
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {GYM_CHIPS.map((chip) => {
                        const isSelected = selectedGymMuscles.includes(chip);
                        const chipMeta = GYM_CHIP_LABELS[chip];
                        const label = chipMeta?.[language] || chip;
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => toggleMuscleChip(chip)}
                            className={`px-2.5 py-2 rounded-control text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs scale-[1.02]'
                                : 'bg-surface text-content border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span>{chipMeta?.icon || '💪'}</span>
                            <span className="truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Optional Exercise Details Textarea */}
                    <div>
                      <label className="block text-caption font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                        {tTask.exercisesLabel} ({language === 'ar' ? 'اختياري' : language === 'en' ? 'optional' : 'optionnel'})
                      </label>
                      <textarea
                        rows={2}
                        value={gymExercises}
                        onChange={(e) => setGymExercises(e.target.value)}
                        placeholder={tTask.exercisesPlaceholder || (language === 'ar' ? 'تفاصيل التمارين والأوزان...' : language === 'en' ? 'Workout details, sets and weights...' : 'Détails des exercices, séries et charges...')}
                        className="w-full px-3 py-2 rounded-control bg-surface border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    {/* Tomorrow's Plan */}
                    <div>
                      <label className="block text-caption font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                        {tTask.tomorrowPlan} ({language === 'ar' ? 'اختياري' : language === 'en' ? 'optional' : 'optionnel'})
                      </label>
                      <textarea
                        rows={2}
                        value={gymTomorrowPlan}
                        onChange={(e) => setGymTomorrowPlan(e.target.value)}
                        placeholder={tTask.tomorrowPlaceholder || (language === 'ar' ? 'خطة تمرين الغد...' : language === 'en' ? 'Plan for tomorrow...' : 'Programme pour demain...')}
                        className="w-full px-3 py-2 rounded-control bg-surface border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button type="submit" variant="primary" size="sm" icon={<Dumbbell className="w-3.5 h-3.5" />}>
                      <span>{tTask.addWorkoutBtn}</span>
                    </Button>
                  </div>
                </form>

                {/* Workout History */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(gymLogs ?? []).length === 0 ? (
                    <p className="text-xs text-muted italic py-2 text-center">
                      {tTask.noWorkoutsYet}
                    </p>
                  ) : (
                    (gymLogs ?? []).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-control bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-content truncate">
                              {log.muscleGroups}
                            </span>
                            <span className="text-caption text-muted font-mono shrink-0">
                              {log.date}
                            </span>
                          </div>
                          {log.exercises && (
                            <p className="text-caption text-muted truncate">
                              {log.exercises}
                            </p>
                          )}
                          {log.tomorrowPlan && (
                            <p className="text-caption text-rose-600 dark:text-rose-400 font-medium">
                              ➜ {log.tomorrowPlan}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setAlarmModalTaskTitle(`Séance Gym: ${log.muscleGroups}`);
                              setAlarmModalDescription(log.tomorrowPlan ? `Plan: ${log.tomorrowPlan}` : 'Séance de musculation');
                            }}
                            className="p-1 rounded-control text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            title={language === 'ar' ? 'تذكير عبر تقويم جوجل' : language === 'en' ? 'Add Google Calendar reminder' : 'Ajouter un rappel Google Calendar'}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-caption font-bold text-rose-600 dark:text-rose-400">
                            +40 XP
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteGymLog(log.id)}
                            className="p-1 rounded-control text-muted hover:text-rose-500 transition-colors"
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
                <div className="p-3.5 rounded-card bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold">
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>+30 XP / {language === 'ar' ? 'وحدة دراسية' : language === 'en' ? 'module completed' : 'module terminé'}</span>
                  </div>
                  <span className="font-bold text-zinc-500 tabular-nums">
                    {(studyModules ?? []).filter((m) => m.completed).length} / {(studyModules ?? []).length}
                  </span>
                </div>

                {/* 1-Click Apple-style Economics & Management S3 Modules Chips */}
                <div>
                  <label className="block text-caption font-bold text-zinc-600 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>{language === 'ar' ? 'وحدات الاقتصاد والتدبير (S3)' : language === 'en' ? 'Economics & Management (S3) Modules' : 'Modules Économie & Gestion (S3)'}</span>
                    <span className="text-caption text-indigo-600 dark:text-indigo-400 font-semibold">{language === 'ar' ? 'إضافة سريعة بنقرة واحدة' : language === 'en' ? 'Quick add in one click' : 'Ajout rapide en un clic'}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                    {ECONOMICS_S3_MODULES.map((modName) => {
                      const isAlreadyAdded = (studyModules || []).some(
                        (m) => m.title.toLowerCase() === modName.toLowerCase()
                      );
                      return (
                        <button
                          key={modName}
                          type="button"
                          onClick={() => handleQuickAddEconomicsModule(modName)}
                          className={`px-2.5 py-1.5 rounded-control text-xs font-semibold flex items-center gap-1.5 transition-all text-left rtl:text-right border ${
                            isAlreadyAdded
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-2xs'
                              : 'bg-white dark:bg-zinc-800/80 text-content border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300'
                          }`}
                        >
                          <span className="text-indigo-500 font-bold shrink-0">{isAlreadyAdded ? '✓' : '+'}</span>
                          <span className="truncate">{modName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add Module Form */}
                <form onSubmit={handleAddModule} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder={tTask.modulePlaceholder || 'Nom du module ou matière...'}
                    className="flex-1 px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={moduleSubject}
                    onChange={(e) => setModuleSubject(e.target.value)}
                    placeholder={tTask.subjectPlaceholder || 'Discipline (optionnel)...'}
                    className="sm:w-44 px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    <span>{tCommon.confirm}</span>
                  </Button>
                </form>

                {/* Modules List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(studyModules ?? []).length === 0 ? (
                    <p className="text-xs text-muted italic py-2 text-center">
                      {language === 'ar' ? 'لا توجد وحدات دراسية مسجلة حالياً.' : language === 'en' ? 'No modules yet.' : 'Aucun module pour le moment.'}
                    </p>
                  ) : (
                    (studyModules ?? []).map((mod) => (
                      <div
                        key={mod.id}
                        className={`flex items-center justify-between p-3 rounded-card border transition-all ${
                          mod.completed
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-muted dark:text-zinc-500'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-content'
                        }`}
                      >
                        <div
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          onClick={() => setEditingStudyModule(mod)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStudyModule(mod.id);
                            }}
                            className={`w-6 h-6 rounded-control flex items-center justify-center transition-all shrink-0 ${
                              mod.completed
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-transparent hover:text-muted'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <div className="truncate">
                            <span className={`text-xs font-bold block hover:underline ${mod.completed ? 'line-through text-muted' : ''}`}>
                              {mod.title}
                            </span>
                            {mod.subject && (
                              <span className="text-caption text-muted font-medium">
                                {mod.subject}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setAlarmModalTaskTitle(`Révision: ${mod.title}${mod.subject ? ` (${mod.subject})` : ''}`);
                              setAlarmModalDescription(`Session de révision S3: ${mod.title}`);
                            }}
                            className="p-1 rounded-control text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                            title={tTask.googleCalendarAlarmBtn}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudyModule(mod)}
                            className="p-1 rounded-control text-muted hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-caption font-bold text-indigo-600 dark:text-indigo-400">
                            +30 XP
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteStudyModule(mod.id)}
                            className="p-1 rounded-control text-muted hover:text-rose-500 transition-colors"
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
        title={tTask.addProgram}
        subtitle={
          language === 'ar'
            ? 'إنشاء مسار جديد وتتبع مهاراتك اليومية'
            : 'Créez un nouveau track de compétences ou habitudes'
        }
      >
        <form onSubmit={handleCreateProgramTrack} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-content mb-1.5">
              {tTask.programName || 'Nom du programme'} *
            </label>
            <input
              type="text"
              required
              value={newTrackTitle}
              onChange={(e) => setNewTrackTitle(e.target.value)}
              placeholder="ex : Deutsch (Allemand), Marketing, UI/UX..."
              className="w-full px-3.5 py-2.5 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {language === 'ar' ? 'أيقونة' : language === 'en' ? 'Icon / Emoji' : 'Icône / Emoji'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {['🎯', '🚀', '🧠', '💼', '🎨', '📖'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewTrackIcon(emoji)}
                    className={`w-9 h-9 rounded-control flex items-center justify-center text-lg border transition-all ${
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
              <label className="block text-xs font-bold text-content mb-1.5">
                {language === 'ar' ? 'لون' : language === 'en' ? 'Color' : 'Couleur'}
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

      {/* ── PROGRAM SUBTASK DETAIL / EDIT MODAL ── */}
      <Modal
        isOpen={Boolean(editingSubTask)}
        onClose={() => setEditingSubTask(null)}
        title={language === 'ar' ? 'تفاصيل المهمة الفرعية' : language === 'en' ? 'Sub-task Details' : 'Détails de la sous-tâche'}
        subtitle={activeTrack ? getProgramTrackTitle(activeTrack, language) : undefined}
      >
        {editingSubTask && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingSubTask.title.trim()) return;
              updateProgramSubTask(editingSubTask.trackId, editingSubTask.subId, {
                title: editingSubTask.title.trim(),
                points: Number(editingSubTask.points) || 10,
              });
              setEditingSubTask(null);
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {language === 'ar' ? 'عنوان المهمة الفرعية' : language === 'en' ? 'Sub-task Title' : 'Titre de la sous-tâche'} *
              </label>
              <input
                type="text"
                required
                value={editingSubTask.title}
                onChange={(e) => setEditingSubTask({ ...editingSubTask, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {language === 'ar' ? 'نقاط الخبرة (XP)' : language === 'en' ? 'Experience points (XP)' : 'Points XP'}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={editingSubTask.points}
                onChange={(e) => setEditingSubTask({ ...editingSubTask, points: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Prominent Action Button: Add Alarm via Google Calendar */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const trackTitle = activeTrack ? getProgramTrackTitle(activeTrack, language) : 'Programme';
                  setAlarmModalTaskTitle(`${trackTitle}: ${editingSubTask.title}`);
                  setAlarmModalDescription(`Rappel pour ${editingSubTask.title}`);
                }}
                className="w-full py-2.5 px-4 rounded-control bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>{tTask.googleCalendarAlarmBtn}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="ghost" onClick={() => setEditingSubTask(null)}>
                {tTask.cancel}
              </Button>
              <Button type="submit" variant="primary">
                {tTask.save}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── STUDY MODULE DETAIL / EDIT MODAL ── */}
      <Modal
        isOpen={Boolean(editingStudyModule)}
        onClose={() => setEditingStudyModule(null)}
        title={language === 'ar' ? 'تفاصيل الوحدة الدراسية' : language === 'en' ? 'Study Module Details' : 'Détails du module d’étude'}
        subtitle="Économie & Gestion (S3)"
      >
        {editingStudyModule && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingStudyModule.title.trim()) return;
              updateStudyModule(editingStudyModule.id, {
                title: editingStudyModule.title.trim(),
                subject: editingStudyModule.subject?.trim() || undefined,
              });
              setEditingStudyModule(null);
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTask.modulePlaceholder || 'Nom du module'} *
              </label>
              <input
                type="text"
                required
                value={editingStudyModule.title}
                onChange={(e) => setEditingStudyModule({ ...editingStudyModule, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTask.subjectPlaceholder || 'Discipline'}
              </label>
              <input
                type="text"
                value={editingStudyModule.subject || ''}
                onChange={(e) => setEditingStudyModule({ ...editingStudyModule, subject: e.target.value })}
                className="w-full px-3.5 py-2 rounded-control bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Prominent Action Button: Add Alarm via Google Calendar */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setAlarmModalTaskTitle(`Révision: ${editingStudyModule.title}${editingStudyModule.subject ? ` (${editingStudyModule.subject})` : ''}`);
                  setAlarmModalDescription(`Session de révision S3: ${editingStudyModule.title}`);
                }}
                className="w-full py-2.5 px-4 rounded-control bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>{tTask.googleCalendarAlarmBtn}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="ghost" onClick={() => setEditingStudyModule(null)}>
                {tTask.cancel}
              </Button>
              <Button type="submit" variant="primary">
                {tTask.save}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── STANDALONE GOOGLE CALENDAR ALARM MODAL ── */}
      {alarmModalTaskTitle && (
        <GoogleCalendarAlarmModal
          isOpen={Boolean(alarmModalTaskTitle)}
          onClose={() => setAlarmModalTaskTitle(null)}
          taskTitle={alarmModalTaskTitle}
          taskDescription={alarmModalDescription}
          defaultDate={taskScheduledDate || selectedDate || todayStr}
        />
      )}
    </div>
  );
};
