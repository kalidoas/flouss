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
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_SOURCES,
  DEFAULT_TASKS,
  DEFAULT_DEBTS,
  DEFAULT_SUBSCRIPTIONS,
  DEFAULT_NOTES,
} from './defaultData';

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
  categories: Category[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
  recurringRules: RecurringIncomeRule[];
  tasks: TaskItem[];
  debts: DebtItem[];
  subscriptions: SubscriptionItem[];
  notes: NoteItem[];
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

  setActiveScreen: (screen: ScreenId) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
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
    isOnboarded: false,
    categories: DEFAULT_CATEGORIES,
    incomeSources: DEFAULT_INCOME_SOURCES,
    transactions: [],
    recurringRules: [],
    recentNotes: [],
    tasks: DEFAULT_TASKS,
    debts: DEFAULT_DEBTS,
    subscriptions: DEFAULT_SUBSCRIPTIONS,
    notes: DEFAULT_NOTES,
    createdAt: new Date().toISOString(),
  };
}

export function extractAccountState(account: UserAccount | null) {
  if (!account) {
    return {
      currentAccount: null,
      isOnboarded: false,
      initialBalance: null,
      initialBalanceLockedAt: null,
      categories: DEFAULT_CATEGORIES,
      incomeSources: DEFAULT_INCOME_SOURCES,
      transactions: [],
      recurringRules: [],
      tasks: DEFAULT_TASKS,
      debts: DEFAULT_DEBTS,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      notes: DEFAULT_NOTES,
      pinEnabled: false,
      pinCode: null,
      recentNotes: [],
    };
  }
  return {
    currentAccount: account,
    isOnboarded: Boolean(account.isOnboarded),
    initialBalance: account.initialBalance ?? null,
    initialBalanceLockedAt: account.initialBalanceLockedAt ?? null,
    categories: account.categories ?? DEFAULT_CATEGORIES,
    incomeSources: account.incomeSources ?? DEFAULT_INCOME_SOURCES,
    transactions: account.transactions ?? [],
    recurringRules: account.recurringRules ?? [],
    tasks: account.tasks ?? DEFAULT_TASKS,
    debts: account.debts ?? DEFAULT_DEBTS,
    subscriptions: account.subscriptions ?? DEFAULT_SUBSCRIPTIONS,
    notes: account.notes ?? DEFAULT_NOTES,
    pinEnabled: Boolean(account.pinEnabled),
    pinCode: account.pinCode ?? null,
    recentNotes: account.recentNotes ?? [],
  };
}

let syncTimer: any = null;
let isFirestoreApiDisabled = false;
let activeSnapshotUnsubscribe: Unsubscribe | null = null;

