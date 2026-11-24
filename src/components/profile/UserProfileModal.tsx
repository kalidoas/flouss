import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  User,
  Mail,
  ShieldCheck,
  Cloud,
  LogOut,
  KeyRound,
  Check,
  Lock,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    firebaseUser,
    userPinCode,
    setPinCode,
    logout,
    firestoreDisabled,
    language,
    showToast,
  } = useAppStore();

  const tProfile = translations[language].userProfileModal;

  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  const displayName =
    firebaseUser?.displayName || firebaseUser?.email?.split('@')[0] || 'Utilisateur Flouss';
  const email = firebaseUser?.email || '';

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length !== 4 || isNaN(Number(newPin))) {
      showToast({ message: 'Le code PIN doit comporter exactement 4 chiffres' });
      return;
    }
    await setPinCode(newPin.trim());
    setNewPin('');
    setIsEditingPin(false);
    showToast({ message: 'Code PIN 2FA configuré avec succès !' });
  };

  const handleRemovePin = async () => {
    await setPinCode(null);
    setIsEditingPin(false);
    showToast({ message: 'Code PIN désactivé' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tProfile.title}
      subtitle={tProfile.subtitle}
    >
      <div className="space-y-5 pt-1">
        {/* User Card */}
        <div className="p-4 rounded-2xl bg-surface-3 dark:bg-surface/50 border border-border/[0.04] dark:border-border/[0.06] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-info to-accent text-accent-contrast flex items-center justify-center text-lg font-bold shadow-md shadow-md shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-text dark:text-text tracking-tight truncate">
              {displayName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted dark:text-muted mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{email}</span>
            </div>
          </div>
        </div>

        {/* Cloud Sync Status Card */}
        <div className="p-3.5 rounded-2xl bg-surface dark:bg-surface/60 border border-border/[0.06] dark:border-border/[0.08] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-info/15 text-info dark:text-info border border-info/20 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-text dark:text-text block">
                {tProfile.cloudSyncStatus}
              </span>
              <span className="text-[11px] text-muted">
                {firestoreDisabled ? tProfile.localOnly : tProfile.syncedRealtime}
              </span>
            </div>
          </div>

          <span className="w-2.5 h-2.5 rounded-full bg-positive shadow-[0_0_8px_bg-positive] animate-pulse" />
        </div>

        {/* 2FA PIN Security */}
        <div className="p-4 rounded-2xl bg-surface-3 dark:bg-surface/50 border border-border/[0.04] dark:border-border/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-positive" />
              <span className="font-bold text-text dark:text-text">
                {tProfile.twoFactorSecurity}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                userPinCode
                  ? 'bg-positive/15 text-positive dark:text-positive border border-positive/20'
                  : 'bg-surface-2 dark:bg-surface text-muted dark:text-muted'
              }`}
            >
              {userPinCode ? tProfile.pinConfigured : tProfile.pinNotConfigured}
            </span>
          </div>

          {isEditingPin ? (
            <form onSubmit={handleSavePin} className="space-y-2 pt-2">
              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="•••• (4 chiffres)"
                className="w-full text-center tracking-widest text-base font-bold py-2 rounded-xl bg-surface dark:bg-surface border border-border/[0.08] dark:border-border/[0.1] text-text dark:text-text outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPin(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:text-text dark:hover:text-text"
                >
                  {tProfile.close}
                </button>
                {userPinCode && (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 text-xs text-negative hover:underline"
                  >
                    Désactiver PIN
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-info hover:bg-info text-accent-contrast text-xs font-bold transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditingPin(true)}
                className="text-xs font-semibold text-info dark:text-info hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{userPinCode ? tProfile.changePin : tProfile.configurePin}</span>
              </button>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-negative dark:text-negative bg-negative dark:bg-negative/30 hover:bg-negative dark:hover:bg-negative/50 border border-negative/50 dark:border-negative/40 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{tProfile.logOutButton}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
