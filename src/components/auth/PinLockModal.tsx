import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Logo } from '../common/Logo';
import { UserAccount } from '../../types';
import { verifyPin, hashPin } from '../../utils/crypto';
import {
  Lock,
  Users,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Mail,
  User,
  KeyRound,
} from 'lucide-react';

const PRESET_COLORS = [
  'bg-info', // Notion Blue
  'bg-positive', // Notion Teal
  'bg-warning', // Notion Amber
  'bg-negative', // Notion Red
  'bg-accent', // Notion Purple
  'text-content', // Notion Slate
];

export const PinLockModal: React.FC = () => {
  const {
    isPinUnlocked,
    setPinUnlocked,
    setPinCode,
    accounts,
    activeAccountId,
    switchAccount,
    createAccount,
    language,
    showToast,
  } = useAppStore();

  const isAr = language === 'ar';

  // Mode: 'choose' (pick an account) | 'pin' (enter PIN for chosen account) | 'create' (add account)
  const [mode, setMode] = useState<'choose' | 'pin' | 'create'>('choose');
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);

  // PIN state
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);

  // New account creation state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // When lock screen opens, default to 'choose' mode
  useEffect(() => {
    if (!isPinUnlocked) {
      setMode('choose');
      setDigits([]);
      setError(false);
      setSelectedAccount(null);
    }
  }, [isPinUnlocked]);

  // Physical keyboard listener for PIN mode
  useEffect(() => {
    if (isPinUnlocked || mode !== 'pin' || !selectedAccount) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        setMode('choose');
        setDigits([]);
        setError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinUnlocked, mode, selectedAccount, digits]);

  if (isPinUnlocked) {
    return null;
  }

  // --- Handlers for Account Selection ---
  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedAccount(acc);
    setDigits([]);
    setError(false);

    // If account has PIN protection, prompt for PIN
    if (acc.pinEnabled && acc.pinCode) {
      setMode('pin');
    } else {
      // Direct unlock without PIN
      switchAccount(acc.id);
      setPinUnlocked(true);
    }
  };

  // --- Handlers for PIN Numpad ---
  const handleDigit = (digit: string) => {
    if (digits.length >= 4 || !selectedAccount) return;
    const newDigits = [...digits, digit];
    setDigits(newDigits);
    setError(false);

    if (newDigits.length === 4) {
      const enteredCode = newDigits.join('');
      verifyPin(enteredCode, selectedAccount.pinCode)
        .then(({ isValid, needsUpgrade }) => {
          if (isValid) {
            if (needsUpgrade) {
              hashPin(enteredCode)
                .then((hashed) => {
                  setPinCode(hashed);
                })
                .catch(() => {});
            }
            switchAccount(selectedAccount.id);
            setPinUnlocked(true);
            setDigits([]);
          } else {
            setError(true);
            setTimeout(() => {
              setDigits([]);
              setError(false);
            }, 500);
          }
        })
        .catch(() => {
          setError(true);
          setTimeout(() => {
            setDigits([]);
            setError(false);
          }, 500);
        });
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setDigits([]);
    setError(false);
  };

  // --- Handlers for Creating 2nd Account ---
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (accounts.length >= 2) {
      showToast({
        message: isAr ? 'الحد الأقصى هو حسابين' : 'Limite de 2 profils atteinte',
      });
      setMode('choose');
      return;
    }

    const createdId = createAccount(
      newName.trim(),
      newEmail.trim() || undefined,
      newPin.trim().length === 4 ? newPin.trim() : undefined,
      newColor,
      'User'
    );

    setNewName('');
    setNewEmail('');
    setNewPin('');
    // Automatically switch and unlock with the newly created account
    switchAccount(createdId);
    setPinUnlocked(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-surface rounded-xl p-6 shadow-2xl border border-border text-center animate-in zoom-in-95 duration-150 relative">
        {/* Top Logo */}
        <div className="flex justify-center mb-2">
          <Logo size="md" showWordmark={true} />
        </div>

        {/* ================= MODE 1: CHOOSE ACCOUNT ================= */}
        {mode === 'choose' && (
          <div className="space-y-4 pt-1">
            <div>
              <h2 className="text-base font-semibold text-content">
                {isAr ? 'من يستخدم Flouss ؟' : 'Qui utilise Flouss ?'}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isAr
                  ? 'انقر على حسابك لإدخال رمز PIN والدخول'
                  : 'Sélectionnez votre profil pour vous identifier'}
              </p>
            </div>

            {/* Accounts List */}
            <div className="space-y-2 pt-1">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full p-3 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 hover:bg-surface-3 hover:border-info/60 dark:hover:border-info/60 transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center text-accent-contrast text-xs font-bold shrink-0 shadow-xs transition-transform group-hover:scale-105"
                      style={{ backgroundColor: acc.avatarColor || 'bg-info' }}
                    >
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-content truncate block">
                        {acc.name}
                      </span>
                      {acc.email && (
                        <span className="text-[11px] text-muted truncate block">
                          {acc.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {acc.pinEnabled && acc.pinCode ? (
                      <span className="text-[10px] text-muted flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-border">
                        <Lock className="w-2.5 h-2.5" /> PIN
                      </span>
                    ) : (
                      <span className="text-[10px] text-positive dark:text-positive bg-positive dark:bg-positive/40 px-2 py-0.5 rounded border border-positive/50">
                        {isAr ? 'مفتوح' : 'Direct'}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-info transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            {/* Add Another Account Button (if < 2 accounts) */}
            {accounts.length < 2 ? (
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="w-full py-2.5 px-3 rounded-lg border border-dashed border-border hover:border-info text-xs font-medium text-muted hover:text-info hover:text-content hover:bg-surface-2 dark:hover:bg-surface-2 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-info" />
                  <span>{isAr ? 'إضافة حساب ثانٍ' : 'Ajouter un autre compte (Profil 2)'}</span>
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-muted pt-1">
                {isAr
                  ? 'تم تسجيل حسابين (الحد الأقصى)'
                  : '2 profils enregistrés (limite maximale)'}
              </p>
            )}
          </div>
        )}

        {/* ================= MODE 2: ENTER PIN FOR SELECTED ACCOUNT ================= */}
        {mode === 'pin' && selectedAccount && (
          <div className="space-y-4 pt-1">
            {/* Account Header with Back Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('choose');
                  setDigits([]);
                  setError(false);
                }}
                className="p-1 rounded text-xs text-muted hover:text-content hover:text-content flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isAr ? 'رجوع' : 'Retour'}</span>
              </button>

              <span className="text-[11px] text-muted">
                {isAr ? 'تأكيد الهوية' : 'Sécurité'}
              </span>
            </div>

            <div>
              <div
                className="w-10 h-10 mx-auto rounded-md flex items-center justify-center text-accent-contrast text-sm font-bold shadow-xs mb-2"
                style={{ backgroundColor: selectedAccount.avatarColor || 'bg-info' }}
              >
                {selectedAccount.name.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-base font-semibold text-content">
                {selectedAccount.name}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {isAr ? 'أدخل رمز PIN المكون من 4 أرقام' : 'Entrez votre code PIN (4 chiffres)'}
              </p>
            </div>

            {/* 4 PIN Dots */}
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = digits.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                      error
                        ? 'bg-negative border-negative scale-110'
                        : isFilled
                        ? 'bg-info border-info scale-110'
                        : 'border-border bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <p className="text-xs text-negative0 font-medium">
                {isAr ? 'رمز PIN غير صحيح' : 'Code PIN incorrect'}
              </p>
            )}

            {/* Notion Numpad */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-[210px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(num)}
                  className="h-10 rounded-md bg-surface-2 hover:bg-surface-3 hover:bg-surface-3 border border-border text-sm font-semibold text-content transition-colors"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-10 rounded-md text-[11px] text-muted hover:bg-surface-3 hover:bg-surface-3 flex items-center justify-center transition-colors"
              >
                {isAr ? 'مسح' : 'C'}
              </button>

              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-10 rounded-md bg-surface-2 hover:bg-surface-3 hover:bg-surface-3 border border-border text-sm font-semibold text-content transition-colors"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="h-10 rounded-md text-xs text-muted hover:bg-surface-3 hover:bg-surface-3 flex items-center justify-center transition-colors"
                aria-label="Supprimer"
              >
                ⌫
              </button>
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setMode('choose');
                  setDigits([]);
                  setError(false);
                }}
                className="text-xs text-info hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isAr ? 'اختيار حساب آخر' : 'Changer d’utilisateur'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE 3: CREATE 2ND ACCOUNT ================= */}
        {mode === 'create' && (
          <form onSubmit={handleCreateAccount} className="space-y-3.5 text-left pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="p-1 rounded text-xs text-muted hover:text-content hover:text-content flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isAr ? 'رجوع' : 'Retour'}</span>
              </button>
              <h3 className="text-xs font-semibold text-content">
                {isAr ? 'إضافة الحساب الثاني' : 'Nouveau Compte (Profil 2)'}
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">
                {isAr ? 'اسم الحساب / الملف' : 'Nom du compte'}
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Professionnel, Épargne"
                className="w-full text-xs py-2 px-3 rounded-md border border-border bg-surface-2 text-content focus:outline-none focus:border-info"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">
                {isAr ? 'البريد الإلكتروني (اختياري)' : 'Adresse Email (optionnel)'}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="compte2@gmail.com"
                className="w-full text-xs py-2 px-3 rounded-md border border-border bg-surface-2 text-content focus:outline-none focus:border-info"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1">
                {isAr ? 'رمز PIN (4 أرقام - اختياري)' : 'Code PIN (4 chiffres - optionnel)'}
              </label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-xs py-2 px-3 rounded-md border border-border bg-surface-2 text-content font-mono tracking-widest focus:outline-none focus:border-info"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted mb-1.5">
                {isAr ? 'اللون' : 'Couleur'}
              </label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewColor(col)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-accent-contrast transition-all ${
                      newColor === col ? 'ring-2 ring-info ring-offset-1' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col }}
                  >
                    {newColor === col && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="flex-1 py-2 px-3 rounded-md border border-border hover:bg-surface-3 hover:bg-surface-3 text-xs font-medium text-muted transition-colors"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex-1 py-2 px-3 rounded-md bg-info hover:bg-info text-accent-contrast text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                {isAr ? 'إنشاء ودخول' : 'Créer et entrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
