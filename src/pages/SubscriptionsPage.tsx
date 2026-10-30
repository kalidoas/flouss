import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SubscriptionItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatMAD, getCurrentMonthStr } from '../utils/formatters';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionPaid,
    hideBalance,
    language,
  } = useAppStore();
  const isAr = language === 'ar';

  const currentMonth = useMemo(() => getCurrentMonthStr(), []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('5');
  const [subCategory, setSubCategory] = useState('Télécom');
  const [subNotes, setSubNotes] = useState('');

  // Calculations
  const stats = useMemo(() => {
    let totalMonthly = 0;
    let totalPaidThisMonth = 0;

    (subscriptions || []).forEach((sub) => {
      totalMonthly += sub.amount;
      const isPaid = (sub.paidMonths || []).includes(currentMonth);
      if (isPaid) {
        totalPaidThisMonth += sub.amount;
      }
    });

    const remaining = totalMonthly - totalPaidThisMonth;
    const progress = totalMonthly > 0 ? Math.round((totalPaidThisMonth / totalMonthly) * 100) : 0;

    return { totalMonthly, totalPaidThisMonth, remaining, progress };
  }, [subscriptions, currentMonth]);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setSubName('');
    setSubAmount('');
    setSubDay('5');
    setSubCategory('Télécom');
    setSubNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubAmount(sub.amount.toString());
    setSubDay(sub.billingDay.toString());
    setSubCategory(sub.category || 'Général');
    setSubNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(subAmount);
    const day = parseInt(subDay, 10);
    if (!subName.trim() || isNaN(amount) || amount <= 0) return;

    if (editingSub) {
      updateSubscription(editingSub.id, {
        name: subName.trim(),
        amount,
        billingDay: isNaN(day) ? 1 : Math.min(31, Math.max(1, day)),
        category: subCategory.trim(),
        notes: subNotes.trim() || undefined,
      });
    } else {
      addSubscription({
        name: subName.trim(),
        amount,
        billingDay: isNaN(day) ? 1 : Math.min(31, Math.max(1, day)),
        category: subCategory.trim(),
        notes: subNotes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isAr ? 'الاشتراكات والفواتير الشهرية' : 'Abonnements & Charges Fixes'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
              {isAr ? 'مصاريف قارة' : 'Mensuel Récurrent'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'تتبع فواتير الويفي، لاصال، الماء والكهرباء، والاشتراكات الشهرية وتأكد من خلاصها'
              : 'Visualisez vos charges régulières et cochez ce qui est déjà payé pour ce mois.'}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          className="flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isAr ? 'إضافة اشتراك' : 'Nouvel Abonnement'}</span>
        </Button>
      </div>

      {/* Hero Summary */}
      <div className="bg-white dark:bg-[#202020] rounded-lg p-5 border border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">
              {isAr ? 'مجموع المصاريف القارة شهرياً' : 'Total des charges fixes mensuelles'}
            </span>
            <div className={`text-2xl sm:text-3xl font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
              {formatMAD(stats.totalMonthly, false, language)}{' '}
              <span className="text-xs font-normal text-[#787774] dark:text-[#9b9a97]">/ mois</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#fbfbfa] dark:bg-[#1a1a1a] px-3.5 py-2.5 rounded-md border border-[#e3e2de] dark:border-[#2f2f2f]">
            <div>
              <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] block">{isAr ? 'تم دفعه هذا الشهر' : 'Payé ce mois'}</span>
              <span className={`text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                {formatMAD(stats.totalPaidThisMonth, false, language)}
              </span>
            </div>
            <div className="w-px h-7 bg-[#e3e2de] dark:border-[#2f2f2f]" />
            <div>
              <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] block">{isAr ? 'الباقي' : 'Reste à régler'}</span>
              <span className={`text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                {formatMAD(stats.remaining, false, language)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
            <span>{isAr ? 'نسبة تسديد فواتير الشهر' : 'Progression des paiements du mois'}</span>
            <span className="font-medium text-[#37352f] dark:text-[#ecebed] tabular-nums">{stats.progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#f1f0ee] dark:bg-[#282828] overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-2.5">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-5 h-5" />}
            title={isAr ? 'لا توجد أي اشتراكات مسجلة' : 'Aucun abonnement configuré'}
            description={
              isAr
                ? 'أضف فواتيرك الثابتة مثل الويفي، اشتراك القاعة الرياضية أو الهاتف'
                : 'Ajoutez vos dépenses fixes pour les anticiper chaque mois.'
            }
            action={
              <Button onClick={handleOpenAdd} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                <span>{isAr ? 'إضافة أول اشتراك' : 'Ajouter un abonnement'}</span>
              </Button>
            }
          />
        ) : (
          subscriptions.map((sub) => {
            const isPaid = (sub.paidMonths || []).includes(currentMonth);

            return (
              <div
                key={sub.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isPaid
                    ? 'bg-[#fbfbfa] dark:bg-[#1a1a1a] border-[#e3e2de] dark:border-[#2f2f2f]'
                    : 'bg-white dark:bg-[#202020] border-[#e3e2de] dark:border-[#2f2f2f] shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[#f1f0ee] dark:bg-[#282828] text-[#787774] dark:text-[#9b9a97] border border-[#e3e2de] dark:border-[#2f2f2f]">
                        {sub.category || 'Abonnement'}
                      </span>
                      <h4 className="font-medium text-sm text-[#37352f] dark:text-[#ecebed]">
                        {sub.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#787774] dark:text-[#9b9a97]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {isAr ? `يوم ${sub.billingDay} من الشهر` : `Le ${sub.billingDay} du mois`}
                        </span>
                      </div>
                      {sub.notes && <span>• {sub.notes}</span>}
                    </div>
                  </div>

                  {/* Amount and Status Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <div className={`text-sm sm:text-base font-semibold text-[#37352f] dark:text-[#ecebed] tabular-nums transition-[filter] duration-200 ${hideBalance ? 'privacy-blur' : ''}`}>
                        {formatMAD(sub.amount, false, language)}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                        }`}
                      >
                        {isPaid ? (isAr ? '✓ تم دفعه' : '✓ Payé ce mois') : (isAr ? '⏳ في الانتظار' : '⏳ En attente')}
                      </span>
                    </div>

                    {/* Quick Paid Toggle Button */}
                    <button
                      onClick={() => toggleSubscriptionPaid(sub.id, currentMonth)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
                          : 'bg-[#f1f0ee] dark:bg-[#282828] text-[#5f5e5b] dark:text-[#9b9a97] hover:bg-[#e6e5e2]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPaid ? (isAr ? 'تم الخلاص' : 'Payé') : (isAr ? 'تأكيد الدفع' : 'Marquer payé')}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1 rounded text-[#787774] hover:text-[#37352f] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-1 rounded text-[#787774] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT SUBSCRIPTION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? (isAr ? 'تعديل الفاتورة' : 'Modifier la charge') : (isAr ? 'إضافة اشتراك / فاتورة قارة' : 'Nouvelle charge fixe')}
        subtitle={isAr ? 'حدد اسم الخدمة ومبلغها الشهري' : 'Configurez vos dépenses récurrentes de chaque mois.'}
      >
        <form onSubmit={handleSaveSub} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'اسم الاشتراك أو الخدمة' : 'Nom de l’abonnement'} *
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder={isAr ? 'مثال: فيبر إنوي، لاصال، فورفي...' : 'Ex: Fibre Orange, Salle de Sport, Forfait...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'المبلغ الشهري (MAD)' : 'Montant mensuel (MAD)'} *
              </label>
              <input
                type="number"
                step="any"
                required
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'يوم الاقتطاع (1 - 31)' : 'Jour du prélèvement'}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={subDay}
                onChange={(e) => setSubDay(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'نوع الخدمة' : 'Catégorie'}
            </label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Ex: Télécom, Sport, Logement, Divertissement..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'ملاحظات' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={subNotes}
              onChange={(e) => setSubNotes(e.target.value)}
              placeholder={isAr ? 'تفاصيل الحساب أو العقد...' : 'Identifiant contrat, mode de paiement...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button type="submit" variant="primary">
              {editingSub ? (isAr ? 'حفظ' : 'Enregistrer') : (isAr ? 'إضافة' : 'Valider')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
