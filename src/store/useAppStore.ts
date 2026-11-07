import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, onSnapshot, runTransaction, serverTimestamp, Unsubscribe } from '@firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  Category,
  IncomeSource,
  Language,
  RecurringIncomeRule,
  ScreenId,
  ThemeMode,
  Transaction,
  UserAccount,
  TaskItem,
  DebtItem,
  SubscriptionItem,
  NoteItem,
  FocusTask,
  FocusListMenu,
  StudyModuleItem,
  GymWorkoutLog,
  PrayerKey,
  ProgramTrack,
  ProgramSubTask,
  CalendarMeeting,
  NotificationSettings,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_SOURCES,
  DEFAULT_TASKS,
  DEFAULT_DEBTS,
  DEFAULT_SUBSCRIPTIONS,
  DEFAULT_NOTES,
  DEFAULT_FOCUS_LISTS,
  DEFAULT_FOCUS_TASKS,
  DEFAULT_STUDY_MODULES,
  DEFAULT_GYM_LOGS,
  DEFAULT_PROGRAM_TRACKS,
} from './defaultData';
import {
  calculateAvailableBalance,
  calculateGoalProgress,
} from '../utils/calculations';
import { playHapticFeedback } from '../utils/haptics';
import { migrateSubscription, migrateSubscriptions } from '../utils/subscriptions';
import { hashPin, verifyPin, encryptBackup, decryptBackup } from '../utils/crypto';

export { migrateSubscription, migrateSubscriptions, hashPin };

export interface AppState {
  // ── Auth & Session ──────────────────────────────────────────
  firebaseUser: any;
  loadingAuth: boolean;
  isPinVerified: boolean;
  userPinCode: string | null;
  isDemoMode: boolean;
  firestoreDisabled: boolean;
  syncStatus: 'connecting' | 'syncing' | 'synced' | 'error';

  // ── Multi-Account State ─────────────────────────────────────
  accounts: UserAccount[];
  activeAccountId: string | null;

