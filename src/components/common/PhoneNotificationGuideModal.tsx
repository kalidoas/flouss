import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '../../store/useAppStore';
import { Smartphone, Volume2, ShieldAlert, CheckCircle2, ChevronRight, Apple, AlertCircle } from 'lucide-react';

interface PhoneNotificationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneNotificationGuideModal: React.FC<PhoneNotificationGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isAr
          ? 'إعداد رنين وتنبيهات الهاتف'
          : isEn
          ? 'Phone Alarm & Sound Guide'
          : 'Guide son et priorité d’alarme'
      }
      subtitle={
        isAr
          ? 'كيفية ضبط صوت وأولوية إشعارات تقويم جوجل على هاتفك'
          : isEn
          ? 'How to configure Google Calendar notification sound and high priority'
          : 'Configurer le son et la priorité Google Calendar sur votre smartphone'
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-1 text-xs">
        {/* Important notice banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            {isAr
              ? 'ملاحظة هامة: عندما يكون تطبيق Flouss مغلقاً، يتحكم تطبيق تقويم جوجل ونظام هاتفك في نغمة الرنين والأولوية. تأكد من تفعيل الإشعارات وتحديد نغمة رنين مسموعة في إعدادات الهاتف أدناه.'
              : isEn
              ? 'Important notice: When Flouss is closed, your phone system and Google Calendar app control notification sound and priority. Ensure sound and high priority are allowed in your phone settings below.'
              : 'Remarque importante : Lorsque Flouss est fermé, le système de votre téléphone et l’application Google Calendar gèrent la sonnerie et la priorité. Vérifiez les réglages ci-dessous.'}
          </span>
        </div>

        {/* OS Platform Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
            <span>iPhone (iOS)</span>
          </button>
        </div>

        {/* Step-by-step instructions */}
        {activeTab === 'android' ? (
          <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
            <h4 className="font-bold text-zinc-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {isAr
                  ? 'خطوات ضبط أولوية المنبه على Android:'
                  : isEn
                  ? 'Android Alarm Priority Steps:'
                  : 'Étapes pour Android :'}
              </span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
              <li>
                {isAr
                  ? 'افتح إعدادات هاتفك (Settings) ⟵ التطبيقات (Apps) ⟵ تقويم Google (Calendar).'
                  : isEn
                  ? 'Open phone Settings ⟶ Apps ⟶ Google Calendar.'
                  : 'Ouvrez Paramètres ⟶ Applications ⟶ Google Calendar.'}
              </li>
              <li>
                {isAr
                  ? 'اضغط على الإشعارات (Notifications) ⟵ فئات الإشعارات (Notification categories).'
                  : isEn
                  ? 'Tap Notifications ⟶ Notification categories.'
                  : 'Appuyez sur Notifications ⟶ Catégories de notifications.'}
              </li>
              <li>
                {isAr
                  ? 'اختر "تذكير المهام والأحداث" وضع الأولوية على "عاجل / إظهار كنافذة منبثقة مع رنين" (Alert / Pop on screen).'
                  : isEn
                  ? 'Select "Task and event reminders", set to "Alert" and enable "Pop on screen".'
                  : 'Sélectionnez "Rappels d’événements" et activez "Priorité haute / Afficher en pop-up avec son".'}
              </li>
              <li>
                {isAr
                  ? 'اختر نغمة رنين واضحة (Sound) وتأكد من استثناء التطبيق من وضع توفير الطاقة (Battery unrestricted).'
                  : isEn
                  ? 'Choose an audible sound and set Battery to Unrestricted so alarms are not silenced.'
                  : 'Choisissez une sonnerie claire et désactivez l’optimisation de batterie.'}
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
            <h4 className="font-bold text-zinc-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {isAr
                  ? 'خطوات ضبط التنبيهات على iPhone (iOS):'
                  : isEn
                  ? 'iOS Alarm Setup Steps:'
                  : 'Étapes pour iPhone (iOS) :'}
              </span>
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed">
              <li>
                {isAr
                  ? 'اربط حساب Google بتقويم Apple: الإعدادات ⟵ التقويم ⟵ الحسابات ⟵ إضافة حساب ⟵ Google.'
                  : isEn
                  ? 'Add Google account to Apple Calendar: Settings ⟶ Calendar ⟶ Accounts ⟶ Add Account ⟶ Google.'
                  : 'Ajoutez votre compte Google à Apple Calendrier : Réglages ⟶ Calendrier ⟶ Comptes ⟶ Ajouter ⟶ Google.'}
              </li>
              <li>
                {isAr
                  ? 'الإعدادات ⟵ الإشعارات ⟵ التقويم ⟵ تفعيل "السماح بالإشعارات" واختيار نمط الشعار "دائم".'
                  : isEn
                  ? 'Settings ⟶ Notifications ⟶ Calendar ⟶ enable "Allow Notifications" & set Banner Style to "Persistent".'
                  : 'Réglages ⟶ Notifications ⟶ Calendrier ⟶ activez "Autoriser les notifications" et "Bannière persistante".'}
              </li>
              <li>
                {isAr
                  ? 'الإعدادات ⟵ الأصوات والحس اللمسي ⟵ تنبيهات التقويم (لاختيار نغمة رنين مسموعة).'
                  : isEn
                  ? 'Settings ⟶ Sounds & Haptics ⟶ Calendar Alerts (choose a loud, clear ringtone).'
                  : 'Réglages ⟶ Sons et vibrations ⟶ Alertes de calendrier (choisissez une sonnerie bien audible).'}
              </li>
              <li>
                {isAr
                  ? 'الإعدادات ⟵ التركيز ⟵ استثناء تطبيق التقويم ليرن المنبه حتى في وضع عدم الإزعاج.'
                  : isEn
                  ? 'Settings ⟶ Focus ⟶ add Calendar to Allowed Apps so alarms sound during Do Not Disturb.'
                  : 'Réglages ⟶ Concentration ⟶ autorisez l’application Calendrier pour sonner en mode Ne pas déranger.'}
              </li>
              <li>
                {isAr
                  ? 'ملاحظة: زر الصامت الجانبي على iPhone يكتم أصوات التنبيهات (اهتزاز فقط). تأكد من إيقاف الوضع الصامت لسماع الرنين.'
                  : isEn
                  ? 'Note: The physical silent switch on iPhone mutes alert sounds (vibrations only). Turn off silent mode to hear chimes.'
                  : 'Remarque : Le bouton silencieux physique coupe le son des alertes (vibration seule). Désactivez le mode silencieux pour entendre le son.'}
              </li>
            </ol>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            {isAr ? 'فهمت ذلك' : isEn ? 'Got it' : 'Compris'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
