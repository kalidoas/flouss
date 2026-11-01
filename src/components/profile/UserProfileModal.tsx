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
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-blue-500/20 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white tracking-tight truncate">
              {displayName}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{email}</span>
            </div>
          </div>
        </div>

        {/* Cloud Sync Status Card */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-white block">
                {tProfile.cloudSyncStatus}
              </span>
              <span className="text-[11px] text-zinc-400">
                {firestoreDisabled ? tProfile.localOnly : tProfile.syncedRealtime}
              </span>
            </div>
          </div>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
        </div>

        {/* 2FA PIN Security */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/[0.04] dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {tProfile.twoFactorSecurity}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                userPinCode
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
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
                className="w-full text-center tracking-widest text-base font-bold py-2 rounded-xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] text-zinc-900 dark:text-white outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPin(false)}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {tProfile.close}
                </button>
                {userPinCode && (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:underline"
                  >
                    Désactiver PIN
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditingPin(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200/50 dark:border-rose-900/40 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{tProfile.logOutButton}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
