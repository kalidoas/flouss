import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { formatMAD, formatDate } from '../utils/formatters';
import { translations } from '../i18n/translations';
import { Language } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { UserProfileModal } from '../components/profile/UserProfileModal';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playHapticFeedback,
  isHapticsSupported,
  testHapticSupport,
} from '../utils/haptics';
import { isIOS, isStandalonePWA } from '../utils/device';
import { IOSCalendarGuideModal } from '../components/common/IOSCalendarGuideModal';
import { AddToHomeScreenModal } from '../components/common/AddToHomeScreenModal';
import {
  Lock,
  Download,
  Upload,
  Moon,
  Sun,
  Laptop,
  AlertTriangle,
  Sparkles,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  FileSpreadsheet,
  Users,
  Smartphone,
  CheckCircle2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  HelpCircle,
  Play,
  LogOut,
  Apple,
  ChevronRight,
  History,
  Archive,
} from 'lucide-react';
import { getRollingBackups, RollingBackupEntry } from '../utils/backup';
import { decryptBackup } from '../utils/crypto';
import { NotificationService } from '../services/notificationService';
import { auth, db } from '../firebase';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import {
  disconnectGoogleCalendar,
  requestGoogleCalendarAuth,
  getStoredGoogleAccessToken,
  getStoredGoogleCalendarEmail,
} from '../services/googleCalendar';
import { previewAlarmTone, AlarmToneType } from '../services/audioAlarmService';
import { PhoneNotificationGuideModal } from '../components/common/PhoneNotificationGuideModal';

