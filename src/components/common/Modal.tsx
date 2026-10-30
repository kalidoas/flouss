import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Content Dialog */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white dark:bg-[#202020] rounded-t-xl sm:rounded-lg shadow-xl border border-[#e3e2de] dark:border-[#2f2f2f] overflow-hidden z-10 max-h-[92vh] flex flex-col transform transition-all duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="px-5 py-4 flex items-start justify-between border-b border-[#e3e2de] dark:border-[#2f2f2f]">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-[#37352f] dark:text-[#ecebed]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#2e2e2e] transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
