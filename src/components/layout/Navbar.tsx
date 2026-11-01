import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { ScreenId } from '../../types';
import { translations } from '../../i18n/translations';
import { islandManager } from '../../utils/islandManager';
import { triggerHaptic } from '../../utils/haptics';
import { UserProfileModal } from '../profile/UserProfileModal';
import { AddExpenseModal } from '../transactions/AddExpenseModal';
import { AddIncomeModal } from '../transactions/AddIncomeModal';
import {
  LayoutDashboard,
  Layers,
  Plus,
  CheckSquare,
  Menu,
  FileText,
  HandCoins,
  CreditCard,
  BarChart3,
  History,
  Settings,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Pin,
  User,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    language,
    logout,
    accounts,
    activeAccountId,
    firebaseUser,
    addNoteItem,
  } = useAppStore();

  const t = translations[language].nav;
  const tHub = translations[language].priorityHub;
  const isAr = language === 'ar';

  const activeAccount =
    (accounts || []).find((a) => a.id === activeAccountId) ||
    (accounts || [])[0] ||
    (firebaseUser
      ? {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Utilisateur',
          email: firebaseUser.email || '',
          avatarColor: '#2383e2',
        }
      : null);

  // Mobile drawer and modal states
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);

  // Quick note modal state
  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteContent, setQuickNoteContent] = useState('');

  const moreScreens: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'notes', label: t.notes, icon: FileText },
    { id: 'debts', label: t.debts, icon: HandCoins },
    { id: 'subscriptions', label: t.subscriptions, icon: CreditCard },
    { id: 'stats', label: t.stats, icon: BarChart3 },
    { id: 'history', label: t.history, icon: History },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteTitle.trim() && !quickNoteContent.trim()) return;

    const now = new Date().toISOString();
    const fallbackTitle =
      isAr ? 'ملاحظة مثبتة' : language === 'en' ? 'Pinned Note' : 'Rappel urgent';

    addNoteItem({
      id: 'note_' + Date.now(),
      title: quickNoteTitle.trim() || fallbackTitle,
      content: quickNoteContent.trim(),
      isPinned: true,
      color: '#f59e0b',
      createdAt: now,
      updatedAt: now,
    });

    setQuickNoteTitle('');
    setQuickNoteContent('');
    setIsQuickNoteModalOpen(false);

    islandManager.notify({
      type: 'pin',
      title: tHub.pinnedNotes,
      subtitle: quickNoteTitle.trim() || fallbackTitle,
    });
  };

  const isMoreActive =
    isMoreMenuOpen ||
    ['notes', 'debts', 'subscriptions', 'stats', 'history', 'settings'].includes(activeScreen);

  return (
    <>
      {/* Native Apple iOS Frosted Glass Dock */}
      <nav className="md:hidden fixed bottom-0 w-full pb-safe pt-2.5 px-4 backdrop-blur-2xl bg-white/80 dark:bg-zinc-900/80 border-t border-black/[0.08] dark:border-white/10 z-50 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => {
            triggerHaptic(30);
            setActiveScreen('dashboard');
          }}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeScreen === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {activeScreen === 'dashboard' && (
            <motion.div
              layoutId="mobile-dock-active"
              className="absolute inset-x-2 inset-y-0.5 bg-blue-500/10 dark:bg-white/15 rounded-2xl -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <LayoutDashboard
            className={`w-5 h-5 ${
              activeScreen === 'dashboard' ? 'stroke-[2.4] text-blue-600 dark:text-blue-400' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">{t.dashboard}</span>
        </button>

        {/* Tab 2: Categories */}
        <button
          onClick={() => {
            triggerHaptic(30);
            setActiveScreen('categories');
          }}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeScreen === 'categories'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {activeScreen === 'categories' && (
            <motion.div
              layoutId="mobile-dock-active"
              className="absolute inset-x-2 inset-y-0.5 bg-blue-500/10 dark:bg-white/15 rounded-2xl -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <Layers
            className={`w-5 h-5 ${
              activeScreen === 'categories' ? 'stroke-[2.4] text-blue-600 dark:text-blue-400' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">{t.categories}</span>
        </button>

        {/* Tab 3 (Center): Elevated Prominent '+' Action Button */}
        <div className="flex-1 flex items-center justify-center relative -top-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              triggerHaptic(40);
              setIsActionSheetOpen(true);
            }}
            title={isAr ? 'إضافة معاملة سريعة' : language === 'en' ? 'Add Transaction' : 'Ajouter une transaction'}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-[0_0_24px_rgba(59,130,246,0.65),0_6px_16px_rgba(0,0,0,0.4)] border border-white/30 active:shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all"
            aria-label={isAr ? 'إضافة معاملة سريعة' : language === 'en' ? 'Add Transaction' : 'Ajouter une transaction'}
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
            <span className="sr-only">Add</span>
          </motion.button>
        </div>

        {/* Tab 4: Program (Tasks) */}
        <button
          onClick={() => {
            triggerHaptic(30);
            setActiveScreen('tasks');
          }}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeScreen === 'tasks'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {activeScreen === 'tasks' && (
            <motion.div
              layoutId="mobile-dock-active"
              className="absolute inset-x-2 inset-y-0.5 bg-blue-500/10 dark:bg-white/15 rounded-2xl -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <CheckSquare
            className={`w-5 h-5 ${
              activeScreen === 'tasks' ? 'stroke-[2.4] text-blue-600 dark:text-blue-400' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">{t.tasks}</span>
        </button>

        {/* Tab 5: More */}
        <button
          onClick={() => {
            triggerHaptic(30);
            setIsMoreMenuOpen(true);
          }}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isMoreActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {isMoreActive && (
            <motion.div
              layoutId="mobile-dock-active"
              className="absolute inset-x-2 inset-y-0.5 bg-blue-500/10 dark:bg-white/15 rounded-2xl -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
          <Menu
            className={`w-5 h-5 ${
              isMoreMenuOpen ? 'stroke-[2.4] text-blue-600 dark:text-blue-400' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-0.5 tracking-tight">{t.more}</span>
        </button>
      </nav>

      {/* Sleek iOS Bottom-Sheet Action Menu (Center + Triggered) */}
      <AnimatePresence>
        {isActionSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsActionSheetOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full max-h-[85vh] bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t border-black/10 dark:border-white/15 z-10 space-y-4 pb-10 safe-area-bottom"
            >
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto -mt-2 mb-2" />

              <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/10">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white tracking-tight">
                    {isAr ? 'إجراء سريع' : language === 'en' ? 'Quick Action' : 'Action Rapide'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {isAr
                      ? 'اختر العملية التي تريد إضافتها فوراً'
                      : language === 'en'
                      ? 'Choose what you want to record'
                      : 'Choisissez l’opération à enregistrer'}
                  </p>
                </div>
                <button
                  onClick={() => setIsActionSheetOpen(false)}
                  className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4 Action Tiles: Income, Expense, Pinned Note, Urgent Bill */}
              <div className="grid grid-cols-1 gap-2.5">
                {/* Income */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    setIsIncomeOpen(true);
                  }}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/10 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <ArrowUpRight className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-zinc-900 dark:text-white">
                      {isAr ? 'تسجيل مدخول' : language === 'en' ? 'Add Income' : 'Nouveau Revenu'}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{t.incomeDesc}</div>
                  </div>
                </motion.button>

                {/* Expense */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    setIsExpenseOpen(true);
                  }}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/10 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <ArrowDownRight className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-zinc-900 dark:text-white">
                      {isAr ? 'تسجيل مصروف' : language === 'en' ? 'Add Expense' : 'Nouvelle Dépense'}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{t.expenseDesc}</div>
                  </div>
                </motion.button>

                {/* Pinned Note */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    setIsQuickNoteModalOpen(true);
                  }}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/10 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Pin className="w-5 h-5 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-zinc-900 dark:text-white">
                      {isAr ? 'ملاحظة مثبتة' : language === 'en' ? 'Pinned Note' : 'Note Épinglée'}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {isAr
                        ? 'تثبيت فكرة أو تذكير هام في الواجهة'
                        : language === 'en'
                        ? 'Pin urgent memo to Priority Hub'
                        : 'Épingler un rappel urgent dans le Hub'}
                    </div>
                  </div>
                </motion.button>

                {/* Urgent Bill / Subscription */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsActionSheetOpen(false);
                    setActiveScreen('subscriptions');
                  }}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/10 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                    <CreditCard className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-zinc-900 dark:text-white">
                      {isAr
                        ? 'فاتورة أو اشتراك'
                        : language === 'en'
                        ? 'Bill / Subscription'
                        : 'Facture / Abonnement'}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {isAr
                        ? 'إدارة الاشتراكات الشهرية والفواتير'
                        : language === 'en'
                        ? 'Manage recurring bills and dues'
                        : 'Gérer les prélèvements et échéances'}
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Pinned Note Modal (Mobile) */}
      <AnimatePresence>
        {isQuickNoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsQuickNoteModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/15 rounded-3xl p-5 shadow-2xl text-zinc-900 dark:text-white space-y-3 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/[0.08] dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{tHub.quickNewNote}</h4>
                </div>
                <button
                  onClick={() => setIsQuickNoteModalOpen(false)}
                  className="p-1 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickNoteSubmit} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={quickNoteTitle}
                  onChange={(e) => setQuickNoteTitle(e.target.value)}
                  placeholder={tHub.noteTitlePlaceholder}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/10 border border-black/[0.08] dark:border-white/15 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                />
                <textarea
                  rows={3}
                  value={quickNoteContent}
                  onChange={(e) => setQuickNoteContent(e.target.value)}
                  placeholder={tHub.notePlaceholder}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/10 border border-black/[0.08] dark:border-white/15 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsQuickNoteModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                  >
                    {tHub.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
                  >
                    {tHub.pinNoteAction}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* More Pages iOS Bottom Drawer */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsMoreMenuOpen(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full max-h-[85vh] overflow-y-auto bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-white backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t border-black/10 dark:border-white/15 z-10 space-y-4 pb-10 safe-area-bottom"
            >
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto -mt-2 mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/10">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight">{t.morePages}</h3>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of More Pages (Notes, Debts, Subscriptions, Analytics, History, Settings) */}
              <div className="grid grid-cols-2 gap-2.5">
                {moreScreens.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic(30);
                        setActiveScreen(item.id);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                        isActive
                          ? 'bg-blue-500/15 border-blue-500/30 font-semibold text-blue-600 dark:text-blue-400'
                          : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.06] dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Account Profile & Log Out Controls */}
              <div className="pt-3 border-t border-black/[0.08] dark:border-white/10 space-y-2">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] text-xs font-semibold text-zinc-900 dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: activeAccount?.avatarColor || '#2383e2' }}
                    >
                      {activeAccount?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span>{activeAccount?.name || 'Mon Profil'}</span>
                  </div>
                  <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic(50);
                    setIsMoreMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: activeAccount?.avatarColor || '#2383e2' }}
                    >
                      {activeAccount?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span>{activeAccount?.name || 'Mon Profil'}</span>
                  </div>
                  <User className="w-4 h-4 text-zinc-400" />
                </button>

                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/15 text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>
                    {isAr
                      ? 'تسجيل الخروج وقفل الجلسة'
                      : language === 'en'
                      ? 'Log out & Lock'
                      : 'Se déconnecter (Verrouiller)'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction & Profile Modals triggered from Mobile Navigation */}
      <AddExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <AddIncomeModal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} />
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
