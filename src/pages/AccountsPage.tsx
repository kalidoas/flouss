import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Banknote, Plus, Trash2, Wallet } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FinancialAccountType } from '../types';
import { translations } from '../i18n/translations';
import { resolveFinancialAccounts, calculateFinancialAccountBalances } from '../utils/financialAccounts';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AmountKeypad } from '../components/common/AmountKeypad';
import { Money } from '../components/common/Money';
import { useMotionMode, useMotionPrefs } from '../motion/useMotionPrefs';

const accountTypes: FinancialAccountType[] = ['cash', 'bank', 'wallet'];

export const AccountsPage: React.FC = () => {
  const {
    activeAccountId, initialBalance, financialAccounts, transactions, language,
    addFinancialAccount, deleteFinancialAccount, transferBetweenFinancialAccounts, showToast,
  } = useAppStore();
  const t = translations[language].accounts;
  const motionMode = useMotionMode();
  const reducedMotion = useMotionPrefs() || motionMode === 'calm';
  const currency = translations[language].currency;
  const accounts = useMemo(
    () => resolveFinancialAccounts(activeAccountId ?? 'default', initialBalance, financialAccounts),
    [activeAccountId, initialBalance, financialAccounts]
  );
  const balances = useMemo(() => calculateFinancialAccountBalances(accounts, transactions), [accounts, transactions]);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialAccountType>('bank');
  const [openingBalance, setOpeningBalance] = useState('');
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const getAccountName = (account: (typeof accounts)[number]) => account.isPrimary ? t.cash : account.name;

  const handleAddAccount = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const opening = Number(openingBalance.replace(',', '.')) || 0;
    const newId = `fa_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const created = addFinancialAccount({
      id: newId,
      name: name.trim(),
      type,
      openingBalance: opening,
      createdAt: new Date().toISOString(),
    });
    if (!created) {
      showToast({ message: t.transferInvalid });
      return;
    }
    setName('');
    setOpeningBalance('');
    setShowAdd(false);
  };

  const handleTransfer = (event: React.FormEvent) => {
    event.preventDefault();
    const success = transferBetweenFinancialAccounts({
      fromAccountId,
      toAccountId,
      amount: Number(transferAmount.replace(',', '.')) || 0,
      note: transferNote,
    });
    showToast({ message: success ? t.transferSuccess : t.transferInvalid });
    if (success) {
      setTransferAmount('');
      setTransferNote('');
      setShowTransfer(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t.deleteFinancialAccountConfirm)) return;
    if (!deleteFinancialAccount(id)) showToast({ message: t.accountHasActivity });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">{t.financialAccountsTitle}</h1>
          <p className="mt-1 text-sm text-muted">{t.financialAccountsSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={accounts.length < 2} onClick={() => {
            setFromAccountId(accounts[0]?.id ?? '');
            setToAccountId(accounts[1]?.id ?? '');
            setShowTransfer(true);
          }} icon={<ArrowLeftRight className="h-4 w-4" />}>
            {t.transfer}
          </Button>
          <Button variant="primary" onClick={() => setShowAdd(true)} icon={<Plus className="h-4 w-4" />}>
            {t.newFinancialAccount}
          </Button>
        </div>
      </header>

      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-border-subtle bg-surface p-5 text-sm text-muted">{t.noFinancialAccounts}</p>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={t.financialAccountsTitle}>
          {accounts.map((account, index) => (
            <motion.article key={account.id} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={reducedMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2, delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.21) }} className="rounded-2xl border border-border-subtle bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  {account.type === 'cash' ? <Banknote className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                {!account.isPrimary && (
                  <button type="button" onClick={() => handleDelete(account.id)} className="min-h-11 min-w-11 rounded-xl text-muted hover:bg-negative/10 hover:text-negative" aria-label={t.deleteFinancialAccount} title={t.deleteFinancialAccount}>
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                )}
              </div>
              <h2 className="mt-4 truncate text-base font-semibold text-content">{getAccountName(account)}</h2>
              <p className="mt-1 text-xs text-muted">{t[account.type]}</p>
              <Money amount={balances[account.id] ?? 0} className="mt-4 block text-2xl font-bold tabular-nums text-content" />
            </motion.article>
          ))}
        </section>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t.newFinancialAccount}>
        <form onSubmit={handleAddAccount} className="space-y-4 pt-2">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.accountName}</span>
            <input required value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3 text-sm text-content" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.accountType}</span>
            <select value={type} onChange={(event) => setType(event.target.value as FinancialAccountType)} className="min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3 text-sm text-content">
              {accountTypes.map((kind) => <option key={kind} value={kind}>{t[kind]}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.openingBalance}</span>
            <AmountKeypad amount={openingBalance} onChange={setOpeningBalance} currency={currency} />
            <span className="text-[11px] text-muted">{t.openingBalanceHint}</span>
          </label>
          <div className="flex justify-end gap-2 border-t border-border/10 pt-3">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>{translations[language].common.cancel}</Button>
            <Button type="submit" variant="primary">{translations[language].common.save}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title={t.transferTitle}>
        <form onSubmit={handleTransfer} className="space-y-4 pt-2">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.fromAccount}</span>
            <select required value={fromAccountId} onChange={(event) => {
              const nextSource = event.target.value;
              setFromAccountId(nextSource);
              if (toAccountId === nextSource) setToAccountId(accounts.find((account) => account.id !== nextSource)?.id ?? '');
            }} className="min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3 text-sm text-content">
              {accounts.map((account) => <option key={account.id} value={account.id}>{getAccountName(account)} · {currency} {balances[account.id] ?? 0}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.toAccount}</span>
            <select required value={toAccountId} onChange={(event) => setToAccountId(event.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3 text-sm text-content">
              {accounts.filter((account) => account.id !== fromAccountId).map((account) => <option key={account.id} value={account.id}>{getAccountName(account)}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.transferAmount}</span>
            <AmountKeypad amount={transferAmount} onChange={setTransferAmount} currency={currency} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-content">{t.transferNote}</span>
            <input value={transferNote} onChange={(event) => setTransferNote(event.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-surface-3 px-3 text-sm text-content" />
          </label>
          <div className="flex justify-end gap-2 border-t border-border/10 pt-3">
            <Button type="button" variant="ghost" onClick={() => setShowTransfer(false)}>{translations[language].common.cancel}</Button>
            <Button type="submit" variant="primary">{t.transfer}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
