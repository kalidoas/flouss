import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAppStore } from '../../store/useAppStore';
import { AlertTriangle, LogOut } from 'lucide-react';
import { playHapticFeedback } from '../../utils/haptics';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ isOpen, onClose }) => {
  const { language, logout, syncStatus } = useAppStore();

  const hasUnsyncedChanges = syncStatus === 'syncing' || syncStatus === 'connecting' || syncStatus === 'error';

  const texts = {
    title:
      language === 'ar'
        ? 'تسجيل الخروج من Flouss؟'
        : language === 'fr'
        ? 'Se déconnecter de Flouss ?'
        : 'Log out of Flouss?',
    warning:
      language === 'ar'
        ? 'لديك تغييرات غير متزامنة قد تُفقد في حال تسجيل الخروج الآن.'
        : language === 'fr'
        ? 'Certaines modifications ne sont pas encore synchronisées et risquent d’être perdues.'
        : 'You have unsynced changes that may be lost if you log out now.',
    desc:
      language === 'ar'
        ? 'سيتم مسح البيانات المحلية الخاصة بهذا الحساب على هذا الجهاز. يمكنك إعادة تسجيل الدخول في أي وقت.'
        : language === 'fr'
        ? 'Les données locales de ce compte seront effacées de cet appareil. Vous pourrez vous reconnecter à tout moment.'
        : 'Your local account data will be cleared from this device. You can sign back in anytime.',
    cancel: language === 'ar' ? 'إلغاء' : language === 'fr' ? 'Annuler' : 'Cancel',
    logout: language === 'ar' ? 'تسجيل الخروج' : language === 'fr' ? 'Se déconnecter' : 'Log out',
  };

  const handleConfirmLogout = async () => {
    playHapticFeedback('medium');
    onClose();
    await logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={texts.title}
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1">
        {hasUnsyncedChanges && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed font-medium">{texts.warning}</p>
          </div>
        )}

        <p className="text-xs text-muted dark:text-zinc-400 leading-relaxed">
          {texts.desc}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle dark:border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="min-h-[44px]"
          >
            {texts.cancel}
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmLogout}
            icon={<LogOut className="w-4 h-4" />}
            className="min-h-[44px]"
          >
            {texts.logout}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