  // ── Active Account Reactive Fields ──────────────────────────
  currentAccount: UserAccount | null;
  isOnboarded: boolean;
  initialBalance: number | null;
  initialBalanceLockedAt: string | null;
  balance: number;
  categories: Category[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  recurringRules: RecurringIncomeRule[];
  tasks: TaskItem[];
  debts: DebtItem[];
  subscriptions: SubscriptionItem[];
  notes: NoteItem[];
  salatLogs: Record<string, PrayerKey[]>;
  studyModules: StudyModuleItem[];
  gymLogs: GymWorkoutLog[];
  programTracks: ProgramTrack[];
  focusTasks: FocusTask[];
  focusLists: FocusListMenu[];
  activeFocusListId: string;
  pinEnabled: boolean;
  pinCode: string | null;
  recentNotes: string[];
  meetings: CalendarMeeting[];
  notificationSettings: NotificationSettings;

  // ── UI Preferences ──────────────────────────────────────────
  theme: ThemeMode;
  isDarkMode: boolean;
  language: Language;
  activeScreen: ScreenId;
  screenHistory: ScreenId[];
  navigationDirection: 'forward' | 'back';
  isPinUnlocked: boolean;
  hideBalance: boolean;
  isBalanceHidden: boolean;
  lastBackupDate: string | null;
  dismissedRecurringForMonth: string[];
  isTourActive: boolean;
  tourStep: number;
  activeToast: { message: string; actionText?: string; onAction?: () => void } | null;

  // ── Actions ─────────────────────────────────────────────────
  initAuthSession: (user: any) => Promise<void>;
  verify2FAPin: (pin: string) => Promise<boolean> | boolean;
  setPinVerified: (verified: boolean) => void;
  logout: () => Promise<void>;
  syncToFirestore: () => Promise<void>;
  refreshFromFirestore: () => Promise<void>;
  forceSyncToCloud: () => Promise<{ success: boolean; message: string }>;

  setActiveScreen: (screen: ScreenId) => void;
  navigateBack: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  resetLanguageToSystem: () => Language;
  setHideBalance: (v: boolean) => void;
  toggleHideBalance: () => void;
  setIsBalanceHidden: (v: boolean) => void;
  toggleBalanceHidden: () => void;
  setPinUnlocked: (v: boolean) => void;
  setPinCode: (code: string | null) => Promise<void>;

  lockInitialBalance: (amount: number, metadata?: { email?: string; pinCode?: string; accountName?: string }) => Promise<void>;
  reconcileCurrentBalance: (targetBalance: number) => Promise<void>;

  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;

  addCategory: (cat: Category) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addIncomeSource: (src: IncomeSource) => void;
  updateIncomeSource: (id: string, patch: Partial<IncomeSource>) => void;
  deleteIncomeSource: (id: string) => void;

  addRecurringRule: (rule: RecurringIncomeRule) => void;
  confirmRecurringIncome: (ruleId: string, month: string, tx: Transaction) => void;
  dismissRecurringPrompt: (month: string) => void;
  contributeToAllGoals: () => void;

  addTask: (task: TaskItem) => void;
  updateTask: (id: string, patch: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  toggleTaskDone: (id: string, date: string) => void;
  toggleTaskCompletion: (id: string, date: string) => void;

  toggleSalatPrayer: (date: string, prayer: PrayerKey) => void;
  addStudyModule: (title: string, subject?: string, notes?: string) => void;
  toggleStudyModule: (id: string) => void;
  updateStudyModule: (id: string, patch: Partial<StudyModuleItem>) => void;
  deleteStudyModule: (id: string) => void;
  addGymLog: (log: Omit<GymWorkoutLog, 'id' | 'createdAt'>) => void;
  deleteGymLog: (id: string) => void;

  addProgramTrack: (title: string, icon?: string, color?: string) => void;
  deleteProgramTrack: (trackId: string) => void;
  addProgramSubTask: (trackId: string, title: string, points?: number) => void;
  updateProgramSubTask: (trackId: string, subTaskId: string, patch: Partial<ProgramSubTask>) => void;
  toggleProgramSubTask: (trackId: string, subTaskId: string, dateStr: string) => void;
  deleteProgramSubTask: (trackId: string, subTaskId: string) => void;

  setActiveFocusListId: (id: string) => void;
  addFocusList: (name: string, color?: string) => void;
  deleteFocusList: (id: string) => void;
  addFocusTask: (task: FocusTask) => void;
  updateFocusTask: (id: string, patch: Partial<FocusTask>) => void;
  deleteFocusTask: (id: string) => void;
  toggleFocusTask: (id: string) => void;
  togglePinFocusTask: (id: string) => void;

  addDebt: (debt: DebtItem) => void;
  updateDebt: (id: string, patch: Partial<DebtItem>) => void;
  deleteDebt: (id: string) => void;
  settleDebt: (id: string) => void;
  recordDebtPayment: (id: string, amount: number) => void;

  addSubscription: (sub: SubscriptionItem) => void;
  updateSubscription: (id: string, patch: Partial<SubscriptionItem>) => void;
  deleteSubscription: (id: string) => void;
  toggleSubscriptionPaid: (id: string, month: string) => void;

  addNote: (note: NoteItem) => void;
  addNoteItem: (note: NoteItem) => void;
  updateNote: (id: string, patch: Partial<NoteItem>) => void;
  updateNoteItem: (id: string, patch: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
  deleteNoteItem: (id: string) => void;
  togglePinNote: (id: string) => void;

  addMeeting: (meeting: CalendarMeeting) => void;
  deleteMeeting: (id: string) => void;
  updateNotificationSettings: (patch: Partial<NotificationSettings>) => void;

  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;

  showToast: (toast: { message: string; actionText?: string; onAction?: () => void }) => void;
  clearToast: () => void;

  switchAccount: (id: string) => void;
  createAccount: (name: string, email?: string, pin?: string, color?: string, role?: string) => string;
  updateAccount: (id: string, patch: Partial<UserAccount>) => void;
  deleteAccount: (id: string) => void;

  exportBackup: () => Promise<string> | string;
  importBackup: (json: string) => Promise<boolean> | boolean;
  loadDemoData: () => void;
  resetAllData: () => void;
  setDemoMode?: (v: boolean) => void;
}

export const RESTORED_EXPENSES: Transaction[] = [
  {
    id: 'tx_exp_gym_nov2',
    type: 'expense',
    amount: 150.0,
    categoryId: 'cat_sport',
    subCategoryId: 'sub_gym',
    note: 'اشتراك القاعة الرياضية',
    date: '2026-11-02T10:00:00.000Z',
    createdAt: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'tx_exp_gel_nov2',
    type: 'expense',
    amount: 15.4,
    categoryId: 'cat_sante',
    subCategoryId: 'sub_skincare',
    note: 'عناية بالبشرة Gel douch',
    date: '2026-11-02T11:30:00.000Z',
    createdAt: '2026-11-02T11:30:00.000Z',
  },
  {
    id: 'tx_exp_cafe_nov2',
    type: 'expense',
    amount: 12.0,
    categoryId: 'cat_cafe',
    subCategoryId: 'sub_coffee',
    note: 'قهوة وشاي',
    date: '2026-11-02T15:00:00.000Z',
    createdAt: '2026-11-02T15:00:00.000Z',
  },
  {
    id: 'tx_exp_cafe_nov1',
    type: 'expense',
    amount: 12.0,
    categoryId: 'cat_cafe',
    subCategoryId: 'sub_coffee',
    note: 'قهوة وشاي',
    date: '2026-11-01T16:30:00.000Z',
    createdAt: '2026-11-01T16:30:00.000Z',
  },
  {
    id: 'tx_exp_snack_nov1',
    type: 'expense',
    amount: 5.0,
    categoryId: 'cat_nourriture',
    subCategoryId: 'sub_fastFood',
    note: 'وجبات سريعة وخفيفة',
    date: '2026-11-01T13:00:00.000Z',
    createdAt: '2026-11-01T13:00:00.000Z',
  },
];

export function ensureRestoredExpenses(transactions: Transaction[]): {
  transactions: Transaction[];
  changed: boolean;
} {
  const current = Array.isArray(transactions) ? [...transactions] : [];
  let changed = false;

  for (const item of RESTORED_EXPENSES) {
    const exists = current.some((t) => {
      if (t.id === item.id) return true;
      if (t.type !== 'expense') return false;
      const sameAmount = Math.abs(Number(t.amount) - item.amount) < 0.01;
      const sameDate = t.date.slice(0, 10) === item.date.slice(0, 10);
      const sameCategory = t.categoryId === item.categoryId;
      return sameAmount && sameDate && sameCategory;
    });

    if (!exists) {
      current.push(item);
      changed = true;
    }
  }

  if (changed) {
    current.sort((a, b) => b.date.localeCompare(a.date));
  }

  return { transactions: current, changed };
}

export function makeInitialAccount(uid: string, name: string, email?: string): UserAccount {
  return {
    id: uid,
    name: name || 'Utilisateur',
    email: email || '',
    pinCode: null,
    pinEnabled: false,
    tourCompleted: false,
    avatarColor: '#2383e2',
    avatarIcon: '👤',
    initialBalance: 0,
    initialBalanceLockedAt: null,
    balance: 0,
    isOnboarded: false,
    categories: DEFAULT_CATEGORIES,
    incomeSources: DEFAULT_INCOME_SOURCES,
    transactions: [],
    deletedTransactionIds: [],
    recurringRules: [],
    recentNotes: [],
    tasks: DEFAULT_TASKS,
    focusTasks: DEFAULT_FOCUS_TASKS,
    focusLists: DEFAULT_FOCUS_LISTS,
    debts: DEFAULT_DEBTS,
    subscriptions: migrateSubscriptions(DEFAULT_SUBSCRIPTIONS),
    notes: DEFAULT_NOTES,
    deletedCategoryIds: [],
    salatLogs: {},
    studyModules: DEFAULT_STUDY_MODULES,
    gymLogs: DEFAULT_GYM_LOGS,
    programTracks: DEFAULT_PROGRAM_TRACKS,
    meetings: [],
    notificationSettings: {
      soundEnabled: true,
      soundTone: 'chime',
      defaultBillLeadDays: 1,
      defaultTaskLeadMinutes: [10, 0],
      googleCalendarConnected: false,
      googleCalendarEmail: null,
    },
    createdAt: new Date().toISOString(),
  };
}

export function detectSystemLanguage(): Language {
  if (typeof window === 'undefined' || !navigator) return 'ar';
  const navLangs = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  for (const l of navLangs) {
    if (!l) continue;
    const lower = l.toLowerCase();
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('en')) return 'en';
  }
  return 'fr';
}

export function getInitialLanguage(): Language {
  try {
    const isManual = localStorage.getItem('flouss_manual_language_selected');
    if (isManual === 'true') {
      const stored = localStorage.getItem('flouss_app_storage_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.language && ['ar', 'fr', 'en'].includes(parsed.state.language)) {
          return parsed.state.language;
        }
      }
    }
  } catch (e) {}
  return detectSystemLanguage();
}

export function extractAccountState(account: UserAccount | null) {
  if (!account) {
    return {
      currentAccount: null,
      isOnboarded: false,
      initialBalance: null,
      initialBalanceLockedAt: null,
      balance: 0,
      categories: DEFAULT_CATEGORIES,
      incomeSources: DEFAULT_INCOME_SOURCES,
      transactions: [],
      recurringRules: [],
      tasks: DEFAULT_TASKS,
      focusTasks: DEFAULT_FOCUS_TASKS,
      focusLists: DEFAULT_FOCUS_LISTS,
      debts: DEFAULT_DEBTS,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      notes: DEFAULT_NOTES,
      salatLogs: {},
      studyModules: DEFAULT_STUDY_MODULES,
      gymLogs: DEFAULT_GYM_LOGS,
      programTracks: DEFAULT_PROGRAM_TRACKS,
      pinEnabled: false,
      pinCode: null,
      recentNotes: [],
    };
  }

  const txs = Array.isArray(account.transactions) ? account.transactions : [];

  // Safe category hydration that respects deleted categories (Fixes Ghost Deletion Bug)
  const deletedIds = new Set(account.deletedCategoryIds || []);
  const accountCategories = (account.categories ?? DEFAULT_CATEGORIES).filter(
    (c: Category) => !deletedIds.has(c.id)
  );

  const initialBal =
    typeof account.initialBalance === 'number' && !isNaN(account.initialBalance)
      ? account.initialBalance
      : 0;

  const resolvedBalance = calculateAvailableBalance(initialBal, txs);
  const migratedSubs = migrateSubscriptions(account.subscriptions ?? DEFAULT_SUBSCRIPTIONS);

  return {
    currentAccount: {
      ...account,
      transactions: txs,
      initialBalance: initialBal,
      balance: resolvedBalance,
      subscriptions: migratedSubs,
    },
    isOnboarded: Boolean(account.isOnboarded),
    initialBalance: initialBal,
    initialBalanceLockedAt: account.initialBalanceLockedAt ?? null,
    balance: resolvedBalance,
    categories: accountCategories,
    incomeSources: account.incomeSources ?? DEFAULT_INCOME_SOURCES,
    transactions: txs,
    recurringRules: account.recurringRules ?? [],
    tasks: account.tasks ?? DEFAULT_TASKS,
    focusTasks: account.focusTasks ?? DEFAULT_FOCUS_TASKS,
    focusLists: account.focusLists ?? DEFAULT_FOCUS_LISTS,
    debts: account.debts ?? DEFAULT_DEBTS,
    subscriptions: migratedSubs,
    notes: account.notes ?? DEFAULT_NOTES,
    salatLogs: account.salatLogs ?? {},
    studyModules: account.studyModules ?? DEFAULT_STUDY_MODULES,
    gymLogs: account.gymLogs ?? DEFAULT_GYM_LOGS,
    programTracks: account.programTracks ?? DEFAULT_PROGRAM_TRACKS,
    pinEnabled: Boolean(account.pinEnabled),
    pinCode: account.pinCode ?? null,
    recentNotes: account.recentNotes ?? [],
    meetings: account.meetings ?? [],
    notificationSettings: account.notificationSettings ?? {
      soundEnabled: true,
      soundTone: 'chime',
      defaultBillLeadDays: 1,
      defaultTaskLeadMinutes: [10, 0],
      googleCalendarConnected: false,
      googleCalendarEmail: null,
    },
  };
}

/**
 * Normalizes remote Firestore payload into ground-truth UserAccount state
 * and forcefully synchronizes to local persistence cache (overwriting stale local storage).
 */
const lastKnownTransactionsByUid = new Map<string, Transaction[]>();

const mergeTransactionsFromLocalChanges = (
  uid: string,
  localAccount: UserAccount,
  remoteAccount: UserAccount
): Pick<UserAccount, 'transactions' | 'deletedTransactionIds'> => {
  const remoteTransactions = Array.isArray(remoteAccount.transactions) ? remoteAccount.transactions : [];
  const knownTransactions = lastKnownTransactionsByUid.get(uid) || remoteTransactions;
  const knownById = new Map(knownTransactions.map((tx) => [tx.id, tx]));
  const localById = new Map((localAccount.transactions || []).map((tx) => [tx.id, tx]));
  const deletedIds = new Set([
    ...(remoteAccount.deletedTransactionIds || []),
    ...(localAccount.deletedTransactionIds || []),
    ...knownTransactions.filter((tx) => !localById.has(tx.id)).map((tx) => tx.id),
  ]);
  const changedLocally = (localAccount.transactions || []).filter((tx) => {
    const previous = knownById.get(tx.id);
    return !deletedIds.has(tx.id) && (!previous || JSON.stringify(previous) !== JSON.stringify(tx));
  });
  const merged = new Map(remoteTransactions.filter((tx) => !deletedIds.has(tx.id)).map((tx) => [tx.id, tx]));
  for (const tx of changedLocally) merged.set(tx.id, tx);
  return {
    deletedTransactionIds: Array.from(deletedIds),
    transactions: Array.from(merged.values()).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
  };
};

export function applyRemoteAccount(
  uid: string,
  data: any,
  fallbackUser?: any
): {
  finalSyncedAccount: UserAccount;
  remotePin: string | null;
} | null {
  if (!data) return null;
  const incomingAccount = data.account || data;
  const remotePin = data.pinCode ?? incomingAccount?.pinCode ?? null;

  // Remote snapshots replace local state after pending local changes have been reconciled.
  // Deletion markers keep older snapshots from bringing deleted transactions back.
  const deletedTransactionIds: string[] = Array.isArray(incomingAccount?.deletedTransactionIds)
    ? incomingAccount.deletedTransactionIds
    : [];
  const deletedIds = new Set(deletedTransactionIds);
  const remoteTxs: Transaction[] = Array.isArray(incomingAccount?.transactions)
    ? incomingAccount.transactions
    : Array.isArray(data?.transactions)
    ? data.transactions
    : [];

  const seenTxIds = new Set<string>();
  const mergedTxs: Transaction[] = [];
  for (const t of remoteTxs) {
    if (!t || !t.id || seenTxIds.has(t.id) || deletedIds.has(t.id)) continue;
    seenTxIds.add(t.id);
    mergedTxs.push(t);
  }
  mergedTxs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const rawInitialBalance = incomingAccount?.initialBalance ?? data?.initialBalance;
  const initialBal = typeof rawInitialBalance === 'number' && Number.isFinite(rawInitialBalance)
    ? rawInitialBalance
    : 0;
  const explicitOnboarding = incomingAccount.isOnboarded ??
    incomingAccount.hasCompletedOnboarding ??
    data.isOnboarded ??
    data.hasCompletedOnboarding;
  const cloudHasAccountData =
    (rawInitialBalance !== null && rawInitialBalance !== undefined) ||
    mergedTxs.length > 0 ||
    (Array.isArray(incomingAccount.categories) && incomingAccount.categories.length > 0) ||
    (Array.isArray(data.categories) && data.categories.length > 0);


  const computedBal = calculateAvailableBalance(initialBal, mergedTxs);
  const incomingSubs = incomingAccount?.subscriptions || data?.subscriptions;
  const migratedSubs = migrateSubscriptions(incomingSubs ?? DEFAULT_SUBSCRIPTIONS);

  const finalSyncedAccount: UserAccount = {
    ...makeInitialAccount(
      uid,
      incomingAccount.name || fallbackUser?.displayName || 'Utilisateur',
      incomingAccount.email || fallbackUser?.email || ''
    ),
    ...incomingAccount,
    id: uid,
    pinCode: remotePin,
    pinEnabled: !!remotePin,
    transactions: mergedTxs,
    deletedTransactionIds,
    initialBalance: initialBal,
    balance: computedBal,
    subscriptions: migratedSubs,
    // Accept the older onboarding field as well as the current one. Older cloud
    // documents may only have the legacy field, or may imply completion through data.
    isOnboarded: explicitOnboarding === true ||
      (explicitOnboarding == null && cloudHasAccountData) ||
      (explicitOnboarding === false &&
        ((rawInitialBalance !== null && rawInitialBalance !== undefined) || mergedTxs.length > 0)),
  };

  lastKnownTransactionsByUid.set(uid, mergedTxs);

  try {
    localStorage.setItem(`flouss_user_${uid}`, JSON.stringify(finalSyncedAccount));
    localStorage.setItem('flouss_user_default', JSON.stringify(finalSyncedAccount));
  } catch (e) {}

  return { finalSyncedAccount, remotePin };
}

let syncTimer: any = null;
let activeSnapshotUnsubscribe: Unsubscribe | null = null;

/**
 * Monotonic guard so an out-of-order / stale snapshot can never roll the UI back
 * to an older balance. Tracks the newest remote `updatedAt` we have already applied.
 */
let lastAppliedRemoteUpdatedAt = 0;

const remoteTimestampMs = (data: any): number => {
  const raw = data?.updatedAt;
  if (!raw) return 0;
  if (typeof raw.toMillis === 'function') return raw.toMillis();
  if (typeof raw.seconds === 'number') return raw.seconds * 1000 + Math.floor((raw.nanoseconds || 0) / 1e6);
  const ms = typeof raw === 'number' ? raw : Date.parse(String(raw));
  return Number.isFinite(ms) ? ms : 0;
};

/** Returns true when this payload is older than what we already applied (must be ignored). */
const isStaleRemotePayload = (data: any): boolean => {
  const ms = remoteTimestampMs(data);
  if (!ms) return false;
  if (ms < lastAppliedRemoteUpdatedAt) return true;
  lastAppliedRemoteUpdatedAt = ms;
  return false;
};

/**
 * Pushes an accepted remote Firestore payload into the Zustand state.
 */
const applyRemotePayload = (uid: string, data: any, fallbackUser?: any) => {
  const applied = applyRemoteAccount(uid, data, fallbackUser);
  if (!applied) return;
  const { finalSyncedAccount, remotePin } = applied;
  useAppStore.setState((state: any) => {
    const existing = Array.isArray(state.accounts) ? state.accounts : [];
    const others = existing.filter((a: any) => a && a.id !== uid && a.id !== 'default');
    return {
      accounts: [finalSyncedAccount, ...others],
      activeAccountId: uid,
      userPinCode: remotePin,
      ...extractAccountState(finalSyncedAccount),
      
    };
  });
};

/**
 * Single write path to Firestore for account state.
 *
 * Writes are serialized per account, and transaction changes are merged against the
 * latest cloud document inside a Firestore transaction. Server timestamps order devices
 * without relying on their local clocks.
 *
 * Returns true when the local state was written to the cloud.
 */
const writeAccountToFirestore = async (
  uid: string,
  localAccount: UserAccount,
  label: string
): Promise<boolean> => {
  const userRef = doc(db, 'users', uid);
  let computedBalance = 0;
  let skippedUninitializedWrite = false;
  useAppStore.setState({ syncStatus: 'syncing' });
  try {
    await runTransaction(db, async (firestoreTransaction: any) => {
    const snapshot = await firestoreTransaction.get(userRef);
    let accountToWrite = localAccount;
    if (snapshot.exists()) {
      const remoteData = snapshot.data();
      const remoteAccount = (remoteData.account || remoteData) as UserAccount;
      const localIsUninitialized =
        !localAccount.isOnboarded &&
        (localAccount.initialBalance === null || localAccount.initialBalance === undefined) &&
        (localAccount.transactions?.length || 0) === 0;
      if (localIsUninitialized) {
        // The cloud document is authoritative until this device has completed
        // onboarding or has a real transaction to contribute.
        skippedUninitializedWrite = true;
        computedBalance = calculateAvailableBalance(
          remoteAccount.initialBalance ?? remoteData.initialBalance ?? null,
          remoteAccount.transactions ?? remoteData.transactions ?? []
        );
        return;
      }
      accountToWrite = {
        ...remoteAccount,
        ...localAccount,
        ...mergeTransactionsFromLocalChanges(uid, localAccount, remoteAccount),
      };
      lastAppliedRemoteUpdatedAt = Math.max(lastAppliedRemoteUpdatedAt, remoteTimestampMs(remoteData));
    }

    computedBalance = calculateAvailableBalance(accountToWrite.initialBalance ?? null, accountToWrite.transactions ?? []);
      firestoreTransaction.set(userRef, {
      uid,
      email: accountToWrite.email || null,
      displayName: accountToWrite.name || null,
      pinCode: accountToWrite.pinCode ?? null,
      pinEnabled: !!accountToWrite.pinCode,
      initialBalance: accountToWrite.initialBalance ?? null,
      balance: computedBalance,
      isOnboarded: Boolean(accountToWrite.isOnboarded),
      account: { ...accountToWrite, balance: computedBalance },
      updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    useAppStore.setState({ syncStatus: 'synced' });
  } catch (error) {
    useAppStore.setState({ syncStatus: 'error' });
    throw error;
  }

  if (skippedUninitializedWrite) {
    console.warn(`⏭️ [Flouss Cloud] Skipped empty local write; existing Firestore account preserved for users/${uid}`);
    return false;
  }

  console.log(`✅ [Flouss Cloud] ${label} sync completed (balance: ${computedBalance}) for users/${uid}`);
  return true;
};

const firestoreWriteQueues = new Map<string, Promise<boolean>>();
const pushAccountToFirestore = (uid: string, account: UserAccount, label: string): Promise<boolean> => {
  const previous = firestoreWriteQueues.get(uid) || Promise.resolve(true);
  const queued = previous.catch(() => false).then(() => writeAccountToFirestore(uid, account, label));
  firestoreWriteQueues.set(uid, queued);
  void queued.then(
    () => { if (firestoreWriteQueues.get(uid) === queued) firestoreWriteQueues.delete(uid); },
    () => { if (firestoreWriteQueues.get(uid) === queued) firestoreWriteQueues.delete(uid); }
  );
  return queued;
};

const debouncedFirestoreSync = (uid: string, account: UserAccount) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      await pushAccountToFirestore(uid, account, 'Debounced');
    } catch (err: any) {
      console.error(`❌ [Flouss Cloud] Error syncing to Firestore users/${uid}:`, err);
    }
  }, 150);
};

const executeImmediateFirestoreSync = async (uid: string, account: UserAccount) => {
  if (syncTimer) clearTimeout(syncTimer);
  try {
    await pushAccountToFirestore(uid, account, 'Immediate');
  } catch (err: any) {
    console.error(`❌ [Flouss Cloud] Error in immediate sync for users/${uid}:`, err);
  }
};

export function applyThemeToDOM(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  if (isDark) {
    root.classList.add('dark');
    body.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const initialAccount = makeInitialAccount('default', 'Khalid');

      // Helper to update active account and its reactive projections
      const updateActive = (
        updater: (acc: UserAccount) => UserAccount,
        immediateSync: boolean = false
      ) => {
        const s = get();
        const activeId = s.activeAccountId || s.accounts[0]?.id;
        const currentAcc = s.accounts.find((a: UserAccount) => a.id === activeId) || s.accounts[0];
        if (!currentAcc) return;

        const updatedAcc = updater(currentAcc);
        const updatedAccounts = s.accounts.map((a: UserAccount) =>
          a.id === currentAcc.id ? updatedAcc : a
        );

        const extracted = extractAccountState(updatedAcc);

        set({
          accounts: updatedAccounts,
          ...extracted,
        });

        // Always save to localStorage immediately for instant offline safety
        const uid = s.firebaseUser?.uid || auth.currentUser?.uid;
        if (extracted.currentAccount) {
          try {
            if (uid) {
              localStorage.setItem(`flouss_user_${uid}`, JSON.stringify(extracted.currentAccount));
            }
            // Always maintain flouss_user_default as an offline safety backup
            localStorage.setItem('flouss_user_default', JSON.stringify(extracted.currentAccount));
          } catch (e) {}

          if (uid) {
            if (immediateSync) {
              executeImmediateFirestoreSync(uid, extracted.currentAccount);
            } else {
              debouncedFirestoreSync(uid, extracted.currentAccount);
            }
          }
        }
      };

      return {
        // ── Auth & Session ──────────────────────────────────────────
        firebaseUser: null,
        loadingAuth: true,
        isPinVerified: false,
        userPinCode: null,
        isDemoMode: false,
        firestoreDisabled: false,
        syncStatus: 'connecting',

        // ── Multi-Account State ─────────────────────────────────────
        accounts: [initialAccount],
        activeAccountId: initialAccount.id,

        // ── Active Account Reactive Fields ──────────────────────────
        ...extractAccountState(initialAccount),

        // ── UI Preferences ──────────────────────────────────────────
        theme: 'system' as ThemeMode,
        isDarkMode:
          typeof window !== 'undefined' &&
          Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches),
        language: getInitialLanguage() as Language,
        activeScreen: 'dashboard' as ScreenId,
        screenHistory: [] as ScreenId[],
        navigationDirection: 'forward' as const,
        activeFocusListId: 'default',
        isPinUnlocked: true,
        hideBalance: true, // Sensitive wealth blurred on startup by default (user requirement)
        isBalanceHidden: true,
        lastBackupDate: null,
        dismissedRecurringForMonth: [] as string[],
        isTourActive: false,
        tourStep: 0,
        activeToast: null,

        // ── Auth Lifecycle ──────────────────────────────────────────
        initAuthSession: async (user: any) => {
          // 0. Detach any prior onSnapshot listener
          if (activeSnapshotUnsubscribe) {
            activeSnapshotUnsubscribe();
            activeSnapshotUnsubscribe = null;
          }

          if (!user) {
            // NEVER wipe local state if auth drops, is unauthenticated, or sync fails
            let fallbackAccount: UserAccount | null = null;
            try {
              const rawDefault = localStorage.getItem('flouss_user_default');
              if (rawDefault) fallbackAccount = JSON.parse(rawDefault);
            } catch (e) {}

            const s = get();
            const currentAcc =
              s.accounts.find(
                (a: UserAccount) =>
                  (a.transactions && a.transactions.length > 0) ||
                  a.initialBalance !== null ||
                  Boolean(a.isOnboarded)
              ) ||
              s.accounts[0] ||
              fallbackAccount ||
              makeInitialAccount('default', 'Khalid');

            const extracted = extractAccountState(currentAcc);

            set({
              firebaseUser: null,
              loadingAuth: false,
              isPinVerified: false,
              userPinCode: null,
              accounts: s.accounts.length > 0 ? s.accounts : [currentAcc],
              activeAccountId: s.activeAccountId || currentAcc.id,
              ...extracted,
            });
            return;
          }

          const uid = user.uid;
          const userDocRef = doc(db, 'users', uid);

          // Requirement 3: Never check localStorage first to decide if isOnboarded is true.
          // Keep loadingAuth true so Apple shimmer skeleton renders while fetching from Firestore.
          set({
            firebaseUser: user,
            loadingAuth: true,
          });

          let firestorePin: string | null = null;
          let resolvedAccount: UserAccount | null = null;

          // 1. Gather any existing local data on this client device (e.g. from PC session)
          let legacyFocusTasks: FocusTask[] = [];
          try {
            const rawFT = localStorage.getItem('flouss_focus_tasks_v1');
            if (rawFT) {
              const parsed = JSON.parse(rawFT);
              if (Array.isArray(parsed) && parsed.length > 0) {
                legacyFocusTasks = parsed;
              }
            }
          } catch (e) {}

          let localAccount: UserAccount | null = null;
          try {
            const raw = localStorage.getItem(`flouss_user_${uid}`);
            if (raw) localAccount = JSON.parse(raw);
          } catch (e) {}

          if (!localAccount) {
            try {
              const rawDefault = localStorage.getItem('flouss_user_default');
              if (rawDefault) localAccount = JSON.parse(rawDefault);
            } catch (e) {}
          }

          if (localAccount) {
            localAccount.subscriptions = migrateSubscriptions(localAccount.subscriptions ?? DEFAULT_SUBSCRIPTIONS);
          }

          if (localAccount && legacyFocusTasks.length > 0 && (!localAccount.focusTasks || localAccount.focusTasks.length === 0)) {
            localAccount.focusTasks = legacyFocusTasks;
          }

          if (!localAccount) {
            const memAcc = get().accounts.find(
              (a: UserAccount) =>
                a.initialBalance !== null ||
                (a.transactions && a.transactions.length > 0) ||
                (a.notes && a.notes.length > 0) ||
                (a.subscriptions && a.subscriptions.length > 0)
            );
            if (memAcc) localAccount = memAcc;
          }

          const hasLocalData = Boolean(
            localAccount &&
              (localAccount.initialBalance !== null ||
                (Array.isArray(localAccount.transactions) && localAccount.transactions.length > 0) ||
                (Array.isArray(localAccount.notes) && localAccount.notes.length > 0) ||
                (Array.isArray(localAccount.subscriptions) && localAccount.subscriptions.length > 0) ||
                (Array.isArray(localAccount.focusTasks) && localAccount.focusTasks.length > 0) ||
                Boolean(localAccount.isOnboarded))
          );

          // 2. Query Firestore document users/{uid} directly (No artificial timeouts!)
          let snap: any = null;
          try {
            snap = await getDoc(userDocRef);
          } catch (err: any) {
            console.warn('[Flouss Cloud] Initial getDoc notice:', err?.message || err);
          }

          const cloudDocExists = Boolean(snap && snap.exists());
          const cloudData = cloudDocExists ? snap.data() : null;
          let shouldSyncRecoveredTransactions = false;

          if (cloudDocExists && cloudData) {
            // Start with cloud state, then recover local-only transactions left by an offline session.
            console.log(`☁️ [Flouss Cloud] Hydrating store from existing Firestore document users/${uid}...`);
            // Seed the monotonic guard with the remote version we are about to apply.
            lastAppliedRemoteUpdatedAt = remoteTimestampMs(cloudData);
            const applied = applyRemoteAccount(uid, cloudData, user);
            if (applied) {
              resolvedAccount = applied.finalSyncedAccount;
              firestorePin = applied.remotePin;
              if (localAccount) {
                const deletedIds = new Set([
                  ...(resolvedAccount.deletedTransactionIds || []),
                  ...(localAccount.deletedTransactionIds || []),
                ]);
                const remoteIds = new Set((resolvedAccount.transactions || []).map((tx) => tx.id));
                const recovered = (localAccount.transactions || []).filter((tx) => !remoteIds.has(tx.id) && !deletedIds.has(tx.id));
                const mergedTransactions = [...recovered, ...(resolvedAccount.transactions || [])]
                  .filter((tx) => !deletedIds.has(tx.id))
                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                shouldSyncRecoveredTransactions = recovered.length > 0 || deletedIds.size > (resolvedAccount.deletedTransactionIds || []).length;
                resolvedAccount = {
                  ...resolvedAccount,
                  deletedTransactionIds: Array.from(deletedIds),
                  transactions: mergedTransactions,
                  balance: calculateAvailableBalance(resolvedAccount.initialBalance, mergedTransactions),
                };
              }
            }
          } else if (snap !== null && !snap.exists() && hasLocalData && localAccount) {
            // Case A: Cloud Firestore document is verified missing AND this client has offline data -> AUTO-MIGRATE ONCE
            console.log(`🚀 [Flouss Cloud] Verified empty Firestore with existing local data. Auto-migrating to users/${uid}...`);
            const computedBal =
              localAccount.balance !== undefined && localAccount.balance !== null && !isNaN(localAccount.balance)
                ? localAccount.balance
                : calculateAvailableBalance(localAccount.initialBalance ?? null, localAccount.transactions ?? []);

            const migratedAccount: UserAccount = {
              ...makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || ''),
              ...localAccount,
              id: uid,
              balance: computedBal,
              isOnboarded: true,
            };
            firestorePin = migratedAccount.pinCode ?? null;
            resolvedAccount = migratedAccount;

            const migrationPayload = {
              uid,
              email: user.email || null,
              displayName: user.displayName || null,
              pinCode: firestorePin,
              pinEnabled: !!firestorePin,
              initialBalance: migratedAccount.initialBalance ?? null,
              balance: computedBal,
              isOnboarded: true,
              account: migratedAccount,
              createdAt: new Date().toISOString(),
              updatedAt: serverTimestamp(),
            };

            try {
              await setDoc(userDocRef, migrationPayload, { merge: true });
              console.log(`✅ [Flouss Cloud] Auto-migration successfully written to Firestore users/${uid}`);
            } catch (err) {
              console.error(`❌ [Flouss Cloud] Auto-migration write error:`, err);
            }
          } else if (localAccount) {
            // Case C: Offline fallback (e.g. network failure during getDoc) - read local cache without overwriting cloud
            const localBal =
              localAccount.balance !== undefined && localAccount.balance !== null && !isNaN(localAccount.balance)
                ? localAccount.balance
                : calculateAvailableBalance(localAccount.initialBalance ?? null, localAccount.transactions ?? []);

            resolvedAccount = {
              ...makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || ''),
              ...localAccount,
              id: uid,
              balance: localBal,
              focusTasks:
                localAccount.focusTasks && localAccount.focusTasks.length > 0
                  ? localAccount.focusTasks
                  : legacyFocusTasks.length > 0
                  ? legacyFocusTasks
                  : DEFAULT_FOCUS_TASKS,
              focusLists:
                localAccount.focusLists && localAccount.focusLists.length > 0
                  ? localAccount.focusLists
                  : DEFAULT_FOCUS_LISTS,
            };
          } else if (snap !== null && !snap.exists()) {
            // Case D: Completely new user registration
            const freshAccount = makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || '');
            if (legacyFocusTasks.length > 0) {
              freshAccount.focusTasks = legacyFocusTasks;
            }
            resolvedAccount = freshAccount;
            try {
              await setDoc(
                userDocRef,
                {
                  uid,
                  email: user.email || null,
                  displayName: user.displayName || null,
                  photoURL: user.photoURL || null,
                  pinCode: null,
                  pinEnabled: false,
                  initialBalance: null,
                  balance: 0,
                  account: freshAccount,
                  createdAt: new Date().toISOString(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
              console.log(`🆕 [Flouss Cloud] Created initial document for users/${uid}`);
            } catch (err) {}
          } else {
            // Firestore could not be read. Keep a local/offline view if available,
            // but never treat a read failure as proof that the account is new.
            console.warn(`[Flouss Cloud] Preserving existing cloud data: Firestore read failed for users/${uid}; no cloud write attempted.`);
            resolvedAccount = makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || '');
          }

          if (!resolvedAccount) {
            resolvedAccount = makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || '');
          }

          resolvedAccount.id = uid;
          resolvedAccount.subscriptions = migrateSubscriptions(resolvedAccount.subscriptions ?? DEFAULT_SUBSCRIPTIONS);
          if (!lastKnownTransactionsByUid.has(uid)) {
            lastKnownTransactionsByUid.set(uid, Array.isArray(resolvedAccount.transactions) ? resolvedAccount.transactions : []);
          }

          // Save hydrated account to local cache for fast offline access
          try {
            localStorage.setItem(`flouss_user_${uid}`, JSON.stringify(resolvedAccount));
            localStorage.setItem('flouss_user_default', JSON.stringify(resolvedAccount));
          } catch (e) {}

          const hasPin = Boolean(firestorePin && firestorePin.trim().length > 0);
          const sessionVerified = sessionStorage.getItem(`flouss_2fa_${uid}`) === 'verified';
          const isVerified = !hasPin || sessionVerified;

          set({
            firebaseUser: user,
            accounts: [resolvedAccount],
            activeAccountId: uid,
            userPinCode: hasPin ? firestorePin : null,
            isPinVerified: isVerified,
            isPinUnlocked: isVerified,
            loadingAuth: false,
            ...extractAccountState(resolvedAccount),
          });

          if (shouldSyncRecoveredTransactions) {
            executeImmediateFirestoreSync(uid, resolvedAccount);
          }

          // 3. Attach Real-Time Cross-Device Synchronization (onSnapshot)
          try {
            activeSnapshotUnsubscribe = onSnapshot(
              userDocRef,
              (snap: any) => {
                if (!snap.metadata?.fromCache) useAppStore.setState({ syncStatus: 'synced' });
                if (snap.metadata?.hasPendingWrites) return;
                if (!snap.exists()) return;

                const data = snap.data();
                if (!data) return;

                // Ignore out-of-order snapshots so the UI can never roll back to an
                // older balance than the one already shown.
                if (isStaleRemotePayload(data)) {
                  console.log(`⏭️ [Flouss Cloud] Skipping stale snapshot for users/${uid}`);
                  return;
                }

                const applied = applyRemoteAccount(uid, data, user);
                if (applied) {
                  const { finalSyncedAccount, remotePin } = applied;

                  set((state: any) => {
                    const existingAccounts = Array.isArray(state.accounts) ? state.accounts : [];
                    const otherAccounts = existingAccounts.filter((a: any) => a && a.id !== uid && a.id !== 'default');
                    return {
                      accounts: [finalSyncedAccount, ...otherAccounts],
                      activeAccountId: uid,
                      userPinCode: remotePin,
                      ...extractAccountState(finalSyncedAccount),
                    };
                  });
                  console.log(`🔄 [Flouss Cloud] Real-time sync update received and applied from Firestore users/${uid}`);
                }
              },
              (err: any) => {
                useAppStore.setState({ syncStatus: 'error' });
                console.warn('[Flouss Cloud] onSnapshot listener warning:', err?.message || err);
              }
            );
          } catch (err) {
            console.warn('[Flouss Cloud] Unable to bind onSnapshot listener:', err);
          }
        },

