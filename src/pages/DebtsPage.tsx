import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DebtItem, DebtType } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatMAD } from '../utils/formatters';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Coins,
  Check,
} from 'lucide-react';

export const DebtsPage: React.FC = () => {
  const { debts, addDebt, updateDebt, deleteDebt, settleDebt, recordDebtPayment, hideBalance, language } =
    useAppStore();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'lend' | 'borrow' | 'settled'>('all');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('lend');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtPaid, setDebtPaid] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Partial Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');

  // Financial Summaries
  const summary = useMemo(() => {
    let lendTotal = 0;
    let lendPaid = 0;
    let borrowTotal = 0;
    let borrowPaid = 0;

    (debts || []).forEach((d) => {
      if (d.isSettled) return;
      if (d.type === 'lend') {
        lendTotal += d.totalAmount;
        lendPaid += d.paidAmount || 0;
      } else {
        borrowTotal += d.totalAmount;
        borrowPaid += d.paidAmount || 0;
      }
    });

    const toCollect = lendTotal - lendPaid;
    const toPay = borrowTotal - borrowPaid;
    const net = toCollect - toPay;

    return { toCollect, toPay, net };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return (debts || []).filter((d) => {
      // Tab filter
      if (activeTab === 'settled') {
        if (!d.isSettled) return false;
      } else {
        if (d.isSettled && activeTab !== 'all') return false;
        if (activeTab === 'lend' && d.type !== 'lend') return false;
        if (activeTab === 'borrow' && d.type !== 'borrow') return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.personName.toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [debts, activeTab, search]);

  const handleOpenAdd = () => {
    setEditingDebt(null);
    setDebtPerson('');
    setDebtType('lend');
    setDebtTotal('');
    setDebtPaid('');
    setDebtDueDate('');
    setDebtNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (debt: DebtItem) => {
    setEditingDebt(debt);
    setDebtPerson(debt.personName);
    setDebtType(debt.type);
    setDebtTotal(debt.totalAmount.toString());
    setDebtPaid(debt.paidAmount ? debt.paidAmount.toString() : '');
    setDebtDueDate(debt.dueDate || '');
    setDebtNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotal);
    const paid = debtPaid ? parseFloat(debtPaid) : 0;
    if (!debtPerson.trim() || isNaN(total) || total <= 0) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        personName: debtPerson.trim(),
        type: debtType,
        totalAmount: total,
        paidAmount: Math.min(total, Math.max(0, paid)),
        dueDate: debtDueDate || undefined,
        notes: debtNotes.trim() || undefined,
      });
    } else {
      addDebt({
        personName: debtPerson.trim(),
        type: debtType,
        totalAmount: total,
        paidAmount: Math.min(total, Math.max(0, paid)),
        dueDate: debtDueDate || undefined,
        notes: debtNotes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleOpenPayment = (id: string) => {
    setPaymentDebtId(id);
    setPartialAmount('');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(partialAmount);
    if (paymentDebtId && !isNaN(amt) && amt > 0) {
      recordDebtPayment(paymentDebtId, amt);
    }
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isAr ? 'السلف والكريدي' : 'Dettes & Emprunts'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {isAr ? 'فلوسي وفلوس الناس' : 'Prêts & Dettes'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'تتبع الأموال التي تسالها للغير، والأموال التي يدين بها الآخرون لك'
              : 'Gérez ce que les gens vous doivent et ce que vous devez rembourser.'}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isAr ? 'إضافة سلف / كريدي' : 'Nouveau Prêt / Dette'}</span>
        </Button>
      </div>

      {/* Summary Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* On me doit */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3.5 border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            <span>{isAr ? 'فلوسي عند الناس (كنسالهم)' : 'On me doit (À récupérer)'}</span>
            <div className="w-5 h-5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className={`text-xl font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            {formatMAD(summary.toCollect, false, language)}
          </span>
        </div>

        {/* Je dois */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3.5 border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">
            <span>{isAr ? 'فلوس الناس عندي (كيسالوني)' : 'Je dois (À rembourser)'}</span>
            <div className="w-5 h-5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className={`text-xl font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
            {formatMAD(summary.toPay, false, language)}
          </span>
        </div>

        {/* Net */}
        <div className="bg-white dark:bg-[#202020] rounded-lg p-3.5 border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-[#787774] dark:text-[#9b9a97] mb-1">
            <span>{isAr ? 'الصافي' : 'Solde Net'}</span>
            <div className="w-5 h-5 rounded bg-[#f1f0ee] dark:bg-[#282828] text-[#787774] flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <span
            className={`text-xl font-semibold tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''} ${
              summary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {summary.net > 0 ? '+' : ''}
            {formatMAD(summary.net, false, language)}
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 bg-[#f1f0ee] dark:bg-[#282828] rounded-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            {isAr ? 'الكل' : 'Tous'}
          </button>
          <button
            onClick={() => setActiveTab('lend')}
            className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
              activeTab === 'lend'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            {isAr ? 'كنسالهم' : 'Ils me doivent'}
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
              activeTab === 'borrow'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            {isAr ? 'كيسالوني' : 'Je dois'}
          </button>
          <button
            onClick={() => setActiveTab('settled')}
            className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
              activeTab === 'settled'
                ? 'bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] font-medium shadow-xs'
                : 'text-[#787774] dark:text-[#9b9a97]'
            }`}
          >
            {isAr ? 'تم خلاصه' : 'Réglés'}
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? 'بحث بالاسم أو الملاحظة...' : 'Rechercher une personne...'}
          className="px-3 py-1.5 rounded-md bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] text-xs text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2] w-full sm:w-60"
        />
      </div>

      {/* Debts List */}
      <div className="space-y-2.5">
        {filteredDebts.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="w-5 h-5" />}
            title={isAr ? 'لا يوجد أي سلف أو دين مسجل' : 'Aucune dette enregistrée'}
            description={
              isAr
                ? 'سجل سلف أو كريدي لكي لا تنسى أموالك أو التزاماتك'
                : 'Notez vos prêts ou vos emprunts pour garder vos comptes clairs.'
            }
            action={
              <Button onClick={handleOpenAdd} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                <span>{isAr ? 'تسجيل سلف جديد' : 'Ajouter une dette'}</span>
              </Button>
            }
          />
        ) : (
          filteredDebts.map((debt) => {
            const isLend = debt.type === 'lend';
            const remaining = Math.max(0, debt.totalAmount - (debt.paidAmount || 0));
            const progress = Math.min(100, Math.round(((debt.paidAmount || 0) / debt.totalAmount) * 100));

            return (
              <div
                key={debt.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  debt.isSettled
                    ? 'bg-[#fbfbfa] dark:bg-[#1f1f1f] border-[#e3e2de] dark:border-[#2f2f2f] opacity-75'
                    : 'bg-white dark:bg-[#202020] border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium uppercase tracking-wider ${
                          isLend
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {isLend ? (isAr ? 'أنا سلفت' : 'On me doit') : (isAr ? 'أنا تسلفت' : 'Je dois')}
                      </span>
                      <h4 className="font-medium text-sm text-[#37352f] dark:text-[#ecebed]">
                        {debt.personName}
                      </h4>
                      {debt.isSettled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                          <Check className="w-3 h-3 stroke-[3]" /> {isAr ? 'تم الخلاص' : 'Réglé'}
                        </span>
                      )}
                    </div>

                    {debt.notes && (
                      <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                        {debt.notes}
                      </p>
                    )}

                    {debt.dueDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#787774] dark:text-[#9b9a97]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {isAr ? 'تاريخ الاستحقاق :' : 'Échéance :'} {debt.dueDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-medium">
                        {isAr ? 'المتبقي' : 'Reste à payer'}
                      </div>
                      <div
                        className={`text-base font-semibold tabular-nums transition-[filter] duration-200 ${
                          hideBalance ? 'privacy-blur' : ''
                        } ${
                          debt.isSettled
                            ? 'text-[#787774] line-through'
                            : isLend
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatMAD(remaining, false, language)}
                      </div>
                      {debt.paidAmount > 0 && !debt.isSettled && (
                        <div className={`text-[10px] text-[#787774] dark:text-[#9b9a97] transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                          {formatMAD(debt.paidAmount, false, language)} {isAr ? 'تم دفعه' : 'déjà payé'}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => settleDebt(debt.id)}
                        className={`p-1.5 rounded transition-colors ${
                          debt.isSettled
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-[#787774] hover:text-emerald-600 hover:bg-[#f1f0ee] dark:hover:bg-[#282828]'
                        }`}
                        title={debt.isSettled ? 'Marquer comme non réglé' : 'Marquer comme entièrement réglé'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      {!debt.isSettled && (
                        <button
                          onClick={() => handleOpenPayment(debt.id)}
                          className="px-2 py-1 rounded text-xs font-medium bg-[#f1f0ee] dark:bg-[#282828] text-[#37352f] dark:text-[#ecebed] hover:bg-[#e6e5e2] transition-colors"
                          title="Ajouter un remboursement partiel"
                        >
                          + {isAr ? 'دفعة' : 'Paiement'}
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(debt)}
                        className="p-1 rounded text-[#787774] hover:text-[#37352f] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteDebt(debt.id)}
                        className="p-1 rounded text-[#787774] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Repayment Progress bar */}
                {debt.paidAmount > 0 && !debt.isSettled && (
                  <div className="mt-2.5 pt-2 border-t border-[#e3e2de] dark:border-[#2f2f2f]">
                    <div className="flex items-center justify-between text-[10px] text-[#787774] dark:text-[#9b9a97] mb-1">
                      <span>{isAr ? 'نسبة الاسترداد' : 'Remboursement'}</span>
                      <span className="tabular-nums">{progress}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-[#f1f0ee] dark:bg-[#282828] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT DEBT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? (isAr ? 'تعديل السلف' : 'Modifier la dette') : (isAr ? 'تسجيل سلف أو كريدي' : 'Nouveau Prêt / Dette')}
        subtitle={isAr ? 'حدد الطرف المعني والمبلغ الإجمالي' : 'Enregistrez un montant prêté ou emprunté.'}
      >
        <form onSubmit={handleSaveDebt} className="space-y-4 pt-2">
          {/* Debt Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDebtType('lend')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                debtType === 'lend'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5 mx-auto mb-1 stroke-[2.5]" />
              <span className="text-xs block font-bold">{isAr ? 'كنسالهم (سلفتهم)' : 'On me doit (Prêt)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDebtType('borrow')}
              className={`p-3 rounded-2xl border text-center transition-all ${
                debtType === 'borrow'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <ArrowUpRight className="w-5 h-5 mx-auto mb-1 stroke-[2.5]" />
              <span className="text-xs block font-bold">{isAr ? 'كيسالوني (تسلفت)' : 'Je dois (Emprunt)'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'اسم الشخص' : 'Nom de la personne'} *
            </label>
            <input
              type="text"
              required
              value={debtPerson}
              onChange={(e) => setDebtPerson(e.target.value)}
              placeholder={isAr ? 'مثال: يوسف، حانوت الحومة...' : 'Ex: Karim, Epicier du coin...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'المبلغ الإجمالي (MAD)' : 'Montant total (MAD)'} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={debtTotal}
                onChange={(e) => setDebtTotal(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'المبلغ المسترد مسبقاً' : 'Déjà remboursé (MAD)'}
              </label>
              <input
                type="number"
                step="any"
                value={debtPaid}
                onChange={(e) => setDebtPaid(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'تاريخ الاستحقاق (اختياري)' : 'Date limite / Échéance (facultatif)'}
            </label>
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'ملاحظات' : 'Notes ou raison'}
            </label>
            <textarea
              rows={2}
              value={debtNotes}
              onChange={(e) => setDebtNotes(e.target.value)}
              placeholder={isAr ? 'تفاصيل السلف...' : 'Raison du prêt ou accord...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button type="submit" variant="primary">
              {editingDebt ? (isAr ? 'حفظ' : 'Enregistrer') : (isAr ? 'تأكيد' : 'Valider')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PARTIAL PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={isAr ? 'تسجيل دفعة جديدة' : 'Enregistrer un remboursement partiel'}
        subtitle={isAr ? 'أدخل المبلغ الذي تم استرداده أو دفعه' : 'Ce montant viendra réduire le solde restant.'}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'مبلغ الدفعة (MAD)' : 'Montant du remboursement (MAD)'} *
            </label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button type="submit" variant="primary">
              {isAr ? 'تأكيد الدفعة' : 'Confirmer le paiement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
