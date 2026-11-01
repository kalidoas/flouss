import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
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
import { calculateAvailableBalance, calculateGoalProgress } from '../utils/calculations';

export interface AppState {
  // ── Auth & Session ──────────────────────────────────────────
  firebaseUser: any;
  loadingAuth: boolean;
  isPinVerified: boolean;
  userPinCode: string | null;
  isDemoMode: boolean;
  firestoreDisabled: boolean;

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

  // ── UI Preferences ──────────────────────────────────────────
  theme: ThemeMode;
  language: Language;
  activeScreen: ScreenId;
  isPinUnlocked: boolean;
  hideBalance: boolean;
  lastBackupDate: string | null;
  dismissedRecurringForMonth: string[];
  isTourActive: boolean;
  tourStep: number;
  activeToast: { message: string; actionText?: string; onAction?: () => void } | null;

  // ── Actions ─────────────────────────────────────────────────
  initAuthSession: (user: any) => Promise<void>;
  verify2FAPin: (pin: string) => boolean;
  setPinVerified: (verified: boolean) => void;
  logout: () => Promise<void>;
  syncToFirestore: () => Promise<void>;
  forceSyncToCloud: () => Promise<{ success: boolean; message: string }>;

  setActiveScreen: (screen: ScreenId) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  resetLanguageToSystem: () => Language;
  setHideBalance: (v: boolean) => void;
  toggleHideBalance: () => void;
  setPinUnlocked: (v: boolean) => void;
  setPinCode: (code: string | null) => Promise<void>;

  lockInitialBalance: (amount: number, metadata?: { email?: string; pinCode?: string; accountName?: string }) => Promise<void>;

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

  exportBackup: () => string;
  importBackup: (json: string) => boolean;
  loadDemoData: () => void;
  resetAllData: () => void;
  setDemoMode?: (v: boolean) => void;
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
    initialBalance: null,
    initialBalanceLockedAt: null,
    balance: 0,
    isOnboarded: false,
    categories: DEFAULT_CATEGORIES,
    incomeSources: DEFAULT_INCOME_SOURCES,
    transactions: [],
    recurringRules: [],
    recentNotes: [],
    tasks: DEFAULT_TASKS,
    focusTasks: DEFAULT_FOCUS_TASKS,
    focusLists: DEFAULT_FOCUS_LISTS,
    debts: DEFAULT_DEBTS,
    subscriptions: DEFAULT_SUBSCRIPTIONS,
    notes: DEFAULT_NOTES,
    deletedCategoryIds: [],
    salatLogs: {},
    studyModules: DEFAULT_STUDY_MODULES,
    gymLogs: DEFAULT_GYM_LOGS,
    programTracks: DEFAULT_PROGRAM_TRACKS,
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

  // Safe category hydration that respects deleted categories (Fixes Ghost Deletion Bug)
  const deletedIds = new Set(account.deletedCategoryIds || []);
  const accountCategories = (account.categories ?? DEFAULT_CATEGORIES).filter(
    (c: Category) => !deletedIds.has(c.id)
  );

  const resolvedBalance =
    account.balance !== undefined && account.balance !== null && !isNaN(account.balance)
      ? account.balance
      : calculateAvailableBalance(account.initialBalance ?? null, account.transactions ?? []);

  return {
    currentAccount: {
      ...account,
      balance: resolvedBalance,
    },
    isOnboarded: Boolean(account.isOnboarded),
    initialBalance: account.initialBalance ?? null,
    initialBalanceLockedAt: account.initialBalanceLockedAt ?? null,
    balance: resolvedBalance,
    categories: accountCategories,
    incomeSources: account.incomeSources ?? DEFAULT_INCOME_SOURCES,
    transactions: account.transactions ?? [],
    recurringRules: account.recurringRules ?? [],
    tasks: account.tasks ?? DEFAULT_TASKS,
    focusTasks: account.focusTasks ?? DEFAULT_FOCUS_TASKS,
    focusLists: account.focusLists ?? DEFAULT_FOCUS_LISTS,
    debts: account.debts ?? DEFAULT_DEBTS,
    subscriptions: account.subscriptions ?? DEFAULT_SUBSCRIPTIONS,
    notes: account.notes ?? DEFAULT_NOTES,
    salatLogs: account.salatLogs ?? {},
    studyModules: account.studyModules ?? DEFAULT_STUDY_MODULES,
    gymLogs: account.gymLogs ?? DEFAULT_GYM_LOGS,
    programTracks: account.programTracks ?? DEFAULT_PROGRAM_TRACKS,
    pinEnabled: Boolean(account.pinEnabled),
    pinCode: account.pinCode ?? null,
    recentNotes: account.recentNotes ?? [],
  };
}