        verify2FAPin: async (enteredPin: string): Promise<boolean> => {
          const s = get();
          const correctPin = s.userPinCode || s.pinCode;
          if (!correctPin) return true;

          const { isValid, needsUpgrade } = await verifyPin(enteredPin, correctPin);
          if (isValid) {
            set({ isPinVerified: true, isPinUnlocked: true });
            if (s.firebaseUser?.uid) {
              sessionStorage.setItem(`flouss_2fa_${s.firebaseUser.uid}`, 'verified');
            }
            if (needsUpgrade) {
              // Backward compatibility: automatically upgrade legacy plain text PIN to SHA-256 hash
              try {
                const hashed = await hashPin(enteredPin);
                await get().setPinCode(hashed);
              } catch (e) {
                console.warn('[Flouss Security] Failed to auto-upgrade legacy PIN:', e);
              }
            }
            return true;
          }
          return false;
        },

        setPinVerified: (verified: boolean) => set({ isPinVerified: verified }),

        logout: async () => {
          if (activeSnapshotUnsubscribe) {
            activeSnapshotUnsubscribe();
            activeSnapshotUnsubscribe = null;
          }
          const uid = get().firebaseUser?.uid;
          if (uid) {
            sessionStorage.removeItem(`flouss_2fa_${uid}`);
          }
          try {
            await auth.signOut();
          } catch (e) {}
          set({
            firebaseUser: null,
            isPinVerified: false,
            userPinCode: null,
            accounts: [],
            activeAccountId: null,
            ...extractAccountState(null),
          });
        },

