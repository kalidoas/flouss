import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

export const useAppStore = create<any>()(
  persist(
    (set, get) => ({
      // ... (كاع الـ State ديالك) ...
      // يرجى ملاحظة: هنا كيكون كاع الكود ديالك الأصلي، أنا حطيت الهيكل الأساسي
      tasks: DEFAULT_TASKS,
    }),
    {
      name: 'flouss_app_storage_v2',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const user = auth.currentUser;
          if (user) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return JSON.stringify(docSnap.data());
          }
          return localStorage.getItem(name);
        },
        setItem: async (name, value) => {
          const user = auth.currentUser;
          if (user) {
            await setDoc(doc(db, 'users', user.uid), JSON.parse(value));
          }
          localStorage.setItem(name, value);
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
);
