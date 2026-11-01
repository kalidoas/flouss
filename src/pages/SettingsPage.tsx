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
  Compass,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

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
    hideBalance,
    startTour,
  } = useAppStore();

  const t = translations[language].settings;
  const tCommon = translations[language].common;
  const tAcc = translations[language].accounts;

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInputText, setResetInputText] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // PIN modal state
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check 30-day backup condition
  const isBackupDue =
    !lastBackupDate ||
    Date.now() - new Date(lastBackupDate).getTime() > 30 * 24 * 60 * 60 * 1000;

  const handleExport = () => {
    try {
      const json = exportBackup();
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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackup(content);
        if (success) {
          setFeedbackMsg({ text: 'Sauvegarde importée avec succès !', type: 'success' });
        } else {
          setFeedbackMsg({
            text: 'Fichier invalide ou corrompu. Veuillez vérifier le format JSON.',
            type: 'error',
          });
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }
    setPinCode(newPin);
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
                Verrouillé
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

      {/* Guided Walkthrough Tour */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#2383e2]/10 text-[#2383e2] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed]">
                {language === 'ar' ? 'جولة توضيحية في التطبيق' : 'Visite Guidée Interactive'}
              </h3>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                {language === 'ar'
                  ? 'استكشف لوحة التحكم، المهام، الديون، وضع الخصوصية والملاحظات خطوة بخطوة'
                  : 'Revisitez les fonctionnalités clés (Solde, Focus View, Dettes, Notes, Touche H)'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startTour()}
            icon={<Compass className="w-3.5 h-3.5 text-[#2383e2]" />}
          >
            {language === 'ar' ? 'بدء الجولة' : 'Lancer'}
          </Button>
        </div>
      </Card>

      {/* iPhone App & Sync Guide */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <h3 className="font-semibold text-[#37352f] dark:text-[#ecebed]">
                {language === 'ar' ? 'تثبيت التطبيق على iPhone والعمل بدون نت (Offline)' : 'Application iPhone (PWA) & Mode Hors Ligne'}
              </h3>
              <p className="text-[#787774] dark:text-[#9b9a97] mt-0.5 leading-normal">
                {language === 'ar'
                  ? 'يعمل التطبيق بدون أي اتصال بالإنترنت مع حفظ بياناتك بالكامل في الهاتف. للتثبيت على iPhone :'
                  : 'Flouss fonctionne à 100% sans connexion Internet. Pour l’installer sur votre iPhone :'}
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[#5f5e5b] dark:text-[#9b9a97] bg-[#fbfbfa] dark:bg-[#1a1a1a] p-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f]">
              <li>
                {language === 'ar'
                  ? 'افتح الرابط في Safari على جهاز iPhone'
                  : 'Ouvrez le lien dans Safari sur votre iPhone'}
              </li>
              <li>
                {language === 'ar'
                  ? 'اضغط زر المشاركة بالأسفل (icône Partager ⎋)'
                  : 'Appuyez sur le bouton Partager en bas de Safari (icône ⎋)'}
              </li>
              <li>
                {language === 'ar'
                  ? 'اختر « Sur l’écran d’accueil » (إضافة إلى الشاشة الرئيسية)'
                  : 'Sélectionnez « Sur l’écran d’accueil »'}
              </li>
              <li>
                {language === 'ar'
                  ? 'للمزامنة مع الحاسوب : صدّر ملف JSON من زر التصدير بالأسفل واستورده على الحاسوب عند الرغبة.'
                  : 'Pour synchroniser vos données avec votre PC : exportez la sauvegarde JSON et importez-la sur PC.'}
              </li>
            </ol>
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

          {/* Language selector (Français, العربية RTL, English) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t.language}
              </p>
              <p className="text-xs text-slate-400">
                Support complet de l’arabe (RTL), français et anglais
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === 'fr'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Cairo',sans-serif] transition-all ${
                  language === 'ar'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  language === 'en'
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
                  {activeAccount?.name}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {activeAccount?.email || translations[language].userProfileModal.authenticatedUser}
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

      {/* 5. Danger Zone: Reset App */}
      <Card padding="lg" className="border-rose-200/80 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10">
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

      {/* User Profile & Cloud Sync Modal */}
      <UserProfileModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
};