        syncToFirestore: async () => {
          const s = get();
          const uid = s.firebaseUser?.uid || auth.currentUser?.uid;
          if (!uid) return;

          const acc = s.currentAccount;
          if (!acc) return;

          // Always write to local storage first
          try {
            localStorage.setItem(`flouss_user_${uid}`, JSON.stringify(acc));
          } catch (e) {}

          debouncedFirestoreSync(uid, acc);
        },

        forceSyncToCloud: async () => {
          const s = get();
          const uid = s.firebaseUser?.uid || auth.currentUser?.uid;
          if (!uid) {
            return { success: false, message: 'Non connecté à un compte Firebase' };
          }
          const acc = s.currentAccount || (s.accounts || []).find((a: UserAccount) => a.id === uid) || s.accounts[0];
          if (!acc) {
            return { success: false, message: 'Aucun compte actif trouvé' };
          }
          try {
            const wrote = await pushAccountToFirestore(uid, acc, 'Manual');
            if (!wrote) {
              return {
                success: true,
                message: 'Cloud copy was newer — pulled the latest state',
              };
            }
            console.log(`✅ [Flouss Cloud] Manual force cloud sync succeeded for users/${uid}`);
            return { success: true, message: 'Cloud Synced with Firestore ✓' };
          } catch (err: any) {
            console.error(`❌ [Flouss Cloud] Manual force cloud sync failed for users/${uid}:`, err);
            return { success: false, message: err?.message || 'Firestore write error' };
          }
        },