export const SettingsPage: React.FC = () => {
  const {
    initialBalance,
    initialBalanceLockedAt,
    categories,
    transactions,
    incomeSources,
    theme,
    setTheme,
    language,
    setLanguage,
    resetLanguageToSystem,
    pinEnabled,
    pinCode,
    setPinCode,
    lastBackupDate,
    exportBackup,
    importBackup,
    loadDemoData,
    resetAllData,
    accounts,
    activeAccountId,
    firebaseUser,
    hideBalance,
    showToast,
    notificationSettings,
    updateNotificationSettings,
    lockApp,
  } = useAppStore();

  const activeAccount =
    (accounts || []).find((a) => a.id === activeAccountId) ||
    (accounts || [])[0] ||
    (firebaseUser
      ? {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Utilisateur',
          email: firebaseUser.email || '',
          avatarColor: '#10b981',
        }
      : null);

  const t = translations[language].settings;
  const tCommon = translations[language].common;
  const tAcc = translations[language].accounts;
  const tNotif = translations[language].notifications;

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    NotificationService.getPermission()
  );

  const [isPhoneGuideOpen, setIsPhoneGuideOpen] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  const googleConnected = Boolean(
    getStoredGoogleAccessToken() || notificationSettings?.googleCalendarConnected
  );
  const googleEmail =
    notificationSettings?.googleCalendarEmail || getStoredGoogleCalendarEmail();

  const handleConnectGoogle = async () => {
    setGoogleAuthLoading(true);
    playHapticFeedback('selection');
    try {
      await requestGoogleCalendarAuth(true);
      playHapticFeedback('success');
      showToast({
        message:
          language === 'ar'
            ? '✓ تم ربط تقويم جوجل بنجاح!'
            : language === 'en'
            ? '✓ Google Calendar connected successfully!'
            : '✓ Google Calendar connecté avec succès !',
      });
    } catch (err: any) {
      playHapticFeedback('error');
      showToast({
        message: err?.message || 'Erreur de connexion',
      });
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleDisconnectGoogle = () => {
    playHapticFeedback('medium');
    disconnectGoogleCalendar();
    showToast({
      message:
        language === 'ar'
          ? 'تم فصل حساب تقويم جوجل'
          : language === 'en'
          ? 'Google Calendar disconnected'
          : 'Google Calendar déconnecté',
    });
  };

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInputText, setResetInputText] = useState('');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // PIN modal state
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Haptics & Sensory Preferences State
  const [hapticsOn, setHapticsOn] = useState(() => isHapticsEnabled());
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [hapticsSupported, setHapticsSupported] = useState(() => isHapticsSupported());
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);
  const [isAddToHomeScreenOpen, setIsAddToHomeScreenOpen] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dev') === '1';
  });
  const [playgroundToggle, setPlaygroundToggle] = useState(false);

  const handleVersionTap = () => {
    playHapticFeedback('light');
    const nextCount = devTapCount + 1;
    setDevTapCount(nextCount);
    if (nextCount >= 7) {
      setIsDevMode(true);
      playHapticFeedback('success');
    }
  };

  const handleEnableNotifications = async () => {
    // If on iOS and not in standalone Home Screen PWA mode, show 3-step guide instead of failing
    if (isIOS() && !isStandalonePWA()) {
      setIsAddToHomeScreenOpen(true);
      return;
    }

    const status = await NotificationService.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      playHapticFeedback('success');
      showToast({ message: tNotif.testSuccess });
      NotificationService.showNotification(
        language === 'ar' ? 'فلوس - إشعارات النظام' : 'Flouss - Notifications Système',
        {
          body: tNotif.testSuccess,
          tag: 'flouss-permission-granted',
        }
      );
    }
  };

  const handleTestNotification = async () => {
    playHapticFeedback('medium');
    const sent = await NotificationService.showNotification(
      language === 'ar' ? 'فلوس - إشعار تجريبي' : 'Flouss - Test Notification',
      {
        body: tNotif.testSuccess,
        tag: 'flouss-test',
      }
    );
    if (sent) {
      showToast({ message: tNotif.testSuccess });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check 30-day backup condition
  const isBackupDue =
    !lastBackupDate ||
    Date.now() - new Date(lastBackupDate).getTime() > 30 * 24 * 60 * 60 * 1000;

  const handleExport = async () => {
    try {
      const json = await exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `flouss_backup_${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedbackMsg({ text: tCommon.backupExportSuccess, type: 'success' });
    } catch (e) {
      setFeedbackMsg({ text: tCommon.backupExportError, type: 'error' });
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel({
        initialBalance,
        transactions,
        categories,
        incomeSources,
        language,
      });
      setFeedbackMsg({
        text: language === 'ar' ? 'تم تصدير ملف Excel بنجاح!' : language === 'en' ? 'Excel exported successfully!' : 'Fichier Excel exporté avec succès !',
        type: 'success',
      });
    } catch (e) {
      setFeedbackMsg({
        text: language === 'ar' ? 'حدث خطأ أثناء تصدير Excel' : language === 'en' ? 'Error exporting Excel file' : 'Erreur lors de l’export Excel',
        type: 'error',
      });
    }
  };

  const [importPreview, setImportPreview] = useState<{
    rawContent: string;
    transactionCount: number;
    balance: number;
    accountName: string;
  } | null>(null);
  const [rollingBackups, setRollingBackups] = useState<RollingBackupEntry[]>(() => getRollingBackups());

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const data = await decryptBackup(content);
          if (data) {
            let txCount = 0;
            let bal = 0;
            let name = '';
            if (Array.isArray(data.accounts) && data.accounts.length > 0) {
              const acc = data.accounts[0];
              txCount = (acc.transactions || []).length;
              bal = acc.balance ?? 0;
              name = acc.name || 'Compte';
            } else if (data.transactions) {
              txCount = data.transactions.length;
              bal = data.balance ?? 0;
              name = data.name || 'Compte';
            }
            setImportPreview({
              rawContent: content,
              transactionCount: txCount,
              balance: bal,
              accountName: name,
            });
            return;
          }
        } catch (e) {}
        setFeedbackMsg({
          text: language === 'ar' ? 'الملف غير صالح أو تالف' : language === 'en' ? 'Invalid or corrupted file' : 'Fichier invalide ou corrompu.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    const success = await importBackup(importPreview.rawContent);
    setImportPreview(null);
    if (success) {
      setFeedbackMsg({
        text: language === 'ar' ? 'تم استيراد ومزامنة النسخة الاحتياطية بنجاح!' : language === 'en' ? 'Backup imported and synced successfully!' : 'Sauvegarde importée et synchronisée avec succès !',
        type: 'success',
      });
      setRollingBackups(getRollingBackups());
    } else {
      setFeedbackMsg({
        text: language === 'ar' ? 'حدث خطأ أثناء الاستيراد' : language === 'en' ? 'Error importing backup' : 'Erreur lors de l’import.',
        type: 'error',
      });
    }
  };

  const handleRestoreRollingSnapshot = async (snapshot: RollingBackupEntry) => {
    const confirmMsg = language === 'ar'
      ? `هل تريد استعادة نسخة ${snapshot.date} (${snapshot.transactionCount} معاملة، الرصيد: ${formatMAD(snapshot.balance, false, language)})؟`
      : language === 'en'
      ? `Restore snapshot from ${snapshot.date} (${snapshot.transactionCount} transactions, balance: ${formatMAD(snapshot.balance, false, language)})?`
      : `Restaurer l'instantané du ${snapshot.date} (${snapshot.transactionCount} transactions, solde : ${formatMAD(snapshot.balance, false, language)}) ?`;

    if (window.confirm(confirmMsg)) {
      const success = await importBackup(JSON.stringify({ accounts: [snapshot.account] }));
      if (success) {
        setFeedbackMsg({
          text: language === 'ar' ? 'تمت استعادة النسخة بنجاح ومزامنتها مع السحابة!' : language === 'en' ? 'Snapshot restored and synced to cloud successfully!' : 'Instantané restauré et synchronisé au cloud avec succès !',
          type: 'success',
        });
      }
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }
    await setPinCode(newPin);
    setShowPinSetupModal(false);
    setNewPin('');
    setPinError('');
    setFeedbackMsg({ text: 'Code PIN enregistré avec succès !', type: 'success' });
  };

  const handleDisablePin = () => {
    setPinCode(null);
    setFeedbackMsg({ text: 'Code PIN désactivé.', type: 'success' });
  };

  const handleConfirmReset = () => {
    if (resetInputText.trim().toUpperCase() !== 'SUPPRIMER') {
      return;
    }
    resetAllData();
    setShowResetModal(false);
    setResetInputText('');
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    const isGoogle = auth.currentUser.providerData.some((p: any) => p.providerId === 'google.com');
    const isPassword = auth.currentUser.providerData.some((p: any) => p.providerId === 'password');

    if (
      deleteInputText.trim().toUpperCase() !== 'SUPPRIMER' &&
      deleteInputText.trim() !== 'حذف' &&
      deleteInputText.trim().toUpperCase() !== 'DELETE'
    ) {
      setDeleteError(
        language === 'ar'
          ? 'يرجى كتابة كلمة "حذف" للتأكيد'
          : 'Veuillez taper "SUPPRIMER" pour confirmer'
      );
      return;
    }

    if (isPassword && !deletePassword) {
      setDeleteError(
        language === 'ar'
          ? 'يرجى إدخال كلمة المرور للتأكيد'
          : 'Veuillez saisir votre mot de passe pour confirmer'
      );
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      if (isGoogle) {
        await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
      } else if (isPassword && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, deletePassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      const uid = auth.currentUser.uid;

      try {
        await deleteDoc(doc(db, 'users', uid, 'meta', 'profile'));
      } catch (e) {}
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {}

      localStorage.removeItem(`flouss_user_${uid}`);
      sessionStorage.removeItem(`flouss_2fa_${uid}`);
      localStorage.removeItem(`flouss_welcome_${uid}`);
      localStorage.removeItem('flouss_app_storage_v2');
      localStorage.removeItem('flouss_theme');

      await auth.currentUser.delete();
      window.location.reload();
    } catch (err: any) {
      setIsDeletingAccount(false);
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setDeleteError(language === 'ar' ? 'كلمة المرور غير صحيحة.' : 'Mot de passe incorrect.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setDeleteError(
          language === 'ar'
            ? 'تم إلغاء عملية المصادقة مع Google'
            : 'Authentification Google annulée.'
        );
      } else {
        setDeleteError(err?.message || 'Erreur lors de la suppression du compte.');
      }
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 sm:space-y-8 animate-page">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.subtitle}
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs underline ml-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 30-Day Backup Reminder Alert */}
      {isBackupDue && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              {t.backupReminder}
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Dernière exportation :{' '}
              {lastBackupDate ? formatDate(lastBackupDate, language) : 'Aucune sauvegarde effectuée'}.
            </p>
            <div className="mt-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Exporter maintenant
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Locked Initial Balance Status */}
      <Card padding="md">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-md bg-[#f1f0ee] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] uppercase tracking-wider">
                {t.lockedBalanceTitle}
              </h2>
              <span className="text-[10px] font-medium bg-[#f1f0ee] dark:bg-[#282828] text-[#787774] dark:text-[#9b9a97] px-1.5 py-0.2 rounded border border-[#e3e2de] dark:border-[#2f2f2f]">
                {('locked')}
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
              {formatMAD(initialBalance, false, language)}
            </div>
            <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
              {t.lockedBalanceDesc}{' '}
              {initialBalanceLockedAt && `(Fixé le ${formatDate(initialBalanceLockedAt, language)})`}
            </p>
          </div>
        </div>
      </Card>

      {/* 2. Security & PIN Lock */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.securityTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.securityDesc}
              </p>
            </div>
          </div>

          {pinEnabled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Actif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
              Désactivé
            </span>
          )}
        </div>

        <div className="pt-2 flex flex-wrap gap-2.5">
          {pinEnabled ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewPin('');
                  setPinError('');
                  setShowPinSetupModal(true);
                }}
              >
                {t.changePin}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisablePin}
              >
                Désactiver le PIN
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => lockApp()}
                icon={<Lock className="w-4 h-4" />}
              >
                {language === 'ar' ? 'قفل التطبيق الآن' : language === 'en' ? 'Lock app now' : "Verrouiller l'application"}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNewPin('');
                setPinError('');
                setShowPinSetupModal(true);
              }}
              icon={<KeyRound className="w-4 h-4" />}
            >
              {t.enablePin}
            </Button>
          )}
        </div>
      </Card>

      {/* OS-Level System Notifications & Google Calendar Alarm Engine */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                {tNotif.title}
              </h2>
              <p className="text-xs text-zinc-400">
                {tNotif.subtitle}
              </p>
            </div>
          </div>

          {notificationPermission === 'granted' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" /> {tNotif.statusGranted}
            </span>
          ) : notificationPermission === 'denied' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" /> {tNotif.statusDenied}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold border border-black/[0.06] dark:border-white/[0.08]">
              {tNotif.statusDefault}
            </span>
          )}
        </div>

        {/* iOS Safari Home Screen Requirement Banner */}
        {isIOS() && !isStandalonePWA() && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-950 dark:text-blue-200 flex items-start gap-3 my-2">
            <Apple className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-blue-900 dark:text-blue-100">
                {tNotif.addToHomeScreenTitle}
              </p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                {tNotif.addToHomeScreenSubtitle}
              </p>
              <button
                type="button"
                onClick={() => setIsAddToHomeScreenOpen(true)}

                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>{tNotif.addToHomeScreenConfirm}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Features Checklist */}
        <div className="space-y-2 py-2 text-xs text-zinc-600 dark:text-zinc-300 border-t border-b border-black/[0.05] dark:border-white/[0.06] my-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{tNotif.feature1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>{tNotif.feature2}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>{tNotif.feature3}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 pb-4 flex flex-wrap gap-2.5">
          {notificationPermission !== 'granted' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleEnableNotifications}
              icon={<Bell className="w-4 h-4" />}
            >
              {tNotif.enableBtn}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestNotification}
              icon={<BellRing className="w-4 h-4" />}
            >
              {tNotif.testBtn}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPhoneGuideOpen(true)}
            icon={<HelpCircle className="w-4 h-4 text-blue-500" />}
          >
            {tNotif.phoneGuideBtn}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsIOSGuideOpen(true)}
            icon={<Apple className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />}
          >
            {tNotif.iosGuideBtn}
          </Button>
        </div>

        {/* Google Calendar Section (Offline Native Alarms) */}
        <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                  {tNotif.googleCalendarTitle}
                </h3>
                {googleConnected ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    {tNotif.googleConnected} ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                    {tNotif.googleNotConnected}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {tNotif.googleCalendarSubtitle}
              </p>
              {googleConnected && googleEmail && (
                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                  {googleEmail}
                </p>
              )}
            </div>

            <div>
              {googleConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  icon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
                >
                  {tNotif.disconnectGoogleBtn}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={googleAuthLoading}
                  onClick={handleConnectGoogle}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                >
                  {googleAuthLoading ? '...' : tNotif.connectGoogleBtn}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* In-App Synthesized Tone Selector */}
        <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                {tNotif.inAppSoundTitle}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                const current = notificationSettings?.soundEnabled !== false;
                updateNotificationSettings({ soundEnabled: !current });
                playHapticFeedback('selection');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                notificationSettings?.soundEnabled !== false ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  notificationSettings?.soundEnabled !== false
                    ? language === 'ar'
                      ? '-translate-x-5'
                      : 'translate-x-5'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {notificationSettings?.soundEnabled !== false && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(['chime', 'radar', 'gentle'] as AlarmToneType[]).map((toneKey) => {
                const isSelected = (notificationSettings?.soundTone || 'chime') === toneKey;
                const toneLabel =
                  toneKey === 'chime'
                    ? tNotif.toneChime
                    : toneKey === 'radar'
                    ? tNotif.toneRadar
                    : tNotif.toneGentle;

                return (
                  <button
                    key={toneKey}
                    type="button"
                    onClick={() => {
                      updateNotificationSettings({ soundTone: toneKey });
                      previewAlarmTone(toneKey);
                      playHapticFeedback('selection');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span>{toneLabel}</span>
                    <Play className="w-3 h-3 opacity-70" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Default Lead Times Summary */}
        <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
            {tNotif.leadTimesTitle} :
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{tNotif.billLeadTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{tNotif.taskLeadTime}</span>
          </div>

          {/* iOS Background Reminder Reality Check Note */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/[0.04] dark:border-white/[0.05] text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2 mt-2">
            <Apple className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{tNotif.iosNoticeBackground}</p>
          </div>
        </div>
      </Card>

      {/* 3. Appearance & Preferences */}
      <Card padding="lg">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          {t.appearance}
        </h2>

        <div className="space-y-6">
          {/* Theme selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t.theme}
              </p>
              <p className="text-xs text-slate-400">
                Clair, sombre ou synchronisé avec votre système
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.themeLight}</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.themeDark}</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{t.themeSystem}</span>
              </button>
            </div>
          </div>

          {/* Language selector (Système Auto / Français / العربية RTL / English) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.language}
                </p>
                {!localStorage.getItem('flouss_manual_language_selected') && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {language === 'ar' ? 'تلقائي (لغة الجهاز)' : language === 'en' ? 'Auto (System)' : 'Auto (Système)'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'يتبع النظام تلقائياً أو يمكنك تحديد لغتك المفضلة'
                  : 'Synchronisé avec votre appareil par défaut ou sélection manuelle'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-wrap">
              <button
                onClick={() => {
                  resetLanguageToSystem();
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  !localStorage.getItem('flouss_manual_language_selected')
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Langue automatique du système"
              >
                <Smartphone className="w-3 h-3" />
                <span>Auto</span>
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === 'fr' && localStorage.getItem('flouss_manual_language_selected')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Cairo',sans-serif] transition-all ${
                  language === 'ar' && localStorage.getItem('flouss_manual_language_selected')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === 'en' && localStorage.getItem('flouss_manual_language_selected')
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Currency Display Info */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t.currency}
              </p>
              <p className="text-slate-400">{t.currencyDesc}</p>
            </div>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
              MAD (د.م.)
            </span>
          </div>

          {/* Haptic Feedback Toggle (Default: ON) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="max-w-[75%]">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t.hapticsTitle}
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">{t.hapticsDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hapticsOn}
              onClick={() => {
                const next = !hapticsOn;
                setHapticsOn(next);
                setHapticsEnabled(next);
                if (next) playHapticFeedback('medium');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                hapticsOn ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  hapticsOn ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hardware Haptic Status & Live Test Tick */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {tNotif.hapticStatusTitle}
                </span>
                {hapticsSupported ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    {tNotif.hapticSupported}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold">
                    {tNotif.hapticNotSupported}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {language === 'ar'
                  ? 'تم الفحص بنبضة اختبار: محرك Taptic Engine (iOS) أو اهتزاز النظام.'
                  : language === 'en'
                  ? 'Verified with live test pulse: Apple Taptic Engine (iOS) or system vibration.'
                  : 'Vérifié avec impulsion test : Apple Taptic Engine (iOS) ou vibration système.'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const supported = testHapticSupport();
                setHapticsSupported(supported);
                showToast({ message: tNotif.hapticTestSent });
              }}
              icon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
            >
              {tNotif.testHapticBtn}
            </Button>
          </div>

          {/* Sound Effects Toggle (Default: OFF) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="max-w-[75%]">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t.soundTitle}
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">{t.soundDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={soundOn}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
                if (next) playHapticFeedback('success');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
                soundOn ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  soundOn ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Authenticated Cloud Account & Sync */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {translations[language].userProfileModal.title}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {translations[language].userProfileModal.subtitle}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAccountModalOpen(true)}
            icon={<Users className="w-4 h-4 text-emerald-600" />}
          >
            {translations[language].userProfileModal.title}
          </Button>
        </div>

        {/* Profile Details Card */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div
            onClick={() => setIsAccountModalOpen(true)}
            className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/30 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                style={{ backgroundColor: activeAccount?.avatarColor || '#10b981' }}
              >
                {activeAccount?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                  {activeAccount?.name || firebaseUser?.displayName || 'Flouss Account'}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {activeAccount?.email || firebaseUser?.email || translations[language].userProfileModal.authenticatedUser}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {translations[language].userProfileModal.syncedRealtime}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Backup & Data Management */}
      <Card padding="lg">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
          {t.backupTitle}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          {t.backupDesc}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            {t.exportButton}
          </Button>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            {language === 'ar' ? 'تصدير إلى Excel (.xlsx)' : language === 'en' ? 'Export to Excel (.xlsx)' : 'Exporter Excel (.xlsx)'}
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />

          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="w-4 h-4" />}
          >
            {t.importButton}
          </Button>
        </div>

        {/* Rolling Local Snapshots (7 Days) */}
        {rollingBackups.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {language === 'ar'
                  ? 'النسخ الاحتياطية التلقائية (آخر 7 أيام)'
                  : language === 'en'
                  ? 'Automatic Local Snapshots (Last 7 days)'
                  : 'Instantanés locaux automatiques (7 derniers jours)'}
              </h3>
            </div>
            <div className="space-y-2">
              {rollingBackups.map((snap) => (
                <div
                  key={snap.date}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{snap.date}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ({snap.transactionCount} {language === 'ar' ? 'معاملة' : 'tx'}, {formatMAD(snap.balance, false, language)})
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreRollingSnapshot(snap)}
                    icon={<Archive className="w-3.5 h-3.5 text-sky-500" />}
                  >
                    {language === 'ar' ? 'استعادة' : language === 'en' ? 'Restore' : 'Restaurer'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Data button */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t.demoDataButton}
            </p>
            <p className="text-[11px] text-slate-400">
              {t.demoDataDesc}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDemoData}
            icon={<Sparkles className="w-4 h-4 text-emerald-500" />}
          >
            {t.demoDataButton}
          </Button>
        </div>
      </Card>

      {/* 5. Danger Zone: Reset App & Delete Account */}
      <Card padding="lg" className="border-rose-500/20 bg-rose-500/5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> {t.dangerZone}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
              {t.resetDesc}
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowResetModal(true)}
          >
            {t.resetApp}
          </Button>
        </div>

        {firebaseUser && (
          <div className="pt-4 border-t border-rose-500/15 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {translations[language].auth?.deleteAccount || 'Supprimer mon compte'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-lg">
                {translations[language].auth?.deleteAccountDesc ||
                  'Supprime définitivement votre compte, vos transactions et toutes vos données de nos serveurs.'}
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteInputText('');
                setDeletePassword('');
                setDeleteError('');
                setShowDeleteAccountModal(true);
              }}
            >
              {translations[language].auth?.deleteAccount || 'Supprimer mon compte'}
            </Button>
          </div>
        )}
      </Card>

      {/* PIN Setup Modal */}
      <Modal
        isOpen={showPinSetupModal}
        onClose={() => setShowPinSetupModal(false)}
        title={t.setPinTitle}
        subtitle="Choisissez un code à 4 chiffres à mémoriser"
        maxWidth="sm"
      >
        <form onSubmit={handleSavePin} className="space-y-4">
          <Input
            label="Nouveau code PIN (4 chiffres)"
            type="password"
            maxLength={4}
            inputMode="numeric"
            placeholder="••••"
            value={newPin}
            onChange={(e) => {
              setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
              setPinError('');
            }}
            error={pinError}
            autoFocus
            className="text-center text-2xl tracking-[0.5em] font-bold"
          />

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowPinSetupModal(false)}
            >
              {tCommon.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={newPin.length !== 4}
            >
              {tCommon.save}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={t.resetConfirmTitle}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.resetConfirmDesc}
            </p>
          </div>

          <Input
            placeholder="SUPPRIMER"
            value={resetInputText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetInputText(e.target.value)}
            className="text-center uppercase font-bold tracking-wider"
          />

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowResetModal(false)}
            >
              {tCommon.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={resetInputText.trim().toUpperCase() !== 'SUPPRIMER'}
              onClick={handleConfirmReset}
            >
              {tCommon.delete}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteAccountModal}
        onClose={() => !isDeletingAccount && setShowDeleteAccountModal(false)}
        title={translations[language].auth?.deleteAccount || 'Supprimer mon compte'}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-500/15 text-rose-500 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-rose-500 font-semibold">
              {language === 'ar'
                ? 'تحذير : هذا الإجراء نهائي ولا يمكن التراجع عنه'
                : 'Attention : cette action est définitive et irréversible.'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {translations[language].auth?.deleteAccountDesc ||
                'Toutes vos données seront supprimées de nos serveurs.'}
            </p>
          </div>

          {auth.currentUser?.providerData.some((p: any) => p.providerId === 'password') && (
            <Input
              label={translations[language].auth?.passwordLabel || 'Mot de passe'}
              type="password"
              placeholder="••••••••"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              disabled={isDeletingAccount}
            />
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">
              {translations[language].auth?.deleteAccountConfirm || 'Tapez "SUPPRIMER" pour confirmer'}
            </label>
            <Input
              placeholder={language === 'ar' ? 'حذف' : 'SUPPRIMER'}
              value={deleteInputText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteInputText(e.target.value)}
              disabled={isDeletingAccount}
              className="text-center uppercase font-bold tracking-wider"
            />
          </div>

          {deleteError && (
            <p className="text-xs text-rose-500 text-center font-medium bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
              {deleteError}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth
              disabled={isDeletingAccount}
              onClick={() => setShowDeleteAccountModal(false)}
            >
              {tCommon.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={
                isDeletingAccount ||
                (deleteInputText.trim().toUpperCase() !== 'SUPPRIMER' &&
                  deleteInputText.trim() !== 'حذف' &&
                  deleteInputText.trim().toUpperCase() !== 'DELETE')
              }
              onClick={handleDeleteAccount}
            >
              {isDeletingAccount ? '...' : (translations[language].auth?.deleteAccount || tCommon.delete)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Backup Import Preview & Confirmation Modal */}
      <Modal
        isOpen={Boolean(importPreview)}
        onClose={() => setImportPreview(null)}
        title={
          language === 'ar'
            ? 'معاينة واستعادة النسخة الاحتياطية'
            : language === 'en'
            ? 'Backup Preview & Restore'
            : 'Aperçu et Restauration de Sauvegarde'
        }
        maxWidth="sm"
      >
        {importPreview && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'الحساب :' : 'Compte :'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{importPreview.accountName || 'Flouss'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'عدد المعاملات :' : 'Transactions :'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{importPreview.transactionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'الرصيد :' : 'Solde :'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMAD(importPreview.balance, false, language)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              {language === 'ar'
                ? 'هل تريد بالتأكيد تطبيق هذه النسخة الاحتياطية؟ ستتم مزامنة البيانات تلقائياً مع السحابة.'
                : language === 'en'
                ? 'Are you sure you want to restore this backup? Your data will be automatically synced to the cloud.'
                : 'Voulez-vous vraiment restaurer cette sauvegarde ? Les données seront automatiquement synchronisées avec le cloud.'}
            </p>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setImportPreview(null)}
              >
                {tCommon.cancel}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleConfirmImport}
              >
                {language === 'ar' ? 'استعادة ومزامنة' : language === 'en' ? 'Restore & Sync' : 'Restaurer & Synchroniser'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dev Mode: Haptics & Sensory Playground */}
      {isDevMode && (
        <Card padding="lg" className="border-indigo-300/80 dark:border-indigo-800/60 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-indigo-900 dark:text-indigo-200">
                    {t.hapticsPlayground}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    DEV MODE
                  </span>
                </div>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80 mt-0.5">
                  {t.hapticsPlaygroundDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                data-haptic="light"
                onClick={() => playHapticFeedback('light')}
              >
                {t.testLight}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-haptic="medium"
                onClick={() => playHapticFeedback('medium')}
              >
                {t.testMedium}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-haptic="rigid"
                onClick={() => playHapticFeedback('rigid')}
              >
                {t.testRigid}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-haptic="selection"
                onClick={() => playHapticFeedback('selection')}
              >
                {t.testSelection}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-haptic="success"
                onClick={() => playHapticFeedback('success')}
              >
                {t.testSuccess}
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-haptic="error"
                onClick={() => playHapticFeedback('error')}
              >
                {t.testError}
              </Button>
            </div>

            {/* Native Switch Test */}
            <div className="pt-3 border-t border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                {t.toggleTest}
              </span>
              <input
                type="checkbox"
                checked={playgroundToggle}
                onChange={(e) => setPlaygroundToggle(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Secret Dev Mode Unlock Counter on App Version */}
      <div className="text-center pt-2 pb-6 select-none">
        <button
          type="button"
          onClick={handleVersionTap}
          className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          v1.0.0 · {__BUILD_SHA__} {isDevMode ? '(Dev Unlocked ⚡)' : ''}
        </button>
      </div>

      {/* User Profile & Cloud Sync Modal */}
      <UserProfileModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Phone Notification & Audio Priority Guide Sheet */}
      <PhoneNotificationGuideModal
        isOpen={isPhoneGuideOpen}
        onClose={() => setIsPhoneGuideOpen(false)}
      />

      {/* iOS Apple Calendar Setup Guide Sheet */}
      <IOSCalendarGuideModal
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
      />

      {/* Add to Home Screen Modal (iOS PWA) */}
      <AddToHomeScreenModal
        isOpen={isAddToHomeScreenOpen}
        onClose={() => setIsAddToHomeScreenOpen(false)}
      />
    </div>
  );
};
