export type TransactionType = 'income' | 'expense' | 'contribution' | 'goal_withdraw' | 'adjustment';

export type CategoryGroupId =
  | 'essentials_housing'
  | 'food_dining'
  | 'transport_mobility'
  | 'lifestyle_entertainment'
  | 'subscriptions_utilities'
  | 'income_investments'
  | 'savings';

export interface SubCategory {
  id: string;
  name: string; // fallback or custom name
  key?: string; // stable translation key e.g. "groceries"
  translationKey?: string; // stable translation key alias
  icon?: string;
}

export interface Category {
  id: string;
  name: string; // fallback or user-created name
  key?: string; // stable translation key e.g. "food"
  translationKey?: string; // stable translation key alias
  group?: CategoryGroupId; // curated Apple HIG financial taxonomy group
  icon: string; // Lucide icon key
  color: string; // Hex color code
  isGoal: boolean;
  targetAmount?: number | null; // e.g. 8000 MAD
  targetMonths?: number | null; // e.g. 6 months
  targetDate?: string | null; // YYYY-MM-DD
  monthlyBudget?: number | null; // optional monthly spending limit
  isArchived: boolean;
  createdAt: string;
  subcategories?: SubCategory[];
  subCategoryId?: string | null; // if a goal is attached to a specific sub-category
}