        refreshFromFirestore: async () => {
          const s = get();
          const uid = s.firebaseUser?.uid || auth.currentUser?.uid;
          if (!uid) return;
          try {
            const userDocRef = doc(db, 'users', uid);
            const snap = await getDoc(userDocRef);
            if (snap && snap.exists()) {
              const data = snap.data();
              if (data && !isStaleRemotePayload(data)) {
                const remoteAccount = (data.account || data) as UserAccount;
                const localAccount = s.currentAccount;
                if (localAccount) {
                  const merged = mergeTransactionsFromLocalChanges(uid, localAccount, remoteAccount);
                  const localChangesPending =
                    JSON.stringify(merged.transactions) !== JSON.stringify(remoteAccount.transactions || []) ||
                    JSON.stringify(merged.deletedTransactionIds) !== JSON.stringify(remoteAccount.deletedTransactionIds || []);
                  if (localChangesPending) {
                    await pushAccountToFirestore(uid, localAccount, 'Reconnect recovery');
                    return;
                  }
                }
                applyRemotePayload(uid, data, s.firebaseUser);
                console.log(`⚡ [Flouss Cloud] refreshFromFirestore updated state from Firestore users/${uid}`);
              }
            }
          } catch (err: any) {
            console.warn('[Flouss Cloud] refreshFromFirestore notice:', err?.message || err);
          }
        },

        // ── UI Setters ──────────────────────────────────────────────
        setActiveScreen: (screen: ScreenId) => {
          set((state: any) => {
            if (state.activeScreen === screen) return state;
            const history = [...(state.screenHistory || []), state.activeScreen];
            return {
              activeScreen: screen,
              screenHistory: history.slice(-20),
              navigationDirection: 'forward',
            };
          });
          if (typeof window !== 'undefined') {
            const path = screen === 'dashboard' ? '/' : screen === 'stats' ? '/analytics' : `/${screen}`;
            if (window.location.pathname !== path) window.history.pushState({ screen }, '', path);
          }
        },

        navigateBack: () =>
          set((state: any) => {
            if (!state.screenHistory || state.screenHistory.length === 0) {
              if (state.activeScreen !== 'dashboard') {
                return { activeScreen: 'dashboard', navigationDirection: 'back' };
              }
              return state;
            }
            const history = [...state.screenHistory];
            const prevScreen = history.pop() || 'dashboard';
            return {
              activeScreen: prevScreen,
              screenHistory: history,
              navigationDirection: 'back',
            };
          }),
        setTheme: (theme: ThemeMode) => {
          const isDark =
            theme === 'dark'
              ? true
              : theme === 'light'
              ? false
              : typeof window !== 'undefined' &&
                Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

          applyThemeToDOM(isDark);
          set({ theme, isDarkMode: isDark });

          try {
            localStorage.setItem('flouss_theme', theme);
          } catch (e) {}

          updateActive((a) => ({ ...a, theme }));
        },
        toggleTheme: () => {
          const s = get();
          const currentIsDark =
            s.theme === 'dark'
              ? true
              : s.theme === 'light'
              ? false
              : typeof window !== 'undefined' &&
                Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);

