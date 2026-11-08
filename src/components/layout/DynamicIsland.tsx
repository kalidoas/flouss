import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { islandManager, IslandNotification } from '../../utils/islandManager';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import {
  CheckCircle2,
  Cloud,
  Pin,
  CreditCard,
  Globe,
  Wallet,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const DynamicIsland: React.FC = () => {
  const [notification, setNotification] = useState<IslandNotification | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { language, firebaseUser, firestoreDisabled, syncStatus, forceSyncToCloud, showToast } = useAppStore();
  const tHub = translations[language].priorityHub;

  useEffect(() => {
    return islandManager.subscribe((notif) => {
      setNotification(notif);
    });
  }, []);

  const handleForceSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    islandManager.notify({
      type: 'sync',
      title:
        language === 'ar'
          ? 'جارٍ المزامنة السحابية...'
          : language === 'en'
          ? 'Syncing to Cloud...'
          : 'Synchronisation Cloud...',
      subtitle: firebaseUser?.email || 'Cloud Firestore',
    });

    try {
      const res = await forceSyncToCloud();
      if (res.success) {
        islandManager.notify({
          type: 'cloud',
          title: tHub.cloudSyncPillSuccess,
          subtitle: firebaseUser?.email || 'Firestore users/' + (firebaseUser?.uid || ''),
        });
        showToast({ message: tHub.cloudSyncPillSuccess });
      } else {
        islandManager.notify({
          type: 'cloud',
          title: tHub.cloudSyncPillError,
          subtitle: res.message,
        });
        showToast({ message: `${tHub.cloudSyncPillError}: ${res.message}` });
      }
    } catch (e: any) {
      islandManager.notify({
        type: 'cloud',
        title: tHub.cloudSyncPillError,
        subtitle: e?.message || 'Error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getIcon = (type: IslandNotification['type']) => {
    switch (type) {
      case 'check':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />;
      case 'cloud':
      case 'sync':
        return <Cloud className="w-4 h-4 text-sky-400 stroke-[2.5]" />;
      case 'pin':
        return <Pin className="w-4 h-4 text-amber-400 fill-amber-400 stroke-[2.5]" />;
      case 'bill':
        return <CreditCard className="w-4 h-4 text-purple-400 stroke-[2.5]" />;
      case 'lang':
        return <Globe className="w-4 h-4 text-emerald-400 stroke-[2.5]" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-emerald-400 stroke-[2.5]" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400 stroke-[2.5]" />;
    }
  };

  const isExpanded = Boolean(notification) || isHovered;

  const idleSyncText =
    !firebaseUser || firestoreDisabled
      ? language === 'ar' ? 'حفظ محلي' : language === 'en' ? 'Local storage' : 'Stockage local'
      : syncStatus === 'error'
      ? language === 'ar' ? 'فشلت المزامنة' : language === 'en' ? 'Sync failed' : 'Échec de synchronisation'
      : syncStatus === 'syncing'
      ? language === 'ar' ? 'جارٍ حفظ التغييرات' : language === 'en' ? 'Saving changes' : 'Enregistrement en cours'
      : syncStatus === 'synced'
      ? language === 'ar' ? 'متزامن مع السحابة' : language === 'en' ? 'Synced with cloud' : 'Synchronisé au cloud'
      : language === 'ar' ? 'جارٍ الاتصال بالسحابة' : language === 'en' ? 'Connecting to cloud' : 'Connexion au cloud';
  const syncDotClass = !firebaseUser || firestoreDisabled
    ? 'bg-zinc-500'
    : syncStatus === 'synced'
    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
    : syncStatus === 'error'
    ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
    : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]';

  return (
    <div className="flex justify-center shrink-0 pointer-events-none select-none">
      <motion.div
        layout
        onClick={handleForceSync}
        whileTap={{ scale: 0.96 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={language === 'ar' ? 'انقر لفرض المزامنة السحابية' : language === 'en' ? 'Click to force Cloud Sync' : 'Cliquer pour forcer la synchronisation Cloud'}
        transition={{
          type: 'spring',
          stiffness: 420,
          damping: 32,
          mass: 0.8,
        }}
        className={`pointer-events-auto cursor-pointer relative max-w-full bg-black/95 text-white backdrop-blur-2xl border border-white/20 shadow-[0_4px_16px_0_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.2)] rounded-full flex items-center justify-between overflow-hidden px-3 py-1 transition-all ${
          isExpanded ? 'w-[min(260px,60vw)] sm:w-[280px] px-3.5 py-1.5' : 'w-8 md:w-[88px]'
        }`}
      >
        <AnimatePresence mode="wait">
          {notification ? (
            /* ACTIVE EXPANDED MORPH STATE */
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 4 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="flex items-center justify-between w-full gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-semibold text-white tracking-tight truncate">
                    {notification.title}
                  </div>
                  {notification.subtitle && (
                    <div className="text-[10px] text-zinc-400 truncate">
                      {notification.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <span className={`w-2 h-2 rounded-full shrink-0 ${syncDotClass} ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`} />
            </motion.div>
          ) : isHovered ? (
            /* HOVER DETAILS STATE */
            <motion.div
              key="hover-state"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              className="flex items-center justify-between w-full gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-medium text-zinc-200">{idleSyncText}</span>
              </div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${syncDotClass}`} />
            </motion.div>
          ) : (
            /* COMPACT IDLE STATE */
            <motion.div
              key="idle-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-[11px] md:justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span className="hidden text-[10px] font-medium text-zinc-400 md:inline">
                  {firebaseUser ? (language === 'ar' ? 'متصل' : language === 'fr' ? 'Sync' : 'Sync') : 'Local'}
                </span>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full shrink-0 ${syncDotClass} ${syncStatus === 'syncing' ? 'animate-pulse' : ''}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