const debouncedFirestoreSync = (uid: string, account: UserAccount) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    if (isFirestoreApiDisabled) return;
    try {
      const userRef = doc(db, 'users', uid);
      await Promise.race([
        setDoc(
          userRef,
          {
            uid,
            email: account.email || null,
            displayName: account.name || null,
            pinCode: account.pinCode ?? null,
            pinEnabled: !!account.pinCode,
            account,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 3500)),
      ]);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('has not been used in project') ||
        msg.includes('disabled')
      ) {
        isFirestoreApiDisabled = true;
        console.warn('[Flouss] Cloud Firestore API is not enabled in Firebase Console. Continuing in safe offline-first mode.');
      } else {
        console.warn('[Flouss] Firestore sync warning:', msg);
      }
    }
  }, 400);
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
        language: 'ar' as Language,
        activeScreen: 'dashboard' as ScreenId,
        isPinUnlocked: true,
        hideBalance: false,
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

          if (!isFirestoreApiDisabled) {
            try {
              const snap = (await Promise.race([
                getDoc(userDocRef),
                new Promise<null>((_, reject) =>
                  setTimeout(() => reject(new Error('Firestore read timeout')), 10000)
                ),
              ])) as any;

              if (snap && snap.exists()) {
                const data = snap.data();
                firestorePin = data.pinCode ?? data.account?.pinCode ?? null;
                const incomingAccount = data.account || data;

                const hasExistingData =
                  Boolean(data.account?.isOnboarded) ||
                  Boolean(data.isOnboarded) ||
                  data.account?.initialBalance !== undefined ||
                  data.initialBalance !== undefined ||
                  (Array.isArray(data.account?.transactions) && data.account.transactions.length > 0) ||
                  (Array.isArray(data.transactions) && data.transactions.length > 0) ||
                  (Array.isArray(data.account?.categories) && data.account.categories.length > 0);

                resolvedAccount = {
                  ...makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || ''),
                  ...incomingAccount,
                  id: uid,
                  isOnboarded: hasExistingData ? true : Boolean(incomingAccount?.isOnboarded),
                  pinCode: firestorePin,
                  pinEnabled: !!firestorePin,
                };
              }
            } catch (err: any) {
              const msg = err?.message || String(err);
              if (
                msg.includes('PERMISSION_DENIED') ||
                msg.includes('has not been used in project') ||
                msg.includes('disabled')
              ) {
                isFirestoreApiDisabled = true;
                set({ firestoreDisabled: true });
                console.warn('[Flouss] Cloud Firestore API disabled or uninitialized. Using local storage.');
              } else {
                console.warn('[Flouss] Firestore check notice:', msg);
              }
            }
          }

          // Fallback to local storage if Firestore had no document or timed out
          if (!resolvedAccount) {
            try {
              const raw = localStorage.getItem(`flouss_user_${uid}`);
              if (raw) {
                const local = JSON.parse(raw);
                firestorePin = local?.pinCode ?? null;
                resolvedAccount = {
                  ...makeInitialAccount(uid, user.displayName || 'Utilisateur', user.email || ''),
                  ...local,
                  id: uid,
                };
              }
            } catch (e) {}
          }

          // If still no account (truly new user registration)
          if (!resolvedAccount) {
            const freshAccount = makeInitialAccount(
              uid,
              user.displayName || 'Utilisateur',
              user.email || ''
            );
            resolvedAccount = freshAccount;

            if (!isFirestoreApiDisabled) {
              setDoc(
                userDocRef,
                {
                  uid,
                  email: user.email || null,
                  displayName: user.displayName || null,
                  photoURL: user.photoURL || null,
                  pinCode: null,
                  pinEnabled: false,
                  account: freshAccount,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              ).catch(() => {});
            }
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
          if (!isFirestoreApiDisabled) {
            try {
              activeSnapshotUnsubscribe = onSnapshot(
                userDocRef,
                (snap) => {
                  // Ignore local write echoes to avoid re-triggering loops
                  if (snap.metadata.hasPendingWrites) return;
                  if (!snap.exists()) return;

                  const data = snap.data();
                  if (data?.account) {
                    const currentLocal = get().currentAccount;
                    const incomingStr = JSON.stringify(data.account);
                    const currentStr = JSON.stringify(currentLocal);

                    // Only update if remote state from other device has differences
                    if (incomingStr !== currentStr) {
                      const remotePin = data.pinCode ?? data.account?.pinCode ?? null;
                      const syncedAccount: UserAccount = {
                        ...data.account,
                        id: uid,
                        pinCode: remotePin,
                        pinEnabled: !!remotePin,
                      };

                      try {
                        localStorage.setItem(`flouss_user_${uid}`, incomingStr);
                      } catch (e) {}

                      set((state: any) => ({
                        accounts: state.accounts.map((a: any) => (a.id === uid ? syncedAccount : a)),
                        userPinCode: remotePin,
                        ...extractAccountState(syncedAccount),
                      }));
                    }
                  }
                },
                (err) => {
                  const msg = err?.message || String(err);
                  if (
                    msg.includes('PERMISSION_DENIED') ||
                    msg.includes('has not been used in project') ||
                    msg.includes('disabled')
                  ) {
                    isFirestoreApiDisabled = true;
                  }
                }
              );
            } catch (err) {
              console.warn('[Flouss] Unable to bind onSnapshot listener:', err);
            }
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

        // ── UI Setters ──────────────────────────────────────────────
        setActiveScreen: (screen: ScreenId) => set({ activeScreen: screen }),
        setTheme: (theme: ThemeMode) => set({ theme }),
        setLanguage: (language: Language) => set({ language }),
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

          // 3. Sync to Firestore in background without blocking
          if (!isFirestoreApiDisabled) {
            try {
              const userRef = doc(db, 'users', uid);
              await Promise.race([
                setDoc(
                  userRef,
                  {
                    uid,
                    email: updatedAccount.email || null,
                    displayName: updatedAccount.name || null,
                    pinCode: updatedAccount.pinCode ?? null,
                    pinEnabled: !!updatedAccount.pinCode,
                    account: updatedAccount,
                    updatedAt: new Date().toISOString(),
                  },
                  { merge: true }
                ),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Firestore lockInitialBalance timeout')), 3000)
                ),
              ]);
            } catch (err: any) {
              const msg = err?.message || String(err);
              if (
                msg.includes('PERMISSION_DENIED') ||
                msg.includes('has not been used in project') ||
                msg.includes('disabled')
              ) {
                isFirestoreApiDisabled = true;
                set({ firestoreDisabled: true });
                console.warn('[Flouss] Cloud Firestore API is not enabled in Firebase Console. Saved locally.');
              } else {
                console.warn('[Flouss] Firestore initial balance sync warning:', msg);
              }
            }
          }
        },

        // ── Transactions ────────────────────────────────────────────
        addTransaction: (tx: Transaction) => {
          updateActive((a) => ({
            ...a,
            transactions: [tx, ...a.transactions],
          }));
        },
        deleteTransaction: (id: string) => {
          updateActive((a) => ({
            ...a,
            transactions: a.transactions.filter((t: Transaction) => t.id !== id),
          }));
        },
        updateTransaction: (id: string, patch: Partial<Transaction>) => {
          updateActive((a) => ({
            ...a,
            transactions: a.transactions.map((t: Transaction) =>
              t.id === id ? { ...t, ...patch } : t
            ),
          }));
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
          updateActive((a) => ({
            ...a,
            transactions: [tx, ...a.transactions],
            recurringRules: a.recurringRules.map((r: RecurringIncomeRule) =>
              r.id === ruleId ? { ...r, lastConfirmedMonth: month } : r
            ),
          }));
        },
        dismissRecurringPrompt: (month: string) => {
          const s = get();
          set({ dismissedRecurringForMonth: [...(s.dismissedRecurringForMonth ?? []), month] });
        },
        contributeToAllGoals: () => {},

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