          const nextTheme: ThemeMode = currentIsDark ? 'light' : 'dark';
          get().setTheme(nextTheme);
        },
        setLanguage: (language: Language) => {
          try {
            localStorage.setItem('flouss_manual_language_selected', 'true');
          } catch (e) {}
          set({ language });
        },
        resetLanguageToSystem: () => {
          try {
            localStorage.removeItem('flouss_manual_language_selected');
          } catch (e) {}
          const sys = detectSystemLanguage();
          set({ language: sys });
          return sys;
        },
        setHideBalance: (v: boolean) => set({ hideBalance: v, isBalanceHidden: v }),
        setIsBalanceHidden: (v: boolean) => set({ hideBalance: v, isBalanceHidden: v }),
        toggleHideBalance: () =>
          set((s: any) => ({
            hideBalance: !s.hideBalance,
            isBalanceHidden: !s.hideBalance,
          })),
        toggleBalanceHidden: () =>
          set((s: any) => ({
            hideBalance: !s.hideBalance,
            isBalanceHidden: !s.hideBalance,
          })),
        setPinUnlocked: (v: boolean) => set({ isPinUnlocked: v }),

        setPinCode: async (code: string | null) => {
          let finalPin = code;
          if (code && code.length === 4) {
            finalPin = await hashPin(code);
          }
          updateActive((a) => ({
            ...a,
            pinCode: finalPin,
            pinEnabled: !!finalPin,
          }));
          set({ userPinCode: finalPin, isPinUnlocked: true, isPinVerified: true });
          get().syncToFirestore();
        },

        // ── Onboarding / Initial Balance ───────────────────────────
        lockInitialBalance: async (
          amount: number,
          metadata?: { email?: string; pinCode?: string; accountName?: string }
        ) => {
          const s = get();
          const activeId = s.activeAccountId || s.accounts[0]?.id;
          const currentAcc = s.accounts.find((a: UserAccount) => a.id === activeId) || s.accounts[0];
          const uid = s.firebaseUser?.uid || currentAcc?.id || 'default_user';

          const rawPin =
            metadata?.pinCode && metadata.pinCode.length === 4
              ? metadata.pinCode
              : currentAcc?.pinCode ?? null;
          const pin = rawPin && rawPin.length === 4 ? await hashPin(rawPin) : rawPin;

          const updatedAccount: UserAccount = {
            ...(currentAcc ||
              makeInitialAccount(uid, metadata?.accountName || 'Utilisateur', metadata?.email || '')),
            initialBalance: amount,
            initialBalanceLockedAt: new Date().toISOString(),
            balance: amount,
            isOnboarded: true,
            name: metadata?.accountName || currentAcc?.name || 'Utilisateur',
            email: metadata?.email || currentAcc?.email || '',
            pinCode: pin,
            pinEnabled: !!pin,
          };

          const updatedAccounts =
            s.accounts.length > 0
              ? s.accounts.map((a: UserAccount) =>
                  a.id === updatedAccount.id ? updatedAccount : a
                )
              : [updatedAccount];

          // 1. Immediately persist to localStorage
          try {
            localStorage.setItem(`flouss_user_${uid}`, JSON.stringify(updatedAccount));
            if (pin) {
              sessionStorage.setItem(`flouss_2fa_${uid}`, 'verified');
            }
          } catch (e) {}

          // 2. Commit to store state immediately
          set({
            accounts: updatedAccounts,
            activeAccountId: updatedAccount.id,
            userPinCode: pin,
            isPinVerified: true,
            isPinUnlocked: true,
            ...extractAccountState(updatedAccount),
          });

          // 3. Sync to Firestore directly (No artificial timeout!)
          try {
            const userRef = doc(db, 'users', uid);
            await setDoc(
              userRef,
              {
                uid,
                email: updatedAccount.email || null,
                displayName: updatedAccount.name || null,
                pinCode: updatedAccount.pinCode ?? null,
                pinEnabled: !!updatedAccount.pinCode,
                initialBalance: amount,
                balance: amount,
                isOnboarded: true,
                account: updatedAccount,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
            console.log(`✅ [Flouss Cloud] lockInitialBalance saved to Firestore users/${uid}`);
          } catch (err: any) {
            console.error('❌ [Flouss Cloud] Error in lockInitialBalance Firestore write:', err);
          }
        },

        reconcileCurrentBalance: async (targetBalance: number) => {
          playHapticFeedback('success');
          const sanitizedTarget =
            typeof targetBalance === 'number' && !isNaN(targetBalance)
              ? Math.round(targetBalance * 100) / 100
              : parseFloat(String(targetBalance || 0)) || 0;

          const s = get();
          const activeId = s.activeAccountId || s.accounts[0]?.id;
          const currentAcc = s.accounts.find((a: UserAccount) => a.id === activeId) || s.accounts[0];
          if (!currentAcc) return;

          const currentBal = calculateAvailableBalance(
            currentAcc.initialBalance ?? null,
            currentAcc.transactions ?? []
          );
          const diff = Math.round((sanitizedTarget - currentBal) * 100) / 100;

          if (Math.abs(diff) < 0.001) return;

          const lang = s.language || 'fr';
          const adjustmentTx: Transaction = {
            id: `tx_adj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            type: 'adjustment',
            amount: diff,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            note:
              lang === 'ar'
                ? 'تعديل الرصيد'
                : lang === 'en'
                ? 'Balance Adjustment'
                : 'Ajustement du solde',
          };

          s.addTransaction(adjustmentTx);

          s.showToast({
            message:
              lang === 'ar'
                ? `تم تعديل الرصيد بنجاح (${sanitizedTarget} MAD)`
                : lang === 'en'
                ? `Balance adjusted to ${sanitizedTarget} MAD`
                : `Solde ajusté à ${sanitizedTarget} MAD`,
            actionText: lang === 'ar' ? 'تراجع' : lang === 'en' ? 'Undo' : 'Annuler',
            onAction: () => {
              get().deleteTransaction(adjustmentTx.id);
            },
          });
        },

        // ── Transactions ────────────────────────────────────────────
        addTransaction: (tx: Transaction) => {
          playHapticFeedback('success');
          const amt =
            typeof tx.amount === 'number' && !isNaN(tx.amount)
              ? tx.amount
              : parseFloat(String(tx.amount || 0)) || 0;
          const sanitizedTx: Transaction = { ...tx, amount: amt };
          updateActive((a) => {
            const updatedTransactions = [sanitizedTx, ...(a.transactions ?? [])];
            const newBalance = calculateAvailableBalance(a.initialBalance ?? null, updatedTransactions);

            return {
              ...a,
              balance: newBalance,
              deletedTransactionIds: (a.deletedTransactionIds || []).filter((deletedId) => deletedId !== sanitizedTx.id),
              transactions: updatedTransactions,
            };
          }, true);
        },
        deleteTransaction: (id: string) => {
          playHapticFeedback('medium');
          updateActive((a) => {
            const updatedTransactions = (a.transactions ?? []).filter((t: Transaction) => t.id !== id);
            const newBalance = calculateAvailableBalance(a.initialBalance ?? null, updatedTransactions);

            return {
              ...a,
              balance: newBalance,
              deletedTransactionIds: Array.from(new Set([...(a.deletedTransactionIds || []), id])),
              transactions: updatedTransactions,
            };
          }, true);
        },
        updateTransaction: (id: string, patch: Partial<Transaction>) => {
          playHapticFeedback('light');
          updateActive((a) => {
            const updatedTransactions = (a.transactions ?? []).map((t: Transaction) => {
              if (t.id !== id) return t;
              const patchedAmt =
                patch.amount !== undefined
                  ? typeof patch.amount === 'number' && !isNaN(patch.amount)
                    ? patch.amount
                    : parseFloat(String(patch.amount || 0)) || 0
                  : t.amount;
              return { ...t, ...patch, amount: patchedAmt };
            });
            const newBalance = calculateAvailableBalance(a.initialBalance ?? null, updatedTransactions);

            return {
              ...a,
              balance: newBalance,
              transactions: updatedTransactions,
            };
          }, true);
        },

        // ── Categories ──────────────────────────────────────────────
        addCategory: (cat: Category) => {
          updateActive((a) => ({
            ...a,
            categories: [...a.categories, cat],
          }));
        },
        updateCategory: (id: string, patch: Partial<Category>) => {
          updateActive((a) => ({
            ...a,
            categories: a.categories.map((c: Category) => (c.id === id ? { ...c, ...patch } : c)),
          }));
        },
        deleteCategory: (id: string) => {
          updateActive((a) => ({
            ...a,
            categories: a.categories.filter((c: Category) => c.id !== id),
            deletedCategoryIds: Array.from(new Set([...(a.deletedCategoryIds || []), id])),
          }));
        },

        // ── Income Sources ──────────────────────────────────────────
        addIncomeSource: (src: IncomeSource) => {
          updateActive((a) => ({
            ...a,
            incomeSources: [...a.incomeSources, src],
          }));
        },
        updateIncomeSource: (id: string, patch: Partial<IncomeSource>) => {
          updateActive((a) => ({
            ...a,
            incomeSources: a.incomeSources.map((s: IncomeSource) =>
              s.id === id ? { ...s, ...patch } : s
            ),
          }));
        },
        deleteIncomeSource: (id: string) => {
          updateActive((a) => ({
            ...a,
            incomeSources: a.incomeSources.filter((s: IncomeSource) => s.id !== id),
          }));
        },

        // ── Recurring Rules ─────────────────────────────────────────
        addRecurringRule: (rule: RecurringIncomeRule) => {
          updateActive((a) => ({
            ...a,
            recurringRules: [...a.recurringRules, rule],
          }));
        },
        confirmRecurringIncome: (ruleId: string, month: string, tx: Transaction) => {
          const amt =
            typeof tx.amount === 'number' && !isNaN(tx.amount)
              ? tx.amount
              : parseFloat(String(tx.amount || 0)) || 0;
          const sanitizedTx: Transaction = { ...tx, amount: amt };
          updateActive((a) => {
            const updatedTransactions = [sanitizedTx, ...(a.transactions ?? [])];
            const newBalance = calculateAvailableBalance(a.initialBalance ?? null, updatedTransactions);

            return {
              ...a,
              balance: newBalance,
              transactions: updatedTransactions,
              recurringRules: (a.recurringRules ?? []).map((r: RecurringIncomeRule) =>
                r.id === ruleId ? { ...r, lastConfirmedMonth: month } : r
              ),
            };
          }, true);
        },
        dismissRecurringPrompt: (month: string) => {
          const s = get();
          set({ dismissedRecurringForMonth: [...(s.dismissedRecurringForMonth ?? []), month] });
        },
        contributeToAllGoals: () => {
          updateActive((a) => {
            const activeGoals = (a.categories || []).filter(
              (c: Category) => c.isGoal && !c.isArchived && (c.targetAmount || 0) > 0
            );
            const newTxs: Transaction[] = [];
            let currentBal = calculateAvailableBalance(a.initialBalance ?? null, a.transactions ?? []);

            for (const goal of activeGoals) {
              const calc = calculateGoalProgress(goal, a.transactions || []);
              if (calc.status !== 'completed' && calc.monthlyNeeded > 0) {
                const amount = Math.min(calc.monthlyNeeded, Math.max(0, currentBal));
                if (amount > 0) {
                  currentBal -= amount;
                  newTxs.push({
                    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    type: 'contribution',
                    amount,
                    categoryId: goal.id,
                    date: new Date().toISOString(),
                    note: `Cotisation mensuelle auto : ${goal.name}`,
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
            if (newTxs.length === 0) return a;
            const updatedTransactions = [...newTxs, ...(a.transactions || [])];
            const newBalance = calculateAvailableBalance(a.initialBalance ?? null, updatedTransactions);

            return {
              ...a,
              balance: newBalance,
              transactions: updatedTransactions,
            };
          }, true);
        },

        // ── Tasks ───────────────────────────────────────────────────
        addTask: (task: TaskItem) => {
          updateActive((a) => ({
            ...a,
            tasks: [...(a.tasks ?? []), task],
          }));
        },
        updateTask: (id: string, patch: Partial<TaskItem>) => {
          updateActive((a) => ({
            ...a,
            tasks: (a.tasks ?? []).map((t: TaskItem) => (t.id === id ? { ...t, ...patch } : t)),
          }));
        },
        deleteTask: (id: string) => {
          updateActive((a) => ({
            ...a,
            tasks: (a.tasks ?? []).filter((t: TaskItem) => t.id !== id),
          }));
        },
        toggleTaskDone: (id: string, date: string) => {
          updateActive((a) => ({
            ...a,
            tasks: (a.tasks ?? []).map((t: TaskItem) => {
              if (t.id !== id) return t;
              const done = t.completedDates.includes(date);
              return {
                ...t,
                completedDates: done
                  ? t.completedDates.filter((d: string) => d !== date)
                  : [...t.completedDates, date],
              };
            }),
          }));
        },
        toggleTaskCompletion: (id: string, date: string) => {
          get().toggleTaskDone(id, date);
        },

        // ── Salat Tracking ───────────────────────────────────────────
        toggleSalatPrayer: (date: string, prayer: PrayerKey) => {
          updateActive((a) => {
            const currentSalat = a.salatLogs ?? {};
            const dayPrayers = currentSalat[date] ?? [];
            const isCompleted = dayPrayers.includes(prayer);
            const updatedPrayers = isCompleted
              ? dayPrayers.filter((p) => p !== prayer)
              : [...dayPrayers, prayer];
            return {
              ...a,
              salatLogs: {
                ...currentSalat,
                [date]: updatedPrayers,
              },
            };
          });
        },

        // ── Study Modules ───────────────────────────────────────────
        addStudyModule: (title: string, subject?: string, notes?: string) => {
          const trimmed = title.trim();
          if (!trimmed) return;
          const newModule: StudyModuleItem = {
            id: 'mod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            title: trimmed,
            subject: subject?.trim() || undefined,
            notes: notes?.trim() || undefined,
            completed: false,
            createdAt: new Date().toISOString(),
          };
          updateActive((a) => ({
            ...a,
            studyModules: [newModule, ...(a.studyModules ?? [])],
          }));
        },
        toggleStudyModule: (id: string) => {
          updateActive((a) => ({
            ...a,
            studyModules: (a.studyModules ?? []).map((m: StudyModuleItem) => {
              if (m.id !== id) return m;
              const nextCompleted = !m.completed;
              return {
                ...m,
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              };
            }),
          }));
        },
        deleteStudyModule: (id: string) => {
          updateActive((a) => ({
            ...a,
            studyModules: (a.studyModules ?? []).filter((m: StudyModuleItem) => m.id !== id),
          }));
        },
        updateStudyModule: (id: string, patch: Partial<StudyModuleItem>) => {
          updateActive((a) => ({
            ...a,
            studyModules: (a.studyModules ?? []).map((m: StudyModuleItem) =>
              m.id === id ? { ...m, ...patch } : m
            ),
          }));
        },

        // ── Gym & Workout Logs ──────────────────────────────────────
        addGymLog: (log: Omit<GymWorkoutLog, 'id' | 'createdAt'>) => {
          const newLog: GymWorkoutLog = {
            ...log,
            id: 'gym_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            createdAt: new Date().toISOString(),
          };
          updateActive((a) => ({
            ...a,
            gymLogs: [newLog, ...(a.gymLogs ?? [])],
          }));
        },
        deleteGymLog: (id: string) => {
          updateActive((a) => ({
            ...a,
            gymLogs: (a.gymLogs ?? []).filter((g: GymWorkoutLog) => g.id !== id),
          }));
        },

        // ── Program Tracks & Dynamic Sub-Tasks ──────────────────────
        addProgramTrack: (title: string, icon = '🎯', color = '#3b82f6') => {
          updateActive((a) => {
            const newTrack: ProgramTrack = {
              id: 'prog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              title: title.trim(),
              icon,
              color,
              type: 'custom',
              subtasks: [],
              createdAt: new Date().toISOString(),
            };
            return {
              ...a,
              programTracks: [...(a.programTracks ?? DEFAULT_PROGRAM_TRACKS), newTrack],
            };
          });
        },

        deleteProgramTrack: (trackId: string) => {
          updateActive((a) => ({
            ...a,
            programTracks: (a.programTracks ?? DEFAULT_PROGRAM_TRACKS).filter((t) => t.id !== trackId),
          }));
        },

        addProgramSubTask: (trackId: string, title: string, points = 10) => {
          updateActive((a) => {
            const currentTracks = a.programTracks ?? DEFAULT_PROGRAM_TRACKS;
            const newSub: ProgramSubTask = {
              id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              title: title.trim(),
              points,
              completedDates: [],
              createdAt: new Date().toISOString(),
            };
            return {
              ...a,
              programTracks: currentTracks.map((t) => {
                if (t.id === trackId) {
                  return {
                    ...t,
                    subtasks: [...(t.subtasks ?? []), newSub],
                  };
                }
                return t;
              }),
            };
          });
        },

        toggleProgramSubTask: (trackId: string, subTaskId: string, dateStr: string) => {
          updateActive((a) => {
            const currentTracks = a.programTracks ?? DEFAULT_PROGRAM_TRACKS;
            return {
              ...a,
              programTracks: currentTracks.map((t) => {
                if (t.id === trackId) {
                  return {
                    ...t,
                    subtasks: (t.subtasks ?? []).map((sub) => {
                      if (sub.id === subTaskId) {
                        const dates = sub.completedDates ?? [];
                        const isCompleted = dates.includes(dateStr);
                        const updatedDates = isCompleted
                          ? dates.filter((d) => d !== dateStr)
                          : [...dates, dateStr];
                        return { ...sub, completedDates: updatedDates };
                      }
                      return sub;
                    }),
                  };
                }
                return t;
              }),
            };
          });
        },

        deleteProgramSubTask: (trackId: string, subTaskId: string) => {
          updateActive((a) => {
            const currentTracks = a.programTracks ?? DEFAULT_PROGRAM_TRACKS;
            return {
              ...a,
              programTracks: currentTracks.map((t) => {
                if (t.id === trackId) {
                  return {
                    ...t,
                    subtasks: (t.subtasks ?? []).filter((sub) => sub.id !== subTaskId),
                  };
                }
                return t;
              }),
            };
          });
        },

        updateProgramSubTask: (trackId: string, subTaskId: string, patch: Partial<ProgramSubTask>) => {
          updateActive((a) => {
            const currentTracks = a.programTracks ?? DEFAULT_PROGRAM_TRACKS;
            return {
              ...a,
              programTracks: currentTracks.map((t) => {
                if (t.id === trackId) {
                  return {
                    ...t,
                    subtasks: (t.subtasks ?? []).map((sub) =>
                      sub.id === subTaskId ? { ...sub, ...patch } : sub
                    ),
                  };
                }
                return t;
              }),
            };
          });
        },

        // ── Focus Tasks & Custom Menus ("قائمتي") ───────────────────
        setActiveFocusListId: (id: string) => set({ activeFocusListId: id }),

        addFocusList: (name: string, color?: string) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          const newList: FocusListMenu = {
            id: 'fl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: trimmed,
            color: color || '#3b82f6',
            createdAt: new Date().toISOString(),
          };
          updateActive((a) => ({
            ...a,
            focusLists: [...(a.focusLists ?? DEFAULT_FOCUS_LISTS), newList],
          }));
          set({ activeFocusListId: newList.id });
        },

        deleteFocusList: (id: string) => {
          if (id === 'default') return;
          updateActive((a) => ({
            ...a,
            focusLists: (a.focusLists ?? DEFAULT_FOCUS_LISTS).filter((l) => l.id !== id),
            focusTasks: (a.focusTasks ?? []).filter((t) => t.listId !== id),
          }));
          set({ activeFocusListId: 'default' });
        },

        addFocusTask: (task: FocusTask) => {
          updateActive((a) => ({
            ...a,
            focusTasks: [task, ...(a.focusTasks ?? [])],
          }));
        },

        updateFocusTask: (id: string, patch: Partial<FocusTask>) => {
          updateActive((a) => ({
            ...a,
            focusTasks: (a.focusTasks ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
          }));
        },

        deleteFocusTask: (id: string) => {
          updateActive((a) => ({
            ...a,
            focusTasks: (a.focusTasks ?? []).filter((t) => t.id !== id),
          }));
        },

        toggleFocusTask: (id: string) => {
          updateActive((a) => ({
            ...a,
            focusTasks: (a.focusTasks ?? []).map((t) =>
              t.id === id ? { ...t, completed: !t.completed } : t
            ),
          }));
        },

        togglePinFocusTask: (id: string) => {
          updateActive((a) => ({
            ...a,
            focusTasks: (a.focusTasks ?? []).map((t) =>
              t.id === id ? { ...t, isPinned: !t.isPinned } : t
            ),
          }));
        },

        // ── Debts ───────────────────────────────────────────────────
        addDebt: (debt: DebtItem) => {
          updateActive((a) => ({
            ...a,
            debts: [...(a.debts ?? []), debt],
          }));
        },
        updateDebt: (id: string, patch: Partial<DebtItem>) => {
          updateActive((a) => ({
            ...a,
            debts: (a.debts ?? []).map((d: DebtItem) => (d.id === id ? { ...d, ...patch } : d)),
          }));
        },
        deleteDebt: (id: string) => {
          updateActive((a) => ({
            ...a,
            debts: (a.debts ?? []).filter((d: DebtItem) => d.id !== id),
          }));
        },
        settleDebt: (id: string) => {
          updateActive((a) => ({
            ...a,
            debts: (a.debts ?? []).map((d: DebtItem) =>
              d.id === id ? { ...d, isSettled: true, paidAmount: d.totalAmount } : d
            ),
          }));
        },
        recordDebtPayment: (id: string, amount: number) => {
          updateActive((a) => ({
            ...a,
            debts: (a.debts ?? []).map((d: DebtItem) => {
              if (d.id !== id) return d;
              const newPaid = Math.min(d.totalAmount, (d.paidAmount || 0) + amount);
              return {
                ...d,
                paidAmount: newPaid,
                isSettled: newPaid >= d.totalAmount,
              };
            }),
          }));
        },

        // ── Subscriptions ───────────────────────────────────────────
        addSubscription: (sub: SubscriptionItem) => {
          const migratedSub = migrateSubscription(sub);
          updateActive((a) => ({
            ...a,
            subscriptions: [...(a.subscriptions ?? []), migratedSub],
          }));
        },
        updateSubscription: (id: string, patch: Partial<SubscriptionItem>) => {
          updateActive((a) => ({
            ...a,
            subscriptions: (a.subscriptions ?? []).map((s: SubscriptionItem) =>
              s.id === id ? { ...s, ...patch } : s
            ),
          }));
        },
        deleteSubscription: (id: string) => {
          updateActive((a) => ({
            ...a,
            subscriptions: (a.subscriptions ?? []).filter((s: SubscriptionItem) => s.id !== id),
          }));
        },
        toggleSubscriptionPaid: (id: string, month: string) => {
          updateActive((a) => ({
            ...a,
            subscriptions: (a.subscriptions ?? []).map((s: SubscriptionItem) => {
              if (s.id !== id) return s;
              const paid = (s.paidMonths ?? []).includes(month);
              return {
                ...s,
                paidMonths: paid ? (s.paidMonths ?? []).filter((m: string) => m !== month) : [...(s.paidMonths ?? []), month],
              };
            }),
          }));
        },

        // ── Notes ───────────────────────────────────────────────────
        addNote: (note: NoteItem) => {
          updateActive((a) => ({
            ...a,
            notes: [note, ...(a.notes ?? [])],
          }));
        },
        addNoteItem: (note: NoteItem) => {
          get().addNote(note);
        },
        updateNote: (id: string, patch: Partial<NoteItem>) => {
          updateActive((a) => ({
            ...a,
            notes: (a.notes ?? []).map((n: NoteItem) =>
              n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
            ),
          }));
        },
        updateNoteItem: (id: string, patch: Partial<NoteItem>) => {
          get().updateNote(id, patch);
        },
        deleteNote: (id: string) => {
          updateActive((a) => ({
            ...a,
            notes: (a.notes ?? []).filter((n: NoteItem) => n.id !== id),
          }));
        },
        deleteNoteItem: (id: string) => {
          get().deleteNote(id);
        },
        togglePinNote: (id: string) => {
          updateActive((a) => ({
            ...a,
            notes: (a.notes ?? []).map((n: NoteItem) =>
              n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
            ),
          }));
        },

        // ── Meetings ────────────────────────────────────────────────
        addMeeting: (meeting: CalendarMeeting) => {
          updateActive((a) => ({
            ...a,
            meetings: [...(a.meetings ?? []), meeting],
          }));
        },
        deleteMeeting: (id: string) => {
          updateActive((a) => ({
            ...a,
            meetings: (a.meetings ?? []).filter((m: CalendarMeeting) => m.id !== id),
          }));
        },

        // ── Notification Settings ───────────────────────────────────
        updateNotificationSettings: (patch: Partial<NotificationSettings>) => {
          updateActive((a) => ({
            ...a,
            notificationSettings: {
              ...(a.notificationSettings ?? {
                soundEnabled: true,
                soundTone: 'chime',
                defaultBillLeadDays: 1,
                defaultTaskLeadMinutes: [10, 0],
                googleCalendarConnected: false,
                googleCalendarEmail: null,
              }),
              ...patch,
            },
          }));
        },

        // ── Tour ────────────────────────────────────────────────────
        startTour: () => set({ isTourActive: true, tourStep: 0 }),
        nextTourStep: () => set((s: any) => ({ tourStep: s.tourStep + 1 })),
        prevTourStep: () => set((s: any) => ({ tourStep: Math.max(0, s.tourStep - 1) })),
        endTour: () => set({ isTourActive: false, tourStep: 0 }),

        // ── Toast System ────────────────────────────────────────────
        showToast: (toast: { message: string; actionText?: string; onAction?: () => void }) => {
          set({ activeToast: toast });
        },
        clearToast: () => set({ activeToast: null }),

        // ── Local Accounts / Profiles ───────────────────────────────
        switchAccount: (id: string) => {
          const s = get();
          const target = s.accounts.find((a: UserAccount) => a.id === id);
          if (!target) return;
          set({
            activeAccountId: id,
            ...extractAccountState(target),
          });
        },
        createAccount: (name: string, email?: string, pin?: string, color?: string) => {
          const id = 'acc_' + Date.now();
          const newAcc: UserAccount = {
            ...makeInitialAccount(id, name, email),
            pinCode: pin || null,
            pinEnabled: !!pin,
            avatarColor: color || '#2383e2',
          };
          const s = get();
          const updatedAccounts = [...s.accounts, newAcc];
          set({
            accounts: updatedAccounts,
            activeAccountId: id,
            ...extractAccountState(newAcc),
          });
          get().syncToFirestore();
          return id;
        },
        updateAccount: (id: string, patch: Partial<UserAccount>) => {
          const s = get();
          const updatedAccounts = s.accounts.map((a: UserAccount) =>
            a.id === id ? { ...a, ...patch } : a
          );
          const current = updatedAccounts.find((a: UserAccount) => a.id === s.activeAccountId) || updatedAccounts[0];
          set({
            accounts: updatedAccounts,
            ...extractAccountState(current),
          });
          get().syncToFirestore();
        },
        deleteAccount: (id: string) => {
          const s = get();
          const updatedAccounts = s.accounts.filter((a: UserAccount) => a.id !== id);
          const nextAcc = updatedAccounts[0] || null;
          set({
            accounts: updatedAccounts,
            activeAccountId: nextAcc?.id || null,
            ...extractAccountState(nextAcc),
          });
          get().syncToFirestore();
        },

        // ── Backup / Export / Import ────────────────────────────────
        exportBackup: async () => {
          const s = get();
          const backupData = {
            accounts: s.accounts,
            theme: s.theme,
            language: s.language,
            exportedAt: new Date().toISOString(),
          };
          return await encryptBackup(backupData);
        },
        importBackup: async (rawContent: string): Promise<boolean> => {
          try {
            const data = await decryptBackup(rawContent);
            if (data && data.accounts && Array.isArray(data.accounts)) {
              const migratedAccounts = data.accounts.map((acc: UserAccount) => ({
                ...acc,
                subscriptions: migrateSubscriptions(acc.subscriptions ?? DEFAULT_SUBSCRIPTIONS),
              }));
              const active = migratedAccounts[0];
              set({
                accounts: migratedAccounts,
                activeAccountId: active?.id || null,
                theme: data.theme ?? 'system',
                language: data.language ?? 'ar',
                ...extractAccountState(active),
              });
              get().syncToFirestore();
              return true;
            }
            return false;
          } catch {
            return false;
          }
        },
        loadDemoData: () => {
          updateActive((a) => ({
            ...a,
            categories: DEFAULT_CATEGORIES,
            incomeSources: DEFAULT_INCOME_SOURCES,
          }));
        },
        resetAllData: () => {
          const uid = get().firebaseUser?.uid;
          if (uid) {
            localStorage.removeItem(`flouss_user_${uid}`);
            sessionStorage.removeItem(`flouss_2fa_${uid}`);
          }
          localStorage.removeItem('flouss_app_storage_v2');
          window.location.reload();
        },
      };
    },
    {
      name: 'flouss_app_storage_v2',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version < 1) {
          if (persistedState && Array.isArray(persistedState.accounts)) {
            persistedState.accounts = persistedState.accounts.map((acc: any) => ({
              ...acc,
              subscriptions: migrateSubscriptions(acc.subscriptions),
            }));
          }
          if (persistedState && Array.isArray(persistedState.subscriptions)) {
            persistedState.subscriptions = migrateSubscriptions(persistedState.subscriptions);
          }
        }
        return persistedState;
      },
      partialize: (state: any) => ({
        theme: state.theme,
        isDarkMode: state.isDarkMode,
        language: state.language,
        hideBalance: state.hideBalance,
        isBalanceHidden: state.isBalanceHidden,
        activeScreen: state.activeScreen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isDark =
            state.theme === 'dark'
              ? true
              : state.theme === 'light'
              ? false
              : typeof window !== 'undefined' &&
                Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
          applyThemeToDOM(isDark);

          if (Array.isArray(state.subscriptions)) {
            state.subscriptions = migrateSubscriptions(state.subscriptions);
          }
          if (Array.isArray(state.accounts)) {
            state.accounts = state.accounts.map((acc: UserAccount) => ({
              ...acc,
              subscriptions: migrateSubscriptions(acc.subscriptions),
            }));
          }
        }
      },
    }
  )
);

// Keep the store reachable from DevTools for owner initiated recovery workflows.
if (typeof window !== 'undefined') {
  (window as Window & { useAppStore?: typeof useAppStore }).useAppStore = useAppStore;
}
