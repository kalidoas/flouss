import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '../../store/useAppStore';
import {
  Calendar,
  Bell,
  Volume2,
  Moon,
  VolumeX,
  CheckCircle2,
  Apple,
  ExternalLink,
} from 'lucide-react';

interface IOSCalendarGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSCalendarGuideModal: React.FC<IOSCalendarGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useAppStore();
  const isAr = language === 'ar';
  const isEn = language === 'en';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isAr
          ? 'دليل إعدادات المنبه على iPhone (iOS)'
          : isEn
          ? 'iPhone (iOS) Alarm Setup Guide'
          : 'Guide alertes et sonneries iPhone (iOS)'
      }
      subtitle={
        isAr
          ? 'كيف تجعل تذكيرات فلوس ترن بمستوى صوت مسموع عبر تقويم Apple الأصلي'
          : isEn
          ? 'How to trigger audible alarms for Flouss reminders via Apple Calendar'
          : 'Faire sonner vos rappels Flouss avec l’application Calendrier native d’Apple'
      }
      maxWidth="md"
    >
      <div className="space-y-4 pt-1 text-xs select-text">
        {/* Why this is the best setup for iPhone banner */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-zinc-900/10 flex items-center justify-center shrink-0">
            <Apple className="w-4 h-4 fill-current" />
          </div>
          <div className="leading-relaxed">
            <p className="font-bold text-xs">
              {isAr
                ? 'الحل الموصى به لمستخدمي iPhone'
                : isEn
                ? 'Recommended Setup for iPhone Users'
                : 'Configuration optimale pour iPhone'}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isAr
                ? 'نظام iOS يُوقف المؤقتات الداخلية عند قفل الشاشة. بربط حسابك مع تقويم Apple الأصلي، ستتلقى رنين المنبه بملء الشاشة مع الصوت والاهتزاز حتى والتطبيق مغلق تماماً.'
                : isEn
                ? 'iOS suspends web timers when locked. Connecting Google to Apple Calendar guarantees full audible alarm chimes even when Flouss is completely closed.'
                : 'iOS suspend les minuteurs web écran verrouillé. En reliant votre compte Google au Calendrier Apple, vos alarmes sonneront en continu même Flouss fermé.'}
            </p>
          </div>
        </div>

        {/* 5 Clear Steps */}
        <div className="space-y-3">
          {/* Step 1: Add Google account to iOS Calendar */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.05] dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {isAr
                  ? 'إضافة حساب Google إلى تقويم Apple'
                  : isEn
                  ? 'Add Google account to iOS Calendar'
                  : 'Ajouter le compte Google à Apple Calendrier'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {isAr
                ? 'الإعدادات ⟵ التقويم ⟵ الحسابات ⟵ إضافة حساب ⟵ Google'
                : isEn
                ? 'Settings ⟶ Calendar ⟶ Accounts ⟶ Add Account ⟶ Google'
                : 'Réglages ⟶ Calendrier ⟶ Comptes ⟶ Ajouter un compte ⟶ Google'}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? 'اربط نفس بريدك الإلكتروني المستخدم في مزامنة فلوس وفعّل خيار "التقويمات". ستظهر جميع المواعيد تلقائياً في تطبيق التقويم الخاص بهاتفك.'
                : isEn
                ? 'Sign in with the same email used in Flouss and ensure "Calendars" is toggled ON. All Flouss alarms will sync into Apple Calendar.'
                : 'Connectez le même compte Google utilisé dans Flouss et activez « Calendriers ». Vos rappels se synchroniseront dans l’application native.'}
            </p>
          </div>

          {/* Step 2: Settings > Notifications > Calendar > Allow */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.05] dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <Bell className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                {isAr
                  ? 'السماح بإشعارات التقويم'
                  : isEn
                  ? 'Allow Calendar Notifications'
                  : 'Autoriser les notifications de Calendrier'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              {isAr
                ? 'الإعدادات ⟵ الإشعارات ⟵ التقويم ⟵ السماح بالإشعارات'
                : isEn
                ? 'Settings ⟶ Notifications ⟶ Calendar ⟶ Allow Notifications'
                : 'Réglages ⟶ Notifications ⟶ Calendrier ⟶ Autoriser'}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? 'تأكد من تفعيل "شاشة القفل" و"مركز الإشعارات" و"الشعارات"، واختر نمط الشعار "دائم" (Persistent).'
                : isEn
                ? 'Enable Lock Screen, Notification Center, and Banners. Set Banner Style to "Persistent" so alerts stay visible.'
                : 'Cochez Écran verrouillé, Centre de notifications et Bannières persistantes.'}
            </p>
          </div>

          {/* Step 3: Settings > Sounds & Haptics > Calendar Alerts */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.05] dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {isAr
                  ? 'اختيار نغمة تنبيهات التقويم'
                  : isEn
                  ? 'Choose Calendar Alert Tone'
                  : 'Choisir la sonnerie des alertes Calendrier'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {isAr
                ? 'الإعدادات ⟵ الأصوات والحس اللمسي ⟵ تنبيهات التقويم'
                : isEn
                ? 'Settings ⟶ Sounds & Haptics ⟶ Calendar Alerts'
                : 'Réglages ⟶ Sons et vibrations ⟶ Alertes de calendrier'}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? 'اختر نغمة رنين قوية ومسموعة (مثل "موجات" أو "إنذار") لضمان سماع تنبيهات الفواتير والمهام الهامة.'
                : isEn
                ? 'Select a loud, distinct ringtone so you never miss a scheduled invoice or urgent task.'
                : 'Sélectionnez une tonalité claire et forte pour ne manquer aucun rappel financier.'}
            </p>
          </div>

          {/* Step 4: Allow Calendar in Focus modes */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.05] dark:border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold">
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">
                4
              </span>
              <Moon className="w-3.5 h-3.5 text-purple-500" />
              <span>
                {isAr
                  ? 'استثناء التقويم في وضع التركيز (Focus)'
                  : isEn
                  ? 'Allow Calendar in Focus Modes'
                  : 'Autoriser Calendrier dans les modes Concentration (Focus)'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {isAr
                ? 'الإعدادات ⟵ التركيز ⟵ [الوضع الحالي] ⟵ التطبيقات المسموح بها ⟵ التقويم'
                : isEn
                ? 'Settings ⟶ Focus ⟶ [Your Focus Mode] ⟶ Allowed Apps ⟶ Calendar'
                : 'Réglages ⟶ Concentration ⟶ [Votre mode] ⟶ Apps autorisées ⟶ Calendrier'}
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? 'أضف تطبيق التقويم للتطبيقات المسموح بها لترن التنبيهات حتى عند تفعيل وضع "عدم الإزعاج" أو "النوم".'
                : isEn
                ? 'Add Calendar to the allowed apps list so alarms breakthrough Do Not Disturb or Sleep modes.'
                : 'Ajoutez Calendrier aux apps autorisées pour que l’alarme sonne même en mode Ne pas déranger.'}
            </p>
          </div>

          {/* Step 5: Silent Switch Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                5
              </span>
              <VolumeX className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isAr
                  ? 'تنبيه: زر الصامت الجانبي (Silent Switch)'
                  : isEn
                  ? 'Important: Physical Silent Switch / Action Button'
                  : 'Important : Commutateur silencieux physique'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isAr
                ? '⚠️ زر الصامت الجانبي على هيكل iPhone يكتم أصوات التنبيهات (ويكتفي بالاهتزاز). لسماع رنين المنبه، تأكد من إيقاف الوضع الصامت أو ضبط الاهتزاز على نمط ملحوظ.'
                : isEn
                ? '⚠️ The physical silent switch (or Action Button) on the side of iPhone mutes calendar alert sounds (vibrations will still pulse). Ensure silent mode is switched off to hear the chime.'
                : '⚠️ Le bouton silencieux physique sur le côté de l’iPhone coupe le son des alertes normales (vibration seule). Désactivez le mode silencieux pour entendre la sonnerie.'}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
            className="flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{isAr ? 'تم، فهمت الخطوات' : isEn ? 'Understood' : 'J’ai compris la configuration'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