let syncTimer: any = null;
let activeSnapshotUnsubscribe: Unsubscribe | null = null;

const debouncedFirestoreSync = (uid: string, account: UserAccount) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const userRef = doc(db, 'users', uid);
      const computedBal =
        account.balance !== undefined && account.balance !== null && !isNaN(account.balance)
          ? account.balance
          : calculateAvailableBalance(account.initialBalance ?? null, account.transactions ?? []);

      const payload = {
        uid,
        email: account.email || null,
        displayName: account.name || null,
        pinCode: account.pinCode ?? null,
        pinEnabled: !!account.pinCode,
        initialBalance: account.initialBalance ?? null,
        balance: computedBal,
        isOnboarded: Boolean(account.isOnboarded),
        account: {
          ...account,
          balance: computedBal,
        },
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, payload, { merge: true });
      console.log(`✅ [Flouss Cloud] Successfully synced mutation (balance: ${computedBal}) to Firestore users/${uid}`);
    } catch (err: any) {
      console.error(`❌ [Flouss Cloud] Error syncing to Firestore users/${uid}:`, err);
    }
  }, 150);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const initialAccount = makeInitialAccount('default', 'Khalid');

      // Helper to update active account and its reactive projections
      const updateActive = (updater: (acc: UserAccount) => UserAccount) => {
        const s = get();
        const activeId = s.activeAccountId || s.accounts[0]?.id;
        const currentAcc = s.accounts.find((a: UserAccount) => a.id === activeId) || s.accounts[0];
        if (!currentAcc) return;

        const updatedAcc = updater(currentAcc);
        const updatedAccounts = s.accounts.map((a: UserAccount) =>
          a.id === currentAcc.id ? updatedAcc : a
        );

        set({
          accounts: updatedAccounts,
          ...extractAccountState(updatedAcc),
        });

        get().syncToFirestore();
      };

      return {
        // ── Auth & Session ──────────────────────────────────────────
        firebaseUser: null,
        loadingAuth: true,
        isPinVerified: false,
        userPinCode: null,
        isDemoMode: false,
        firestoreDisabled: false,

        // ── Multi-Account State ─────────────────────────────────────
        accounts: [initialAccount],
        activeAccountId: initialAccount.id,

        // ── Active Account Reactive Fields ──────────────────────────
        ...extractAccountState(initialAccount),

        // ── UI Preferences ──────────────────────────────────────────
        theme: 'system' as ThemeMode,
        language: getInitialLanguage() as Language,
        activeScreen: 'dashboard' as ScreenId,
        activeFocusListId: 'default',
        isPinUnlocked: true,
        hideBalance: true, // Sensitive wealth blurred on startup by default (user requirement)
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
            set({
              firebaseUser: null,
              loadingAuth: false,
              isPinVerified: false,
              userPinCode: null,
              accounts: [],
              activeAccountId: null,
              ...extractAccountState(null),
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
          const cloudAccount = cloudData?.account || cloudData;

          const hasCloudData = Boolean(
            cloudDocExists &&
              (cloudData.initialBalance !== undefined ||
                cloudData.account?.initialBalance !== undefined ||
                (Array.isArray(cloudData.account?.transactions) && cloudData.account.transactions.length > 0) ||
                (Array.isArray(cloudData.transactions) && cloudData.transactions.length > 0) ||
                Boolean(cloudData.account?.isOnboarded) ||
                Boolean(cloudData.isOnboarded))
          );

          if (!hasCloudData && hasLocalData && localAccount) {
            // Case A: Cloud Firestore is empty, but this device has local data -> AUTO-MIGRATE IMMEDIATELY!
            console.log(`🚀 [Flouss Cloud] Empty Firestore detected with existing local data. Auto-migrating to users/${uid}...`);
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
              updatedAt: new Date().toISOString(),
            };

            try {
              await setDoc(userDocRef, migrationPayload, { merge: true });
              console.log(`✅ [Flouss Cloud] Auto-migration successfully written to Firestore users/${uid}`);
            } catch (err) {
              console.error(`❌ [Flouss Cloud] Auto-migration write error:`, err);
            }
          } else if (hasCloudData) {
            // Case B: Cloud Firestore has existing user document -> HYDRATE LOCAL STORE
            console.log(`☁️ [Flouss Cloud] Hydrating store from existing Firestore document users/${uid}...`);
            firestorePin = cloudData.pinCode ?? cloudAccount?.pinCode ?? null;

            const cloudFT = cloudAccount?.focusTasks ?? cloudData?.focusTasks;
            const resolvedFT =
              Array.isArray(cloudFT) && cloudFT.length > 0
                ? cloudFT
                : legacyFocusTasks.length > 0
                ? legacyFocusTasks
                : DEFAULT_FOCUS_TASKS;

            const cloudFL = cloudAccount?.focusLists ?? cloudData?.focusLists;
            const resolvedFL =
              Array.isArray(cloudFL) && cloudFL.length > 0
                ? cloudFL
                : DEFAULT_FOCUS_LISTS;

            const remoteBal =
              cloudAccount?.balance !== undefined && cloudAccount?.balance !== null && !isNaN(cloudAccount.balance)
                ? cloudAccount.balance
                : cloudData?.balance !== undefined && cloudData?.balance !== null && !isNaN(cloudData.balance)
                ? cloudData.balance
                : calculateAvailableBalance(
                    cloudAccount?.initialBalance ?? cloudData?.initialBalance ?? null,
                    cloudAccount?.transactions ?? cloudData?.transactions ?? []
                  );

            resolvedAccount = {
              ...makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || ''),
              ...cloudAccount,
              id: uid,
              balance: remoteBal,
              isOnboarded: true,
              pinCode: firestorePin,
              pinEnabled: !!firestorePin,
              focusTasks: resolvedFT,
              focusLists: resolvedFL,
            };

            // If cloud didn't have focusTasks yet but we had legacy local tasks, sync them up immediately!
            if (!cloudFT && legacyFocusTasks.length > 0) {
              debouncedFirestoreSync(uid, resolvedAccount);
            }
          } else if (localAccount) {
            // Case C: Fallback to localAccount
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
          } else {
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
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
              console.log(`🆕 [Flouss Cloud] Created initial document for users/${uid}`);
            } catch (err) {}
          }

          resolvedAccount.id = uid;

          // Save hydrated account to local cache for fast offline access
          try {
            localStorage.setItem(`flouss_user_${uid}`, JSON.stringify(resolvedAccount));
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

          // 3. Attach Real-Time Cross-Device Synchronization (onSnapshot)
          try {
            activeSnapshotUnsubscribe = onSnapshot(
              userDocRef,
              (snap) => {
                if (snap.metadata.hasPendingWrites) return;
                if (!snap.exists()) return;

                const data = snap.data();
                const incomingAccount = data?.account || data;
                if (incomingAccount) {
                  const currentLocal = get().currentAccount;
                  const incomingStr = JSON.stringify(incomingAccount);
                  const currentStr = JSON.stringify(currentLocal);

                  if (incomingStr !== currentStr) {
                    const remotePin = data.pinCode ?? incomingAccount?.pinCode ?? null;
                    const remoteBal =
                      incomingAccount?.balance !== undefined && incomingAccount?.balance !== null && !isNaN(incomingAccount.balance)
                        ? incomingAccount.balance
                        : data.balance !== undefined && data.balance !== null && !isNaN(data.balance)
                        ? data.balance
                        : calculateAvailableBalance(
                            incomingAccount?.initialBalance ?? null,
                            incomingAccount?.transactions ?? []
                          );

                    const syncedAccount: UserAccount = {
                      ...incomingAccount,
                      id: uid,
                      pinCode: remotePin,
                      pinEnabled: !!remotePin,
                      balance: remoteBal,
                    };

                    try {
                      localStorage.setItem(`flouss_user_${uid}`, incomingStr);
                    } catch (e) {}

                    set((state: any) => ({
                      accounts: state.accounts.map((a: any) => (a.id === uid ? syncedAccount : a)),
                      userPinCode: remotePin,
                      ...extractAccountState(syncedAccount),
                    }));
                    console.log(`🔄 [Flouss Cloud] Real-time sync update received from Firestore users/${uid}`);
                  }
                }
              },
              (err) => {
                console.warn('[Flouss Cloud] onSnapshot listener warning:', err?.message || err);
              }
            );
          } catch (err) {
            console.warn('[Flouss Cloud] Unable to bind onSnapshot listener:', err);
          }
        },

        verify2FAPin: (enteredPin: string) => {
          const s = get();
          const correctPin = s.userPinCode || s.pinCode;
          if (!correctPin) return true;
          if (enteredPin === correctPin) {
            set({ isPinVerified: true, isPinUnlocked: true });
            if (s.firebaseUser?.uid) {
              sessionStorage.setItem(`flouss_2fa_${s.firebaseUser.uid}`, 'verified');
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
          const acc = s.currentAccount || s.accounts.find((a) => a.id === uid) || s.accounts[0];
          if (!acc) {
            return { success: false, message: 'Aucun compte actif trouvé' };
          }
          try {
            const userRef = doc(db, 'users', uid);
            const computedBal =
              acc.balance !== undefined && acc.balance !== null && !isNaN(acc.balance)
                ? acc.balance
                : calculateAvailableBalance(acc.initialBalance ?? null, acc.transactions ?? []);

            const payload = {
              uid,
              email: acc.email || s.firebaseUser?.email || null,
              displayName: acc.name || s.firebaseUser?.displayName || null,
              pinCode: acc.pinCode ?? null,
              pinEnabled: !!acc.pinCode,
              initialBalance: acc.initialBalance ?? null,
              balance: computedBal,
              isOnboarded: Boolean(acc.isOnboarded),
              account: {
                ...acc,
                balance: computedBal,
              },
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, payload, { merge: true });
            console.log(`✅ [Flouss Cloud] Manual force cloud sync succeeded for users/${uid}`);
            return { success: true, message: 'Cloud Synced with Firestore ✓' };
          } catch (err: any) {
            console.error(`❌ [Flouss Cloud] Manual force cloud sync failed for users/${uid}:`, err);
            return { success: false, message: err?.message || 'Firestore write error' };
          }
        },

        // ── UI Setters ──────────────────────────────────────────────
        setActiveScreen: (screen: ScreenId) => set({ activeScreen: screen }),
        setTheme: (theme: ThemeMode) => set({ theme }),
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
        setHideBalance: (v: boolean) => set({ hideBalance: v }),
        toggleHideBalance: () => set((s: any) => ({ hideBalance: !s.hideBalance })),
        setPinUnlocked: (v: boolean) => set({ isPinUnlocked: v }),

        setPinCode: async (code: string | null) => {
          updateActive((a) => ({
            ...a,
            pinCode: code,
            pinEnabled: !!code,
          }));
          set({ userPinCode: code, isPinUnlocked: true, isPinVerified: true });
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

          const pin =
            metadata?.pinCode && metadata.pinCode.length === 4
              ? metadata.pinCode
              : currentAcc?.pinCode ?? null;

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

        // ── Transactions ────────────────────────────────────────────
        addTransaction: (tx: Transaction) => {
          const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : parseFloat(String(tx.amount || 0)) || 0;
          updateActive((a) => {
            const currentBal =
              a.balance !== undefined && a.balance !== null && !isNaN(a.balance)
                ? a.balance
                : calculateAvailableBalance(a.initialBalance ?? null, a.transactions ?? []);

            let newBalance = currentBal;
            if (tx.type === 'income' || tx.type === 'goal_withdraw') {
              newBalance = currentBal + amt;
            } else if (tx.type === 'expense' || tx.type === 'contribution') {
              newBalance = currentBal - amt;
            }

            return {
              ...a,
              balance: newBalance,
              transactions: [{ ...tx, amount: amt }, ...(a.transactions ?? [])],
            };
          });
        },
        deleteTransaction: (id: string) => {
          updateActive((a) => {
            const txToDelete = (a.transactions ?? []).find((t: Transaction) => t.id === id);
            if (!txToDelete) return a;

            const amt = typeof txToDelete.amount === 'number' && !isNaN(txToDelete.amount)
              ? txToDelete.amount
              : parseFloat(String(txToDelete.amount || 0)) || 0;

            const currentBal =
              a.balance !== undefined && a.balance !== null && !isNaN(a.balance)
                ? a.balance
                : calculateAvailableBalance(a.initialBalance ?? null, a.transactions ?? []);

            let newBalance = currentBal;
            if (txToDelete.type === 'income' || txToDelete.type === 'goal_withdraw') {
              newBalance = currentBal - amt;
            } else if (txToDelete.type === 'expense' || txToDelete.type === 'contribution') {
              newBalance = currentBal + amt;
            }

            return {
              ...a,
              balance: newBalance,
              transactions: (a.transactions ?? []).filter((t: Transaction) => t.id !== id),
            };
          });
        },
        updateTransaction: (id: string, patch: Partial<Transaction>) => {
          updateActive((a) => {
            const oldTx = (a.transactions ?? []).find((t: Transaction) => t.id === id);
            if (!oldTx) return a;

            const updatedTx: Transaction = { ...oldTx, ...patch };
            const oldAmt = typeof oldTx.amount === 'number' && !isNaN(oldTx.amount)
              ? oldTx.amount
              : parseFloat(String(oldTx.amount || 0)) || 0;
            const newAmt = typeof updatedTx.amount === 'number' && !isNaN(updatedTx.amount)
              ? updatedTx.amount
              : parseFloat(String(updatedTx.amount || 0)) || 0;

            const currentBal =
              a.balance !== undefined && a.balance !== null && !isNaN(a.balance)
                ? a.balance
                : calculateAvailableBalance(a.initialBalance ?? null, a.transactions ?? []);

            let net = currentBal;
            if (oldTx.type === 'income' || oldTx.type === 'goal_withdraw') {
              net -= oldAmt;
            } else if (oldTx.type === 'expense' || oldTx.type === 'contribution') {
              net += oldAmt;
            }

            if (updatedTx.type === 'income' || updatedTx.type === 'goal_withdraw') {
              net += newAmt;
            } else if (updatedTx.type === 'expense' || updatedTx.type === 'contribution') {
              net -= newAmt;
            }

            return {
              ...a,
              balance: net,
              transactions: (a.transactions ?? []).map((t: Transaction) =>
                t.id === id ? { ...updatedTx, amount: newAmt } : t
              ),
            };
          });
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
          const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : parseFloat(String(tx.amount || 0)) || 0;
          updateActive((a) => {
            const currentBal =
              a.balance !== undefined && a.balance !== null && !isNaN(a.balance)
                ? a.balance
                : calculateAvailableBalance(a.initialBalance ?? null, a.transactions ?? []);

            const newBalance = currentBal + amt;

            return {
              ...a,
              balance: newBalance,
              transactions: [{ ...tx, amount: amt }, ...a.transactions],
              recurringRules: a.recurringRules.map((r: RecurringIncomeRule) =>
                r.id === ruleId ? { ...r, lastConfirmedMonth: month } : r
              ),
            };
          });
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
            let currentBal =
              a.balance !== undefined && a.balance !== null && !isNaN(a.balance)
                ? a.balance
                : calculateAvailableBalance(a.initialBalance ?? null, a.transactions ?? []);

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
            return {
              ...a,
              balance: currentBal,
              transactions: [...newTxs, ...(a.transactions || [])],
            };
          });
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
          updateActive((a) => ({
            ...a,
            subscriptions: [...(a.subscriptions ?? []), sub],
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
              const paid = s.paidMonths.includes(month);
              return {
                ...s,
                paidMonths: paid ? s.paidMonths.filter((m: string) => m !== month) : [...s.paidMonths, month],
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
        exportBackup: () => {
          const s = get();
          return JSON.stringify({
            accounts: s.accounts,
            theme: s.theme,
            language: s.language,
            exportedAt: new Date().toISOString(),
          });
        },
        importBackup: (json: string) => {
          try {
            const data = JSON.parse(json);
            if (data.accounts && Array.isArray(data.accounts)) {
              const active = data.accounts[0];
              set({
                accounts: data.accounts,
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
      partialize: (state: any) => ({
        theme: state.theme,
        language: state.language,
        hideBalance: state.hideBalance,
        activeScreen: state.activeScreen,
      }),
    }
  )
);
