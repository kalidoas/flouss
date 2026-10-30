export type TransactionType = 'income' | 'expense' | 'contribution' | 'goal_withdraw';

export interface SubCategory {
  id: string;
  name: string; // fallback or custom name
  key?: string; // stable translation key e.g. "groceries"
  icon?: string;
}

export interface Category {
  id: string;
  name: string; // fallback or user-created name
  key?: string; // stable translation key e.g. "food"
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
  isOnboarded: boolean;
  categories: Category[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  recurringRules: RecurringIncomeRule[];
  recentNotes: string[];
  tasks?: TaskItem[];
  debts?: DebtItem[];
  subscriptions?: SubscriptionItem[];
  notes?: NoteItem[];
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

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  billingDay: number; // 1 to 31
  category: string;
  notes?: string;
  paidMonths: string[]; // ['2026-10']
  createdAt: string;
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
