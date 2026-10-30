import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatMAD } from '../../utils/formatters';
import { calculateAvailableBalance } from '../../utils/calculations';
import {
  Users,
  Plus,
  Check,
  Edit2,
  Trash2,
  AlertTriangle,
  Mail,
  Lock,
  Shield,
  KeyRound,
} from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#2383e2', // Notion Blue
  '#0f7b6c', // Notion Teal
  '#d9730d', // Notion Amber
  '#df5452', // Notion Red
  '#6940a5', // Notion Purple
  '#37352f', // Notion Gray
];

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    accounts,
    activeAccountId,
    switchAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    language,
    showToast,
  } = useAppStore();

  const tAcc = translations[language].accounts;
  const tCommon = translations[language].common;
  const isAr = language === 'ar';

  const [isCreating, setIsCreating] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountPin, setNewAccountPin] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const canAddAccount = accounts.length < 2;

  const handleSelectAccount = (id: string) => {
    if (id === activeAccountId) return;
    switchAccount(id);
    onClose();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    if (accounts.length >= 2) {
      showToast({
        message: isAr ? 'الحد الأقصى هو حسابين فقط' : 'Maximum 2 profils autorisés',
      });
      return;
    }

    createAccount(
      newAccountName.trim(),
      newAccountEmail.trim(),
      newAccountPin.trim().length === 4 ? newAccountPin.trim() : undefined,
      selectedColor,
      'User'
    );

    setNewAccountName('');
    setNewAccountEmail('');
    setNewAccountPin('');
    setIsCreating(false);
    onClose();
  };

  const handleStartEdit = (acc: { id: string; name: string; email?: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccountId(acc.id);
    setEditName(acc.name);
    setEditEmail(acc.email || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccountId && editName.trim()) {
      updateAccount(editingAccountId, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      setEditingAccountId(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingAccountId) {
      deleteAccount(deletingAccountId);
      setDeletingAccountId(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !deletingAccountId}
        onClose={onClose}
        title={tAcc.title}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
            <p>{isAr ? 'إدارة حساباتك (حد أقصى ملفين)' : 'Gérez vos comptes (max 2 profils distincts)'}</p>
            <span className="font-medium bg-[#f1f0ee] dark:bg-[#282828] px-2 py-0.5 rounded text-[11px]">
              {accounts.length}/2
            </span>
          </div>

          {/* Accounts List */}
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isActive = acc.id === activeAccountId;
              const balance = calculateAvailableBalance(acc.initialBalance, acc.transactions || []);

              return (
                <div
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc.id)}
                  className={`p-3 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#f7f6f3] dark:bg-[#282828] border-[#2383e2]/40 shadow-xs'
                      : 'border-[#e3e2de] dark:border-[#2f2f2f] hover:bg-[#fbfbfa] dark:hover:bg-[#222222]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: acc.avatarColor || '#2383e2' }}
                    >
                      {acc.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] truncate">
                          {acc.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-[#2383e2]/15 text-[#2383e2] px-1.5 py-0.2 rounded font-medium">
                            {isAr ? 'الحالي' : 'Actif'}
                          </span>
                        )}
                        {acc.pinEnabled && acc.pinCode && (
                          <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> PIN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#787774] dark:text-[#9b9a97]">
                        {acc.email && (
                          <span className="flex items-center gap-1 truncate max-w-[140px]">
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            {acc.email}
                          </span>
                        )}
                        <span className="font-mono text-[#37352f] dark:text-[#ecebed]">
                          {formatMAD(balance, false, language)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleStartEdit(acc, e)}
                      className="p-1 rounded text-[#787774] hover:text-[#37352f] hover:bg-[#e3e2de]/50 dark:hover:bg-[#333] transition-colors"
                      title={tCommon.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingAccountId(acc.id);
                        }}
                        className="p-1 rounded text-[#787774] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={tCommon.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inline Edit Form */}
          {editingAccountId && (
            <form
              onSubmit={handleSaveEdit}
              className="p-3 bg-[#fbfbfa] dark:bg-[#1a1a1a] rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] space-y-2.5"
            >
              <span className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed] block">
                {tCommon.edit} :
              </span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nom du compte"
                  className="w-full py-1.5 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-xs font-medium"
                  autoFocus
                />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email lié (optionnel)"
                  className="w-full py-1.5 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-xs font-medium"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingAccountId(null)}
                >
                  {tCommon.cancel}
                </Button>
                <Button type="submit" size="sm" variant="primary">
                  {tCommon.save}
                </Button>
              </div>
            </form>
          )}

          {/* Create New Account Button or Form */}
          {canAddAccount && !isCreating && (
            <Button
              variant="outline"
              fullWidth
              onClick={() => setIsCreating(true)}
              icon={<Plus className="w-3.5 h-3.5 text-[#2383e2]" />}
            >
              {isAr ? 'إضافة حساب ثانٍ' : 'Ajouter un 2ème profil'}
            </Button>
          )}

          {!canAddAccount && !isCreating && (
            <p className="text-[11px] text-center text-[#787774] dark:text-[#9b9a97] italic">
              {isAr
                ? 'تم الوصول إلى الحد الأقصى (حسابين منفصلين).'
                : 'Limite de 2 profils atteinte pour une utilisation personnelle sécurisée.'}
            </p>
          )}

          {isCreating && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-3.5 rounded-md bg-[#fbfbfa] dark:bg-[#1a1a1a] border border-[#e3e2de] dark:border-[#2f2f2f] space-y-3"
            >
              <h4 className="text-xs font-semibold text-[#37352f] dark:text-[#ecebed]">
                {isAr ? 'إنشاء الحساب الثاني' : 'Nouveau compte (Profil 2)'}
              </h4>

              <div>
                <label className="text-[11px] font-medium text-[#787774] block mb-1">
                  {tAcc.accountName}
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ex: Professionnel ou Épargne"
                  className="w-full py-1.5 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-xs font-medium outline-none focus:border-[#2383e2]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#787774] block mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Adresse Email'}
                </label>
                <input
                  type="email"
                  value={newAccountEmail}
                  onChange={(e) => setNewAccountEmail(e.target.value)}
                  placeholder="compte2@gmail.com"
                  className="w-full py-1.5 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-xs font-medium outline-none focus:border-[#2383e2]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#787774] block mb-1">
                  {isAr ? 'رمز PIN السري (4 أرقام - اختياري)' : 'Code PIN (4 chiffres - optionnel)'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newAccountPin}
                  onChange={(e) => setNewAccountPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full py-1.5 px-3 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-xs font-mono tracking-widest outline-none focus:border-[#2383e2]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#787774] block mb-1.5">
                  {tAcc.color}
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-white transition-all ${
                        selectedColor === col ? 'ring-2 ring-[#2383e2] ring-offset-1' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    >
                      {selectedColor === col && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setIsCreating(false)}
                >
                  {tCommon.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!newAccountName.trim()}
                >
                  {tCommon.save}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingAccountId)}
        onClose={() => setDeletingAccountId(null)}
        title={tCommon.delete}
        maxWidth="sm"
      >
        <div className="text-center space-y-3.5">
          <div className="w-10 h-10 mx-auto rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <p className="text-xs text-[#5f5e5b] dark:text-[#9b9a97] leading-relaxed">
            {tAcc.deleteConfirm}
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setDeletingAccountId(null)}
            >
              {tCommon.cancel}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeleteConfirm}
            >
              {tCommon.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
