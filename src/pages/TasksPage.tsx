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
import { GlassMonthPicker } from '../components/common/GlassMonthPicker';
import confetti from 'canvas-confetti';
import { useMotionMode, useMotionPrefs } from '../motion/useMotionPrefs';
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

import { getCurrentMonthStr, formatDate } from '../utils/formatters';

const CATEGORY_CONFIG: Record<
  TaskCategory,
  { fr: string; ar: string; en: string; icon: string; color: string; bg: string; border: string }
> = {
  routine: {
    fr: 'Routine',
    ar: 'روتين',
    en: 'Routine',
    icon: '⚡',
    color: 'text-warning dark:text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  deen: {
    fr: 'Deen & Spiritualité',
    ar: 'دين وصلاة',
    en: 'Faith & Prayer',
    icon: '🕌',
    color: 'text-positive dark:text-positive',
    bg: 'bg-positive/10',
    border: 'border-positive/20',
  },
  sport: {
    fr: 'Sport & Santé',
    ar: 'رياضة وصحة',
    en: 'Sport & Fitness',
    icon: '🏋️',
    color: 'text-negative dark:text-negative',
    bg: 'bg-negative/10',
    border: 'border-negative/20',
  },
  work: {
    fr: 'Travail & Études',
    ar: 'عمل ودراسة',
    en: 'Work & Career',
    icon: '💻',
    color: 'text-info dark:text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  study: {
    fr: 'Apprentissage',
    ar: 'تعلّم',
    en: 'Learning & Reading',
    icon: '📚',
    color: 'text-accent dark:text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  finance: {
    fr: 'Finances',
    ar: 'مالية',
    en: 'Personal Finance',
    icon: '💰',
    color: 'text-info dark:text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  health: {
    fr: 'Bien-être & Eau',
    ar: 'صحة وماء',
    en: 'Health & Hydration',
    icon: '💧',
    color: 'text-info dark:text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  discipline: {
    fr: 'Discipline & Sobriété',
    ar: 'انضباط ووعي',
    en: 'Focus & Discipline',
    icon: '🛡️',
    color: 'text-accent dark:text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  running: {
    fr: 'Course / Jri',
    ar: 'جري',
    en: 'Running',
    icon: '🏃',
    color: 'text-warning dark:text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  other: {
    fr: 'Autre',
    ar: 'أخرى',
    en: 'Other',
    icon: '📌',
    color: 'text-muted dark:text-muted',
    bg: 'bg-surface-2/10',
    border: 'border-border/20',
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
  Chest: { ar: 'الصدر', fr: 'Pectoraux', en: 'Chest', icon: '🫁' },
  Back: { ar: 'الظهر', fr: 'Dos', en: 'Back', icon: '🥋' },
  Arms: { ar: 'الذراعان', fr: 'Bras', en: 'Arms', icon: '💪' },
  Shoulders: { ar: 'الأكتاف', fr: 'Épaules', en: 'Shoulders', icon: '🦾' },
  Legs: { ar: 'الساقان', fr: 'Jambes', en: 'Legs', icon: '🦵' },
  Push: { ar: 'تمارين الدفع', fr: 'Poussée', en: 'Push', icon: '⚡' },
  Pull: { ar: 'تمارين السحب', fr: 'Tirage', en: 'Pull', icon: '🔥' },
  Core: { ar: 'عضلات الجذع', fr: 'Abdominaux', en: 'Core', icon: '🎯' },
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
  actionsLabel: string;
}

const TaskActionDropdown: React.FC<TaskActionDropdownProps> = ({
  task,
  onAlarm,
  onEdit,
  onDelete,
  alarmLabel,
  editLabel,
  deleteLabel,
  actionsLabel,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={actionsLabel}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-muted hover:text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      >
        <span className="text-base leading-none">⋯</span>
      </button>

      <DropdownPortal
        isOpen={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        align="end"
        minWidth={176}
        className="w-48 rounded-card border border-border-subtle bg-surface p-1.5 shadow-xl"
      >
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onAlarm();
            }}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-start text-xs text-content hover:bg-surface/[0.06] cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="truncate">{alarmLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-start text-xs text-content hover:bg-surface/[0.06] cursor-pointer"
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
          className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-start text-xs text-negative hover:bg-negative/10 cursor-pointer"
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
  const tTaskPage = translations[language].tasksPage;
  const tCommon = translations[language].common;
  const motionMode = useMotionMode();
  const reducedMotion = useMotionPrefs();
  const celebrate = (particleCount: number, spread: number, y: number) => {
    if (reducedMotion || motionMode !== 'full') return;
    confetti({ particleCount, spread, origin: { y }, disableForReducedMotion: true });
  };

  const [todayStr, setTodayStr] = useState(() => formatISODate(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'daily' | 'month' | 'stats'>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [inlineSubTaskInput, setInlineSubTaskInput] = useState<Record<string, string>>({});
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<{ dateStr: string; count: number } | null>(null);
  const [selectedMatrixMonth, setSelectedMatrixMonth] = useState<string>(getCurrentMonthStr());
  const [matrixDayDetail, setMatrixDayDetail] = useState<string | null>(null);

  // Month options for Matrix month picker
  const matrixMonthOptions = useMemo(() => {
    const months = new Set(
      (tasks || [])
        .map((task) => task.createdAt.slice(0, 7))
        .filter((month) => /^\d{4}-\d{2}$/.test(month))
    );
    months.add(getCurrentMonthStr());
    const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .map((month) => ({
        value: month,
        label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
          new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
        ),
      }));
  }, [tasks, language]);

  // Drill-down Modal State for Program Tracks
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackIcon, setNewTrackIcon] = useState('🎯');
  const [newTrackColor, setNewTrackColor] = useState('bg-info');
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
      return tTaskPage.today;
    }
    if (dateStr === tomorrow) {
      return tTaskPage.tomorrow;
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
      ...(hasCoding ? [tTaskPage.codingDevelopmentSuggestion] : []),
      ...(hasStudy ? [tTaskPage.studyEnglishSuggestion] : []),
    ];
  }, [tasks, tTaskPage.codingDevelopmentSuggestion, tTaskPage.studyEnglishSuggestion]);

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

  // ── Monthly Habit Tracking Matrix Computations ──
  const matrixHabits = useMemo(() => {
    const habits: {
      id: string;
      label: string;
      icon: string;
      completedDates: string[];
      subtasks?: { completedDates?: string[] }[];
    }[] = [];

    // Add each task as a habit row
    (tasks || []).forEach((task) => {
      if (!task.isArchived) {
        habits.push({
          id: task.id,
          label: task.title,
          icon: CATEGORY_CONFIG[task.category]?.icon || '⚡',
          completedDates: task.completedDates || [],
          subtasks: (task.subtasks || []).map((sub) => ({
            completedDates: (sub as any).completedDates,
          })),
        });
      }
    });

    // Add Salat as a habit row if any salat logs exist
    const hasSalat = Object.values(salatLogs || {}).some((p) => (p || []).length > 0);
    if (hasSalat) {
      const salatCompletedDates = Object.entries(salatLogs || {})
        .filter(([_, prayers]) => (prayers || []).length === 5)
        .map(([date]) => date);
      habits.push({
        id: 'salat',
        label: tTaskPage.salatFivePrayers,
        icon: '🕌',
        completedDates: salatCompletedDates,
      });
    }

    // Add Gym as a habit row if any gym logs exist
    const hasGym = (gymLogs || []).length > 0;
    if (hasGym) {
      const gymCompletedDates = (gymLogs || []).map((g) => g.date).filter(Boolean) as string[];
      habits.push({
        id: 'gym',
        label: tTaskPage.sportLabel,
        icon: '🏋️',
        completedDates: gymCompletedDates,
      });
    }

    // Add Program Tracks as habit rows
    (programTracks || []).forEach((track) => {
      const trackCompletedDates = new Set<string>();
      (track.subtasks || []).forEach((sub) => {
        (sub.completedDates || []).forEach((d) => trackCompletedDates.add(d));
      });
      if (trackCompletedDates.size > 0) {
        habits.push({
          id: `track_${track.id}`,
          label: track.title,
          icon: track.icon,
          completedDates: Array.from(trackCompletedDates),
          subtasks: (track.subtasks || []).map((sub) => ({
            completedDates: sub.completedDates,
          })),
        });
      }
    });

    // Add Study modules as habit rows
    (studyModules || []).forEach((mod) => {
      if (mod.completed) {
        habits.push({
          id: `study_${mod.id}`,
          label: mod.title,
          icon: '📚',
          completedDates: mod.completedAt ? [mod.completedAt.slice(0, 10)] : [],
        });
      }
    });

    return habits;
  }, [tasks, salatLogs, gymLogs, programTracks, studyModules, language]);

  const matrixDaysInMonth = useMemo(() => {
    const [year, month] = selectedMatrixMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMatrixMonth]);

  const matrixDayTasks = useMemo(() => {
    const byDate: Record<string, Record<string, any[]>> = {};
    // Tasks
    (tasks || []).forEach((task) => {
      if (task.isArchived) return;
      (task.completedDates || []).forEach((d) => {
        if (d.startsWith(selectedMatrixMonth)) {
          if (!byDate[d]) byDate[d] = {};
          if (!byDate[d][task.id]) byDate[d][task.id] = [];
          byDate[d][task.id].push({ id: task.id, title: task.title, categoryLabel: CATEGORY_CONFIG[task.category]?.[language] || task.category, completed: true });
        }
      });
      // Also include scheduled but not completed for the day
      const daysInMonth = matrixDaysInMonth;
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedMatrixMonth}-${String(day).padStart(2, '0')}`;
        if (isScheduledOnDate(task, dateStr) && !(task.completedDates || []).includes(dateStr)) {
          if (!byDate[dateStr]) byDate[dateStr] = {};
          if (!byDate[dateStr][task.id]) byDate[dateStr][task.id] = [];
          byDate[dateStr][task.id].push({ id: task.id, title: task.title, categoryLabel: CATEGORY_CONFIG[task.category]?.[language] || task.category, completed: false });
        }
      }
    });
    // Salat
    Object.entries(salatLogs || {}).forEach(([dateStr, prayers]) => {
      if (dateStr.startsWith(selectedMatrixMonth)) {
        if (!byDate[dateStr]) byDate[dateStr] = {};
        const completed = (prayers || []).length === 5;
        byDate[dateStr].salat = [{
          id: 'salat',
          title: tTaskPage.salatFivePrayers,
          categoryLabel: tTaskPage.salatCategory,
          completed,
        }];
      }
    });
    // Gym
    (gymLogs || []).forEach((g) => {
      if (g.date && g.date.startsWith(selectedMatrixMonth)) {
        if (!byDate[g.date]) byDate[g.date] = {};
        byDate[g.date].gym = [{
          id: 'gym',
          title: tTaskPage.sportLabel,
          categoryLabel: tTaskPage.sportCategory,
          completed: true,
        }];
      }
    });
    // Program track subtasks
    (programTracks || []).forEach((track) => {
      (track.subtasks || []).forEach((sub) => {
        (sub.completedDates || []).forEach((d) => {
          if (d.startsWith(selectedMatrixMonth)) {
            if (!byDate[d]) byDate[d] = {};
            const trackId = `track_${track.id}`;
            if (!byDate[d][trackId]) byDate[d][trackId] = [];
            byDate[d][trackId].push({
              id: sub.id,
              title: sub.title,
              categoryLabel: track.title,
              completed: true,
            });
          }
        });
      });
    });
    // Study modules
    (studyModules || []).forEach((mod) => {
      if (mod.completed && mod.completedAt && mod.completedAt.startsWith(selectedMatrixMonth)) {
        const dateStr = mod.completedAt.slice(0, 10);
        if (!byDate[dateStr]) byDate[dateStr] = {};
        byDate[dateStr][`study_${mod.id}`] = [{
          id: mod.id,
          title: mod.title,
          categoryLabel: tTaskPage.studyCategory,
          completed: true,
        }];
      }
    });
    // Flatten to array per date
    const result: Record<string, any[]> = {};
    Object.entries(byDate).forEach(([dateStr, byHabit]) => {
      result[dateStr] = Object.values(byHabit).flat();
    });
    return result;
  }, [tasks, salatLogs, gymLogs, programTracks, studyModules, selectedMatrixMonth, matrixDaysInMonth, language]);

  const matrixStats = useMemo(() => {
    let completedTotal = 0;
    let taskDaysTotal = 0;
    Object.values(matrixDayTasks).forEach((dayTasks) => {
      dayTasks.forEach((t) => {
        taskDaysTotal++;
        if (t.completed) completedTotal++;
      });
    });
    return { completedTotal, taskDaysTotal };
  }, [matrixDayTasks]);

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
      celebrate(80, 70, 0.6);
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
        message: tTaskPage.moduleAdded.replace('{moduleName}', moduleName),
      });
      return;
    }
    addStudyModule(moduleName, 'Économie & Gestion (S3)');
    showToast({
      message: tTaskPage.moduleAdded.replace('{moduleName}', moduleName),
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
        message: tTaskPage.workoutLogged,
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
    celebrate(50, 60, 0.7);
  };

  const handleToggle = (taskId: string) => {
    toggleTaskCompletion(taskId, selectedDate);
    const task = tasks.find((t) => t.id === taskId);
    const wasCompleted = (task?.completedDates || []).includes(selectedDate);

    // If completing the task and reaching 100% for today, burst confetti
    if (!wasCompleted && dailyStats.completed + 1 === dailyStats.total && dailyStats.total > 0) {
      celebrate(60, 60, 0.8);
    }
  };

  const getQuickChips = (task: TaskItem): string[] => {
    const title = (task.title || '').toLowerCase();
    if (title.includes('salat') || title.includes('prayer') || title.includes('صلاة')) {
      return [tTaskPage.salatFivePrayers];
    }
    if (title.includes('gym') || title.includes('workout') || title.includes('تدريب') || title.includes('رياضة')) {
      return [tTaskPage.sportLabel];
    }
    if (title.includes('english') || title.includes('study') || title.includes('دراسة') || title.includes('لغة')) {
      return [tTaskPage.quickSuggestions];
    }
    if (title.includes('code') || title.includes('program') || title.includes('تطوير') || title.includes('برمجة')) {
      return [tTaskPage.moduleDetails];
    }
    return [tTaskPage.planTomorrow];
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
      celebrate(70, 60, 0.6);
      showToast({
        message: tTaskPage.completed,
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
      celebrate(40, 50, 0.7);
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
      <div className="max-w-[1200px] mx-auto space-y-5 animate-page pb-20 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-content tracking-tight">
              {tTask.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-caption font-semibold bg-positive/15 text-positive border border-positive/20">
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

      {duplicateSuggestions.length > 0 && (
        <p className="rounded-control border border-border-subtle bg-surface-raised px-3.5 py-3 text-xs leading-relaxed text-muted">
          {tTaskPage.relatedTasksHint.replace('{tasks}', duplicateSuggestions.join(' · '))}
        </p>
      )}

      {/* Unified Gamified Command HUD (2-Column Bento Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
        {/* Left Column: Progress %, XP & Streak Strip */}
        <div className="rounded-card border border-border-subtle bg-surface p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>{tTask.todayProgress}</span>
              <span>•</span>
              <span className="font-medium text-muted tabular-nums">
                {getScheduleDateLabel(selectedDate)}
              </span>
            </div>

            <span className="text-xs font-semibold text-content bg-surface-raised border border-border-subtle px-2.5 py-1 rounded-full tabular-nums">
              {dailyStats.completed} / {dailyStats.total} {tTask.completedDays}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-content tabular-nums">
                {dailyStats.percentage}%
              </span>
              <span className="text-xs text-muted">
                {dailyStats.percentage === 100
                  ? (tTaskPage.allTasksDone)
                  : `${dailyStats.total - dailyStats.completed} ${tTaskPage.tasksRemaining}`}
              </span>
            </div>

            <div className="w-full h-2.5 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
                style={{ width: `${dailyStats.percentage}%` }}
              />
            </div>
          </div>

          {/* Gamified metric chips */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border-subtle text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-content bg-surface-raised border border-border-subtle px-2.5 py-1 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-warning" />
              <span>{tTaskPage.levelLabel} {gamificationStats.level} · {gamificationStats.totalXP} {tTask.xpPoints}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-muted bg-surface/[0.03] px-2 py-1 rounded-full">
              {gamificationStats.progressPercent}% {tTask.xpNextLevel}
            </span>

            {overallStreak > 0 && (
              <span className="inline-flex items-center gap-1 font-bold text-warning bg-warning/10 border border-warning/20 px-2 py-1 rounded-full tabular-nums">
                <Flame className="w-3.5 h-3.5 text-warning" />
                <span>{overallStreak} {tTask.streakDays}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-positive bg-positive/10 px-2 py-1 rounded-full tabular-nums">
              <TrendingUp className="w-3.5 h-3.5 text-positive" />
              <span>{tTask.monthAverage} {monthStats.rate}%</span>
            </span>
          </div>
        </div>

        {/* Right Column: 7-Day Week Selector with Glowing Indigo Active Day Pill */}
        <div className="rounded-card border border-border-subtle bg-surface p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-border/[0.06]">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              {tTaskPage.weekSchedule}
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
                className="p-1 rounded-lg text-muted hover:text-accent-contrast hover:bg-surface/[0.06] transition-colors cursor-pointer"
                title={tTaskPage.previousDay}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                title={selectedDate !== todayStr ? (tTaskPage.jumpToToday) : undefined}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize transition-colors ${
                  selectedDate === todayStr
                    ? 'text-accent bg-accent/10'
                    : 'text-muted hover:text-accent-contrast bg-surface/[0.06] hover:bg-surface/[0.12] cursor-pointer'
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
                className="p-1 rounded-lg text-muted hover:text-accent-contrast hover:bg-surface/[0.06] transition-colors cursor-pointer"
                title={tTaskPage.nextDay}
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
                      ? 'bg-accent/10 text-accent font-bold border border-accent/30'
                      : 'bg-canvas hover:bg-surface-raised text-muted hover:text-content border border-border-subtle'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {item.dayName}
                  </span>
                  <span className="text-sm font-bold mt-0.5 tabular-nums">
                    {item.dayNum}
                  </span>
                  <span className={`mt-1 text-[8px] font-semibold tabular-nums ${isSelected ? 'text-accent-contrast/85' : 'text-muted'}`}>
                    {item.taskCount > 0
                      ? `${item.completedCount}/${item.taskCount}`
                      : tTaskPage.rest}
                  </span>
                  {item.isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-warning' : 'bg-accent'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-muted text-center pt-1 border-t border-border/[0.06]">
            {tTaskPage.selectDayTasks}
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
                ? 'bg-surface text-text font-bold shadow-xs'
                : 'text-muted hover:text-accent-contrast hover:bg-surface/[0.06]'
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
                ? 'bg-surface text-text font-bold shadow-xs'
                : 'text-muted hover:text-accent-contrast hover:bg-surface/[0.06]'
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
                ? 'bg-surface text-text font-bold shadow-xs'
                : 'text-muted hover:text-accent-contrast hover:bg-surface/[0.06]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{tTask.statsTab}</span>
          </button>
        </div>

        {/* Right: Custom Glass Task Category Popover (No horizontal scrollbar) - hidden when Analytics/stats tab is active */}
        {activeTab !== 'stats' && (
        <div className="relative inline-block shrink-0">
          <button
            ref={taskCategoryDropdownTriggerRef}
            type="button"
            aria-expanded={isTaskCategoryDropdownOpen}
            onClick={() => setIsTaskCategoryDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-border/[0.08] bg-canvas/40 px-3.5 py-1.5 text-xs font-semibold text-text outline-none shadow-xs hover:border-border/[0.18] hover:bg-surface/[0.04] transition-all cursor-pointer"
          >
            {selectedCategory !== 'all' && CATEGORY_CONFIG[selectedCategory as TaskCategory] ? (
              <span>{CATEGORY_CONFIG[selectedCategory as TaskCategory].icon}</span>
            ) : (
              <ListTodo className="w-3.5 h-3.5 text-accent shrink-0" />
            )}
            <span className="truncate max-w-[130px]">
              {selectedCategory === 'all'
                ? `${tTask.all} (${tasks.length})`
                : CATEGORY_CONFIG[selectedCategory as TaskCategory]?.[language] ||
                  CATEGORY_CONFIG[selectedCategory as TaskCategory]?.fr ||
                  selectedCategory}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${
                isTaskCategoryDropdownOpen ? 'rotate-180 text-accent-contrast' : ''
              }`}
            />
          </button>

          <DropdownPortal
            isOpen={isTaskCategoryDropdownOpen}
            onClose={() => setIsTaskCategoryDropdownOpen(false)}
            triggerRef={taskCategoryDropdownTriggerRef}
            align="end"
            minWidth={210}
            className="min-w-[210px] overflow-y-auto no-scrollbar rounded-2xl bg-bg/95 backdrop-blur-2xl border border-border/[0.12] p-1.5 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)]"
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
                    ? 'bg-surface text-text font-bold shadow-xs'
                    : 'text-muted hover:text-accent-contrast hover:bg-surface/[0.06]'
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

              <div className="h-px bg-surface/[0.06] my-1" />

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
                        ? 'bg-surface text-text font-bold shadow-xs'
                        : 'text-muted hover:text-accent-contrast hover:bg-surface/[0.06]'
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
        )}
      </div>

      {/* VIEW 1: DAILY TASKS (CHECK OFF VIEW) */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5 text-accent" />
              <span>{tTask.todayList} ({filteredTasks.length})</span>
            </h3>
            <span className="text-xs text-muted">
              {tTaskPage.expandSubtasks}
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
                        ? 'border-positive/30 bg-[#0B0C12]/95 shadow-[0_0_24px_-6px_rgba(16,185,129,0.2)]'
                        : 'hover:border-border/[0.18]'
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
                          title={isCompleted ? tTaskPage.markIncomplete : tTaskPage.markComplete}
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
                                stroke={isCompleted ? 'var(--positive)' : 'var(--accent)'}
                                  strokeWidth="3"
                                  strokeDasharray="88"
                                  strokeDashoffset={88 - (88 * percent) / 100}
                                  strokeLinecap="round"
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-positive stroke-[2.5]" />
                                ) : (
                                  <span className="text-[10px] font-bold text-accent tabular-nums">
                                    {completedCount}/{subtasksCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : isCompleted ? (
                            <div className="w-9 h-9 rounded-full bg-positive/20 text-positive border border-positive/40 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.4)]">
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-surface/[0.03] text-muted border border-border/[0.12] hover:border-border/[0.25] flex items-center justify-center">
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
                                    ? 'bg-positive/15 text-positive border-positive/25'
                                    : 'bg-accent/15 text-accent border-accent/25'
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
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full tabular-nums">
                                🔥 {streak} j
                              </span>
                            )}

                            {Boolean(task.scheduledTime && task.scheduledTime.trim() !== '') && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full tabular-nums">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{task.scheduledTime}</span>
                                {task.addToGoogleCalendar && <Bell className="w-2.5 h-2.5 text-accent animate-pulse" />}
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
                          className="p-1.5 rounded-lg text-muted hover:text-accent-contrast transition-colors"
                          aria-label={isExpanded ? tTaskPage.collapseSubtasks : tTaskPage.expandSubtasks}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-accent" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <TaskActionDropdown
                          task={task}
                          actionsLabel={tTaskPage.taskActions}
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
                          className="mt-4 pt-3.5 border-t border-border/[0.08] space-y-3"
                        >
                          {/* Drawer Header & Mini Progress Bar */}
                          {hasSubtasks && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted">
                                  {tTaskPage.subTasksProgress}
                                </span>
                                <span className="font-mono text-accent font-bold tabular-nums">
                                  {completedCount} / {subtasksCount} ({percent}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-surface/[0.06] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isCompleted
                                      ? 'bg-positive shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                      : 'bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]'
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
                                      ? 'bg-positive/10 border-positive/20 text-muted'
                                      : 'bg-surface/[0.03] border-border/[0.06] text-text hover:bg-surface/[0.06]'
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
                                          ? 'bg-positive text-accent-contrast shadow-xs'
                                          : 'border border-border/20 hover:border-border/40'
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
                                    className="p-1 text-muted hover:text-negative transition-colors ml-2"
                                    title={tCommon.delete}
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
                              {tTaskPage.quickSuggestions}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {chips.map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => handleAddInlineSubTask(task.id, chip)}
                                  className="rounded-full bg-surface/[0.04] hover:bg-surface/[0.1] border border-border/[0.08] text-xs px-2.5 py-1 text-muted active:scale-95 transition-all"
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
                              placeholder={tTaskPage.addSubTask}
                              className="flex-1 bg-surface/[0.04] border border-border/[0.08] focus:border-accent/60 text-xs px-3.5 py-2 rounded-xl text-accent-contrast placeholder:text-muted outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleAddInlineSubTask(task.id, inlineSubTaskInput[task.id] || '')
                              }
                              className="rounded-xl bg-surface text-text font-semibold px-3 py-2 text-xs hover:bg-surface-2 active:scale-95 transition-all shrink-0"
                            >
                              {tTaskPage.add}
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

      {/* VIEW 2: MONTHLY HABIT TRACKING MATRIX (Habits as rows, days as columns) */}
      {activeTab === 'month' && (
        <div className="zawa-bento p-5 border border-border/[0.08] shadow-2xl space-y-5">
          {/* Header with Month Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-accent-contrast flex items-center gap-2.5 tracking-tight">
                <LayoutGrid className="w-5 h-5 text-positive" />
                <span>
                  {tTaskPage.habitMatrix}
                </span>
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {tTaskPage.weekdayLegend}
              </p>
            </div>

            <GlassMonthPicker
              value={selectedMatrixMonth}
              onChange={setSelectedMatrixMonth}
              options={matrixMonthOptions}
              ariaLabel={tTaskPage.chooseMonth}
            />
          </div>

          {/* Legend & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/[0.06]">
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-positive" />
                <span>{tTaskPage.completed}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-warning/80 border border-warning" />
                <span>{tTaskPage.partial}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-surface/[0.04] border border-border/[0.05]" />
                <span>{tTaskPage.notDone}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted font-mono tabular-nums">
              <span>{matrixStats.completedTotal}/{matrixStats.taskDaysTotal} {tTaskPage.task}</span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full min-w-max border-collapse text-[11px] font-mono">
              <thead>
                <tr className="sticky top-0 bg-canvas/40 backdrop-blur-sm border-b border-border/[0.08]">
                  <th className="sticky left-0 z-10 w-44 sm:w-52 min-w-[160px] sm:min-w-[190px] px-2.5 py-1.5 text-left font-medium text-muted bg-canvas/40 border-r border-border/[0.06]">
                    {tTaskPage.habitTask}
                  </th>
                  {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((day) => {
                    const dateStr = `${selectedMatrixMonth}-${String(day).padStart(2, '0')}`;
                    const dayOfWeek = new Date(Number(selectedMatrixMonth.slice(0,4)), Number(selectedMatrixMonth.slice(5,7)) - 1, day).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isToday = dateStr === todayStr;
                    const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US';
                    const dayNameShort = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(Number(selectedMatrixMonth.slice(0,4)), Number(selectedMatrixMonth.slice(5,7)) - 1, day));
                    return (
                      <th key={dateStr} className={`sticky top-0 w-8 min-w-[36px] px-1 py-1 text-center border-b border-border/[0.08] ${isWeekend ? 'text-muted' : 'text-muted'} ${isToday ? 'text-accent font-bold' : ''}`}>
                        <div className="font-medium text-[10px]">{day}</div>
                        <div className="text-[8px] uppercase opacity-60">{dayNameShort}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrixHabits.map((habit) => (
                  <tr key={habit.id} className="border-b border-border/[0.04] hover:bg-surface/[0.02] transition-colors">
                    <td className="sticky left-0 z-10 w-44 sm:w-52 min-w-[160px] sm:min-w-[190px] px-2.5 py-1.5 text-left font-medium text-text bg-canvas/40 border-r border-border/[0.06] whitespace-normal break-words leading-tight" title={habit.label}>
                      <span className="flex items-center gap-1.5">
                        <span className="shrink-0">{habit.icon}</span>
                        <span className="min-w-0">{habit.label}</span>
                      </span>
                    </td>
                    {Array.from({ length: matrixDaysInMonth }, (_, i) => i + 1).map((day) => {
                      const dateStr = `${selectedMatrixMonth}-${String(day).padStart(2, '0')}`;
                      const dayCompleted = habit.completedDates?.includes(dateStr);
                      const dayPartial = habit.subtasks?.some((sub: any) => sub.completedDates?.includes(dateStr)) && !dayCompleted;
                      const dayTasks = matrixDayTasks[dateStr] || [];
                      const completedCount = dayTasks.filter((t: any) => t.completed).length;
                      const totalCount = dayTasks.length;
                      const isToday = dateStr === todayStr;

                      return (
                        <td key={dateStr} className="w-8 min-w-[36px] px-1 py-1 text-center relative">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic(40);
                              setMatrixDayDetail(dateStr);
                            }}
                            onMouseEnter={() => setHoveredHeatmapDay({ dateStr, count: completedCount })}
                            onMouseLeave={() => setHoveredHeatmapDay(null)}
                            className={`w-full h-full rounded transition-all cursor-pointer ${dayCompleted
                              ? 'bg-positive text-accent-contrast font-bold shadow-[0_0_6px_rgba(52,211,153,0.4)]'
                              : dayPartial
                              ? 'bg-warning/80 border border-warning text-accent-contrast'
                              : 'bg-surface/[0.04] border border-border/[0.05] text-muted'} ${isToday ? 'ring-2 ring-ring ring-offset-1 ring-offset-canvas' : ''}`}
                            title={totalCount > 0
                              ? `${formatDate(dateStr, language)}: ${dayTasks.map((t: any) => t.title).join(', ')} (${completedCount}/${totalCount} ${tTaskPage.completed})`
                              : `${formatDate(dateStr, language)}: ${tTaskPage.noTasks}`}
                          >
                            {dayCompleted ? (
                              <Check className="w-3.5 h-3.5 mx-auto stroke-[2.5]" />
                            ) : dayPartial ? (
                              <div className="w-2 h-2 rounded-full bg-surface mx-auto" />
                            ) : (
                              <span className="text-[9px]">{day}</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inline Day Detail Panel */}
          {matrixDayDetail && (
            <div className="animate-in slide-in-from-bottom-2 duration-200 p-4 bg-surface/[0.03] border border-border/[0.08] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-accent-contrast flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>{formatDate(matrixDayDetail, language)}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setMatrixDayDetail(null)}
                  className="p-1 text-muted hover:text-accent-contrast transition-colors"
                  aria-label={tTaskPage.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {matrixDayTasks[matrixDayDetail]?.length > 0 ? (
                <div className="space-y-2">
                  {matrixDayTasks[matrixDayDetail]?.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface/[0.02] border border-border/[0.06]">
                      <div className="flex items-center gap-2.5">
                        <span className={task.completed ? 'text-positive' : 'text-muted'}>
                          {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-text">{task.title}</div>
                          <div className="text-[11px] text-muted">{task.categoryLabel}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-muted">
                        {task.completed
                          ? (tTaskPage.completed)
                          : (tTaskPage.pending)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-2">
                  {tTaskPage.noTasksScheduled}
                </p>
              )}
            </div>
          )}

          {/* Bottom Legend (weekday names) */}
          <div className="pt-2 border-t border-border/[0.06] text-xs">
            <div className="flex items-center gap-2 text-muted flex-wrap">
              <span className="font-medium">{tTaskPage.weekdays}</span>
              {tTaskPage.weekdayNames.map((d, i) => (
                <span key={d} className={`px-2 py-0.5 rounded text-[10px] font-mono ${i >= 5 ? 'text-warning' : 'text-muted'} bg-surface/[0.03] border border-border/[0.05]`}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STATS & EVALUATIONS */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="zawa-bento p-5 border border-border/[0.08] shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-accent-contrast flex items-center gap-2 tracking-tight">
              <Award className="w-5 h-5 text-warning" />
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
                      <span className="text-text">{task.title}</span>
                      <span className="text-positive font-mono tabular-nums">
                        {completedInMonth} / {monthDaysCount} j ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-positive to-info rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
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
              <Zap className="w-5 h-5 text-warning" />
              <span>{tTask.consistencyTips}</span>
            </h3>
            <div className="space-y-3 text-xs text-muted dark:text-muted leading-relaxed">
              <div className="p-4 rounded-card bg-warning/10 border border-warning/20 text-warning dark:text-warning">
                <span className="font-bold block mb-1">🔥 {tTask.consistencyTips}</span>
                {tTask.rule21Days}
              </div>
              <div className="p-4 rounded-card bg-positive/10 border border-positive/20 text-positive dark:text-positive">
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
              className="w-full px-3.5 py-2.5 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content font-medium focus:outline-none focus:ring-2 focus:ring-positive text-sm"
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
                className="w-full px-3 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs focus:outline-none focus:ring-2 focus:ring-positive"
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
                className="w-full px-3 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs focus:outline-none focus:ring-2 focus:ring-positive"
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
                {tTaskPage.chooseRepeatDays}
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
                      className={`min-h-10 rounded-control border text-[10px] font-bold transition-colors ${selected ? 'border-accent bg-accent text-accent-contrast' : 'border-border-subtle bg-canvas text-muted hover:text-content'}`}
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
              className="w-full px-3.5 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-sm focus:outline-none focus:ring-2 focus:ring-positive"
            />
          </div>

          {/* Date & Time Picker */}
          <div className="p-3.5 rounded-card bg-surface-3 dark:bg-surface/60 border border-border/70 dark:border-border/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-content">
              <Clock className="w-4 h-4 text-info" />
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
                  className="w-full min-w-[140px] px-4 py-2 rounded-xl bg-surface border border-border dark:border-border/10 text-content text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="w-full px-3 py-2 rounded-control bg-surface border border-border dark:border-border text-content text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Direct Instant Action Button: Add Alarm via Google Calendar */}
            <div className="pt-2 border-t border-border/50 dark:border-border/50 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setAlarmModalTaskTitle(taskTitle || 'Tâche Routine');
                  setAlarmModalDescription(taskNotes || 'Rappel Flouss');
                }}
                className="w-full py-2.5 px-4 rounded-control bg-gradient-to-r from-info to-accent hover:from-info hover:to-accent text-accent-contrast font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>{tTask.googleCalendarAlarmBtn}</span>
              </button>

              {/* Google Calendar Native Phone Alarm Toggle */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-control bg-info/10 text-info dark:text-info flex items-center justify-center shrink-0 mt-0.5">
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
                  <div className="w-10 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer dark:bg-surface peer-checked:after:translate-x-full peer-checked:after:border-border after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-border peer-checked:bg-info shadow-xs"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tTask.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={isCalendarSaving}>
              {isCalendarSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{tTaskPage.calendarSaving}</span>
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
                <div className="p-4 rounded-card bg-positive/10 border border-positive/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-control bg-positive text-accent-contrast flex items-center justify-center font-bold text-lg shadow-xs">
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
                    <span className="text-xs font-black text-positive dark:text-positive block tabular-nums">
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
                            ? 'bg-positive/15 text-positive dark:text-positive border-positive/30 shadow-xs'
                            : 'bg-surface-3 dark:bg-surface/60 text-muted dark:text-muted border-border/60 dark:border-border/60 hover:bg-surface-3 dark:hover:bg-surface'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-control flex items-center justify-center mb-1.5 transition-colors ${
                            isCompleted
                              ? 'bg-positive text-accent-contrast shadow-xs'
                              : 'bg-surface-2/80 dark:bg-surface text-muted'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span className="text-xs font-bold tracking-tight">{prayer.label}</span>
                        <span
                          className={`text-caption mt-0.5 font-bold tabular-nums ${
                            isCompleted ? 'text-positive dark:text-positive' : 'text-muted'
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
                    className="p-3.5 rounded-card bg-gradient-to-r from-positive/20 via-info/15 to-positive/20 border border-positive/30 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <span className="font-bold text-positive dark:text-positive">
                        {tTask.salatCompletedAll}
                      </span>
                    </div>
                    <span className="font-black text-positive dark:text-positive bg-surface px-2 py-0.5 rounded-control shadow-2xs">
                      +250 XP
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* 2. SUBTASKS TRACKS DETAIL (CODING, ENGLISH, CUSTOM) */}
            {(activeTrack.type === 'coding' || activeTrack.type === 'english' || activeTrack.type === 'custom') && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-card bg-info/10 border border-info/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-info dark:text-info font-semibold">
                    <Sparkles className="w-4 h-4 text-info shrink-0" />
                    <span>{tTask.dynamicPointsNotice?.replace('{points}', '10') || '+10 XP par tâche réalisée'}</span>
                  </div>
                  <span className="font-bold text-muted dark:text-muted tabular-nums">
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
                        ? tTaskPage.subTaskPlaceholderCoding
                        : activeTrack.type === 'english'
                        ? tTaskPage.subTaskPlaceholderEnglish
                        : (tTask.subTaskPlaceholder || 'ex : Nouvelle sous-tâche...')
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
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
                              ? 'bg-info/10 border-info/25 text-muted dark:text-muted'
                              : 'bg-surface-3 dark:bg-surface/60 border-border/60 dark:border-border/60 text-content'
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
                                  ? 'bg-info text-accent-contrast shadow-xs'
                                  : 'bg-surface-2 dark:bg-surface text-transparent hover:text-muted'
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
                              className="p-1 rounded-control text-info hover:text-info hover:bg-info/10 transition-colors"
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
                              className="p-1 rounded-control text-muted hover:text-text dark:hover:text-text transition-colors"
                              title={tTask.editTask}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-caption font-bold text-info dark:text-info tabular-nums">
                              +{sub.points || 10} XP
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteProgramSubTask(activeTrack.id, sub.id)}
                              className="p-1 rounded-control text-muted hover:text-negative transition-colors"
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
                  <div className="pt-3 border-t border-border dark:border-border flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        deleteProgramTrack(activeTrack.id);
                        setSelectedTrackId(null);
                      }}
                      className="text-xs text-negative hover:text-negative font-semibold flex items-center gap-1.5 p-1 rounded-control hover:bg-negative/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{tTaskPage.deleteProgram}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. GYM TRACK DETAIL */}
            {activeTrack.type === 'gym' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-card bg-negative/10 border border-negative/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-negative dark:text-negative font-semibold">
                    <Dumbbell className="w-4 h-4 text-negative shrink-0" />
                    <span>+40 XP / {tTaskPage.workoutLogged}</span>
                  </div>
                  <span className="font-bold text-muted tabular-nums">
                    {(gymLogs ?? []).length} {tTask.workoutHistory || 'séances'}
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleAddGym} className="p-3.5 rounded-card bg-surface-3 dark:bg-surface/40 border border-border/60 dark:border-border/60 space-y-3.5">
                  {/* 1-Click Apple-style Muscle Group Toggle Chips */}
                  <div>
                    <label className="block text-caption font-bold text-muted dark:text-muted mb-1.5 flex items-center justify-between">
                      <span>{tTask.muscleGroups} *</span>
                      {selectedGymMuscles.length > 0 && (
                        <span className="text-caption text-negative dark:text-negative font-semibold tabular-nums">
                          {selectedGymMuscles.length} {tTaskPage.selected}
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
                                ? 'bg-negative text-accent-contrast border-negative shadow-xs scale-[1.02]'
                                : 'bg-surface text-content border-border dark:border-border hover:bg-surface-3 dark:hover:bg-surface'
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
                      <label className="block text-caption font-bold text-muted dark:text-muted mb-1">
                        {tTask.exercisesLabel} ({tTaskPage.optional})
                      </label>
                      <textarea
                        rows={2}
                        value={gymExercises}
                        onChange={(e) => setGymExercises(e.target.value)}
                        placeholder={tTask.exercisesPlaceholder || (tTaskPage.exerciseDetails)}
                        className="w-full px-3 py-2 rounded-control bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-negative"
                      />
                    </div>

                    {/* Tomorrow's Plan */}
                    <div>
                      <label className="block text-caption font-bold text-muted dark:text-muted mb-1">
                        {tTask.tomorrowPlan} ({tTaskPage.optional})
                      </label>
                      <textarea
                        rows={2}
                        value={gymTomorrowPlan}
                        onChange={(e) => setGymTomorrowPlan(e.target.value)}
                        placeholder={tTask.tomorrowPlaceholder || (tTaskPage.planTomorrow)}
                        className="w-full px-3 py-2 rounded-control bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-negative"
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
                        className="p-2.5 rounded-control bg-surface-3 dark:bg-surface/60 border border-border/60 dark:border-border/60 text-xs flex items-center justify-between gap-3"
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
                            <p className="text-caption text-negative dark:text-negative font-medium">
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
                            className="p-1 rounded-control text-negative hover:text-negative hover:bg-negative/10 transition-colors"
                            title={tTaskPage.googleCalendarReminder}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-caption font-bold text-negative dark:text-negative">
                            +40 XP
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteGymLog(log.id)}
                            className="p-1 rounded-control text-muted hover:text-negative transition-colors"
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
                <div className="p-3.5 rounded-card bg-accent/10 border border-accent/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-accent dark:text-accent font-semibold">
                    <BookOpen className="w-4 h-4 text-accent shrink-0" />
                    <span>+30 XP / {tTaskPage.moduleCompleted}</span>
                  </div>
                  <span className="font-bold text-muted tabular-nums">
                    {(studyModules ?? []).filter((m) => m.completed).length} / {(studyModules ?? []).length}
                  </span>
                </div>

                {/* 1-Click Apple-style Economics & Management S3 Modules Chips */}
                <div>
                  <label className="block text-caption font-bold text-muted dark:text-muted mb-1.5 flex items-center justify-between">
                    <span>{tTaskPage.modulesEconomicsS3}</span>
                    <span className="text-caption text-accent dark:text-accent font-semibold">{tTaskPage.quickAdd}</span>
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
                              ? 'bg-accent/15 text-accent dark:text-accent border-accent/30 shadow-2xs'
                              : 'bg-surface dark:bg-surface/80 text-content border-border dark:border-border hover:bg-accent dark:hover:bg-accent/30 hover:border-accent'
                          }`}
                        >
                          <span className="text-accent font-bold shrink-0">{isAlreadyAdded ? '✓' : '+'}</span>
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
                    className="flex-1 px-3.5 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={moduleSubject}
                    onChange={(e) => setModuleSubject(e.target.value)}
                    placeholder={tTask.subjectPlaceholder || 'Discipline (optionnel)...'}
                    className="sm:w-44 px-3.5 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    <span>{tCommon.confirm}</span>
                  </Button>
                </form>

                {/* Modules List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(studyModules ?? []).length === 0 ? (
                    <p className="text-xs text-muted italic py-2 text-center">
                      {tTaskPage.noModules}
                    </p>
                  ) : (
                    (studyModules ?? []).map((mod) => (
                      <div
                        key={mod.id}
                        className={`flex items-center justify-between p-3 rounded-card border transition-all ${
                          mod.completed
                            ? 'bg-accent/10 border-accent/20 text-muted dark:text-muted'
                            : 'bg-surface-3 dark:bg-surface/60 border-border/60 dark:border-border/60 text-content'
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
                                ? 'bg-accent text-accent-contrast'
                                : 'bg-surface-2 dark:bg-surface text-transparent hover:text-muted'
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
                            className="p-1 rounded-control text-accent hover:text-accent hover:bg-accent/10 transition-colors"
                            title={tTask.googleCalendarAlarmBtn}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudyModule(mod)}
                            className="p-1 rounded-control text-muted hover:text-text dark:hover:text-text transition-colors"
                              title={tTask.editTask}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-caption font-bold text-accent dark:text-accent">
                            +30 XP
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteStudyModule(mod.id)}
                            className="p-1 rounded-control text-muted hover:text-negative transition-colors"
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
        subtitle={tTaskPage.createProgramTrack}
      >
        <form onSubmit={handleCreateProgramTrack} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-content mb-1.5">
              {tTask.programName} *
            </label>
            <input
              type="text"
              required
              value={newTrackTitle}
              onChange={(e) => setNewTrackTitle(e.target.value)}
              placeholder={tTaskPage.programPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content font-medium focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTaskPage.icon}
              </label>
              <div className="flex gap-2 flex-wrap">
                {['🎯', '🚀', '🧠', '💼', '🎨', '📖'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewTrackIcon(emoji)}
                    className={`w-9 h-9 rounded-control flex items-center justify-center text-lg border transition-all ${
                      newTrackIcon === emoji
                        ? 'border-info bg-info dark:bg-info/60 scale-105'
                        : 'border-border dark:border-border hover:bg-surface-3 dark:hover:bg-surface'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTaskPage.color}
              </label>
              <div className="flex gap-2 flex-wrap items-center pt-1">
                {['bg-info', 'bg-positive', '#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTrackColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newTrackColor === color
                        ? 'scale-125 ring-2 ring-offset-2 ring-ring'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border">
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
        title={tTaskPage.subTaskDetails}
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
                {tTaskPage.subTaskTitle} *
              </label>
              <input
                type="text"
                required
                value={editingSubTask.title}
                onChange={(e) => setEditingSubTask({ ...editingSubTask, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content font-medium focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-content mb-1.5">
                {tTaskPage.xpPoints}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={editingSubTask.points}
                onChange={(e) => setEditingSubTask({ ...editingSubTask, points: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Prominent Action Button: Add Alarm via Google Calendar */}
            <div className="pt-2 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => {
                  const trackTitle = activeTrack ? getProgramTrackTitle(activeTrack, language) : 'Programme';
                  setAlarmModalTaskTitle(`${trackTitle}: ${editingSubTask.title}`);
                  setAlarmModalDescription(`Rappel pour ${editingSubTask.title}`);
                }}
                className="w-full py-2.5 px-4 rounded-control bg-gradient-to-r from-info to-accent hover:from-info hover:to-accent text-accent-contrast font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>{tTask.googleCalendarAlarmBtn}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border">
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
        title={tTaskPage.moduleDetails}
        subtitle={tTaskPage.modulesEconomicsS3}
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
                className="w-full px-3.5 py-2.5 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content font-medium focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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
                className="w-full px-3.5 py-2 rounded-control bg-surface-3 dark:bg-surface border border-border dark:border-border text-content text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Prominent Action Button: Add Alarm via Google Calendar */}
            <div className="pt-2 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => {
                  setAlarmModalTaskTitle(`Révision: ${editingStudyModule.title}${editingStudyModule.subject ? ` (${editingStudyModule.subject})` : ''}`);
                  setAlarmModalDescription(`Session de révision S3: ${editingStudyModule.title}`);
                }}
                className="w-full py-2.5 px-4 rounded-control bg-gradient-to-r from-info to-accent hover:from-info hover:to-accent text-accent-contrast font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Bell className="w-4 h-4" />
                <span>{tTask.googleCalendarAlarmBtn}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border">
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