export interface IncomeSource {
  id: string;
  name: string;
  key?: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  subcategories?: SubCategory[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string | null; // for expense, contribution, goal_withdraw
  subCategoryId?: string | null; // optional sub-category id
  sourceId?: string | null; // for income
  incomeSubSourceId?: string | null; // optional income sub-source id
  date: string; // ISO datetime string or YYYY-MM-DD
  note?: string;
  isRecurring?: boolean; // recurring income
  recurringDay?: number; // 1-31
  createdAt: string; // ISO
}

export interface RecurringIncomeRule {
  id: string;
  sourceId: string;
  amount: number;
  dayOfMonth: number; // 1 to 31
  note?: string;
  lastConfirmedMonth?: string; // "YYYY-MM"
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'fr' | 'ar' | 'en';

export interface GoalCalculation {
  savedAmount: number;
  remainingAmount: number;
  progressPercent: number;
  remainingMonths: number;
  monthlyNeeded: number;
  status: 'completed' | 'on_track' | 'behind' | 'not_started';
}

export type ScreenId =
  | 'dashboard'
  | 'tasks'
  | 'debts'
  | 'subscriptions'
  | 'notes'
  | 'categories'
  | 'income'
  | 'expenses'
  | 'history'
  | 'stats'
  | 'settings'
  | 'accounts';

export interface UndoableAction {
  id: string;
  description: string;
  undo: () => void;
}

export type UserRole = 'owner' | 'member';

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  avatarColor: string;
  avatarEmoji?: string;
  role: UserRole;
  createdAt: string;
  language: Language;
  theme: ThemeMode;
  recoveryCodeHash?: string;
  isEncrypted?: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  pinCode?: string | null;
  pinEnabled?: boolean;
  tourCompleted?: boolean;
  avatarColor: string;
  avatarIcon?: string;
  initialBalance: number | null;
  initialBalanceLockedAt: string | null;
  balance?: number;
  isOnboarded: boolean;
  categories: Category[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  deletedTransactionIds?: string[];
  recurringRules: RecurringIncomeRule[];
  recentNotes: string[];
  tasks?: TaskItem[];
  focusTasks?: FocusTask[];
  focusLists?: FocusListMenu[];
  debts?: DebtItem[];
  subscriptions?: SubscriptionItem[];
  notes?: NoteItem[];
  deletedCategoryIds?: string[];
  salatLogs?: Record<string, PrayerKey[]>; // dateStr -> array of completed prayer keys
  studyModules?: StudyModuleItem[];
  gymLogs?: GymWorkoutLog[];
  programTracks?: ProgramTrack[];
  meetings?: CalendarMeeting[];
  notificationSettings?: NotificationSettings;
  incomeBalanceFixedV1?: boolean;
  initialBalanceFixed1259?: boolean;
  userCustomBalanceAdjusted?: boolean;
  createdAt: string;
}

export interface ProgramSubTask {
  id: string;
  title: string;
  completedDates?: string[]; // array of YYYY-MM-DD
  points?: number; // default: 10 XP
  createdAt: string;
}

export interface ProgramTrack {
  id: string;
  title: string;
  icon: string;
  color?: string;
  type: 'salat' | 'coding' | 'english' | 'gym' | 'study' | 'custom';
  subtasks?: ProgramSubTask[];
  createdAt: string;
}

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface StudyModuleItem {
  id: string;
  title: string;
  subject?: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GymWorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  muscleGroups: string;
  exercises?: string;
  notes?: string;
  tomorrowPlan?: string;
  createdAt: string;
}

export interface FocusListMenu {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface FocusTask {
  id: string;
  listId?: string; // Links task to a menu/list (defaults to 'default')
  text: string;
  completed: boolean;
  isPinned: boolean;
  priority: 'urgent' | 'normal';
  dueDate?: string; // YYYY-MM-DD
  createdAt: string;
}

export type TaskFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom_days';
export type TaskCategory = 'routine' | 'work' | 'study' | 'sport' | 'deen' | 'finance' | 'health' | 'other' | 'discipline' | 'running';

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  targetMonth?: string; // e.g. "2026-10" or empty for ongoing
  selectedDaysOfWeek?: number[]; // [0..6] (0 = Sunday, 1 = Monday ...)
  timeOfDay?: string; // "morning" | "afternoon" | "evening" | "anytime"
  linkedAmount?: number; // optional MAD amount
  notes?: string;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  scheduledDateTime?: string; // ISO string or YYYY-MM-DDTHH:mm
  addToGoogleCalendar?: boolean;
  googleCalendarEventId?: string;
  reminderEnabled?: boolean;
  reminderLeadMinutes?: number[]; // e.g. [10, 0]
  createdAt: string;
  isArchived?: boolean;
  completedDates: string[]; // List of YYYY-MM-DD
}

export type DebtType = 'lend' | 'borrow'; // 'lend' = on me doit, 'borrow' = je dois

export interface DebtItem {
  id: string;
  personName: string;
  type: DebtType;
  totalAmount: number;
  paidAmount: number;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  isSettled: boolean;
}

export interface SubscriptionPayment {
  cycleDate: string; // YYYY-MM-DD
  paidOn: string; // ISO datetime or YYYY-MM-DD
  amount: number;
}

export type SubscriptionStatus = 'paid-up' | 'due-soon' | 'due-today' | 'overdue';

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  billingDay: number; // 1 to 31 (kept for backward compatibility during migration)
  category: string;
  notes?: string;
  paidMonths: string[]; // ['2026-10'] (kept for backward compatibility during migration)
  nextDueDate?: string; // YYYY-MM-DD
  payments?: SubscriptionPayment[];
  endDate?: string; // YYYY-MM-DD
  reminderEnabled?: boolean;
  reminderDaysBefore?: number; // default: 1 day before
  reminderTime?: string; // default: "09:00"
  googleCalendarEventId?: string;
  createdAt: string;
}

export type Subscription = SubscriptionItem;

export interface CalendarMeeting {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number; // e.g. 30, 60
  attendees: string[]; // email addresses
  remindersMinutes?: number[]; // e.g. [10, 0]
  htmlLink?: string;
  googleCalendarEventId?: string;
  createdAt: string;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  soundTone: 'chime' | 'radar' | 'gentle';
  defaultBillLeadDays: number;
  defaultTaskLeadMinutes: number[];
  googleCalendarConnected?: boolean;
  googleCalendarEmail?: string | null;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  category?: string;
  updatedAt: string;
  createdAt: string;
}

export interface AccountRecord {
  profile: UserProfile;
  passwordHash: string;
  salt: string;
  failedAttempts: number;
  lockUntil: number | null;
  pinCode: string | null;
  pinEnabled: boolean;
}
