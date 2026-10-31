import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import { ShieldCheck, Lock, LogOut } from 'lucide-react';

interface PinAuthScreenProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    uid: string;
  };
  language?: 'ar' | 'fr' | 'en';
  onVerify: (pin: string) => boolean;
  onLogout: () => void;
}

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({
  user,
  language = 'ar',
  onVerify,
  onLogout,
}) => {
  const isAr = language === 'ar';
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Physical keyboard listener for fast typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [digits]);

  const handleDigit = (digit: string) => {
    if (digits.length >= 4) return;
    const nextDigits = [...digits, digit];
    setDigits(nextDigits);
    setError(false);
    setErrorMessage('');

    if (nextDigits.length === 4) {
      const pin = nextDigits.join('');
      const isValid = onVerify(pin);
      if (!isValid) {
        setError(true);
        setErrorMessage(
          isAr
            ? 'رمز PIN غير صحيح، يرجى المحاولة مرة أخرى'
            : 'Code PIN incorrect, veuillez réessayer'
        );
        setTimeout(() => {
          setDigits([]);
          setError(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setDigits([]);
    setError(false);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-[#191919] p-4 transition-colors">
      <div className="w-full max-w-sm bg-white dark:bg-[#202020] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#e3e2de] dark:border-[#2f2f2f] text-center animate-in zoom-in-95 duration-200">
        {/* Top Logo */}
        <div className="flex justify-center mb-3">
          <Logo size="md" showWordmark={true} />
        </div>

        {/* User Identity Pill */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] mb-4 max-w-full">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="w-6 h-6 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-right truncate">
            <span className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] block truncate">
              {user.displayName || user.email?.split('@')[0]}
            </span>
          </div>
        </div>

        {/* Security Title & Description */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#37352f] dark:text-[#ecebed]">
            {isAr ? 'التحقق بخطوتين (رمز PIN)' : 'Vérification en deux étapes (PIN)'}
          </h2>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
            {isAr
              ? 'أدخل رمز PIN السري المكون من 4 أرقام لمتابعة الدخول'
              : 'Saisissez votre code PIN secret à 4 chiffres pour continuer'}
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex justify-center gap-3.5 py-2 mb-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = digits.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 border-rose-500 scale-110'
                    : isFilled
                    ? 'bg-emerald-600 border-emerald-600 scale-110'
                    : 'border-[#e3e2de] dark:border-[#3f3f3f] bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-xs text-rose-500 font-medium mb-2 animate-shake">
            {errorMessage}
          </p>
        )}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-11 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-all cursor-pointer shadow-2xs"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-11 rounded-xl text-xs font-medium text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            {isAr ? 'مسح' : 'C'}
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-11 rounded-xl bg-[#fbfbfa] dark:bg-[#1a1a1a] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 border border-[#e3e2de] dark:border-[#2f2f2f] text-sm font-semibold text-[#37352f] dark:text-[#ecebed] transition-all cursor-pointer shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-11 rounded-xl text-xs font-medium text-[#787774] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Supprimer"
          >
            ⌫
          </button>
        </div>

        {/* Logout / Switch Google Account */}
        <div className="pt-5 mt-4 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الخروج والرجوع' : 'Changer de compte Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinAuthScreen;
