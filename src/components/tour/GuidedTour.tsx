import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../common/Button';
import {
  LayoutDashboard,
  CheckSquare,
  PlusCircle,
  FolderTree,
  HandCoins,
  CreditCard,
  FileText,
  Eye,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';

interface TourStepConfig {
  screen: 'dashboard' | 'categories' | 'debts' | 'subscriptions' | 'notes';
  titleFr: string;
  titleAr: string;
  descFr: string;
  descAr: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    screen: 'dashboard',
    titleFr: '1. Tableau de Bord & Solde Disponible',
    titleAr: '1. لوحة التحكم والرصيد المتاح',
    descFr:
      'Retrouvez ici votre solde disponible en MAD, votre patrimoine total et la vue d’ensemble de vos revenus et dépenses du mois.',
    descAr:
      'تجد هنا رصيدك المالي المتاح بالدرهم المغربي، إجمالي ثروتك وملخص مداخيلك ومصاريفك الشهرية.',
    icon: <LayoutDashboard className="w-4 h-4 text-[#2383e2]" />,
  },
  {
    screen: 'dashboard',
    titleFr: '2. Focus View ("Ma liste")',
    titleAr: '2. قائمة المهام المالية (Ma liste)',
    descFr:
      'Votre to-do list intégrée : notez vos factures urgentes, cochez les tâches réglées, fixez des dates d’échéance et épinglez vos priorités.',
    descAr:
      'قائمتك للمهام المالية اليومية: سجل فواتيرك المستعجلة، حدد تواريخ الخلاص، وقم بشطب ما تم إنجازه.',
    icon: <CheckSquare className="w-4 h-4 text-emerald-600" />,
  },
  {
    screen: 'dashboard',
    titleFr: '3. Actions Rapides en 1 Clic',
    titleAr: '3. أزرار الإجراءات السريعة',
    descFr:
      'Ajoutez instantanément un revenu (+ Revenu), une dépense (+ Dépense), ou alimentez votre cagnotte d’épargne (+ Épargner).',
    descAr:
      'سجل بضغطة زر واحدة: مداخيلك الجديدة، مصاريفك اليومية، أو مبالغ تدخرها لأهدافك.',
    icon: <PlusCircle className="w-4 h-4 text-amber-500" />,
  },
  {
    screen: 'categories',
    titleFr: '4. Catégories & Objectifs d’Épargne',
    titleAr: '4. الفئات وأهداف الادخار',
    descFr:
      'Organisez vos postes de dépenses avec des plafonds mensuels et suivez vos objectifs d’épargne avec jauges de progression automatiques.',
    descAr:
      'قسم مصاريفك حسب الفئات مع تحديد سقف ميزانية شهري، وتتبع نسبة وصولك لأهداف الادخار.',
    icon: <FolderTree className="w-4 h-4 text-purple-500" />,
  },
  {
    screen: 'debts',
    titleFr: '5. Prêts & Dettes (كنسالهم و كيسالوني)',
    titleAr: '5. السلف والديون (كنسالهم وكيسالوني)',
    descFr:
      'Ne perdez plus jamais la trace de votre argent : notez ce que vos proches vous doivent et ce que vous devez rembourser.',
    descAr:
      'تتبع بدقة المبالغ التي سلفتها للغير والأموال التي عليك إرجاعها مع إمكانية تسجيل الدفعات الجزئية.',
    icon: <HandCoins className="w-4 h-4 text-emerald-600" />,
  },
  {
    screen: 'subscriptions',
    titleFr: '6. Charges Fixes & Abonnements',
    titleAr: '6. الفواتير والاشتراكات الشهرية',
    descFr:
      'Centralisez vos factures régulières (Wifi, loyer, salle de sport) et cochez chaque mois dès que le paiement est effectué.',
    descAr:
      'سجل كل مصاريفك القارة (الويفي، النادي الرياضي، الهاتف) وقم بتأكيد الدفع كل شهر لتفادي أي نسيان.',
    icon: <CreditCard className="w-4 h-4 text-blue-500" />,
  },
  {
    screen: 'notes',
    titleFr: '7. Notes & Idées Style Notion',
    titleAr: '7. الملاحظات والأفكار بأسلوب نوشن',
    descFr:
      'Un bloc-notes minimaliste pour consigner vos projets d’investissements, calculs prévisionnels ou réflexions personnelles.',
    descAr:
      'مساحة لتدوين أفكارك، مشاريعك المالية أو ملاحظاتك اليومية بتصميم هادئ ومريح للعين.',
    icon: <FileText className="w-4 h-4 text-teal-600" />,
  },
  {
    screen: 'dashboard',
    titleFr: '8. Mode Confidentialité (Touche H)',
    titleAr: '8. وضع الخصوصية (زر H أو العين)',
    descFr:
      'Appuyez sur la touche "H" ou cliquez sur l’œil en haut pour flouter immédiatement vos montants et protéger votre vie privée.',
    descAr:
      'اضغط على زر "H" في لوحة المفاتيح أو رمز العين لإخفاء مبالغك بالضبابية فوراً في الأماكن العامة.',
    icon: <Eye className="w-4 h-4 text-indigo-500" />,
  },
  {
    screen: 'dashboard',
    titleFr: '9. Sécurité PIN & 2 Profils Distincts',
    titleAr: '9. الحماية برمز PIN وتعدد الحسابات',
    descFr:
      'Votre compte est protégé par votre code PIN. Vous pouvez configurer jusqu’à 2 comptes pour séparer vos finances personnelles et pros !',
    descAr:
      'حسابك محمي برمز PIN السري. يمكنك أيضاً إدارة حسابين منفصلين تماماً وبسرية تامة.',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
  },
];

export const GuidedTour: React.FC = () => {
  const { isTourActive, tourStep, nextTourStep, prevTourStep, endTour, setActiveScreen, language } =
    useAppStore();
  const isAr = language === 'ar';

  if (!isTourActive) return null;

  const currentConfig = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const isLast = tourStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      endTour();
      setActiveScreen('dashboard');
    } else {
      const nextStepIndex = tourStep + 1;
      const nextConfig = TOUR_STEPS[nextStepIndex];
      if (nextConfig) {
        setActiveScreen(nextConfig.screen);
      }
      nextTourStep();
    }
  };

  const handlePrev = () => {
    if (tourStep > 0) {
      const prevStepIndex = tourStep - 1;
      const prevConfig = TOUR_STEPS[prevStepIndex];
      if (prevConfig) {
        setActiveScreen(prevConfig.screen);
      }
      prevTourStep();
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-4 bg-black/35 backdrop-blur-[1px] animate-in fade-in duration-200">
      <div className="pointer-events-auto w-full max-w-sm bg-white dark:bg-[#202020] rounded-lg p-4 sm:p-5 shadow-2xl border border-[#e3e2de] dark:border-[#2f2f2f] space-y-3.5 mb-16 sm:mb-0 animate-in zoom-in-95 duration-200">
        {/* Header with Step and Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#f1f0ee] dark:bg-[#282828] flex items-center justify-center">
              {currentConfig.icon}
            </div>
            <span className="text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider">
              {isAr ? 'جولة توضيحية' : 'Visite Guidée'} ({tourStep + 1}/{TOUR_STEPS.length})
            </span>
          </div>

          <button
            onClick={() => {
              endTour();
              setActiveScreen('dashboard');
            }}
            className="p-1 rounded text-[#787774] hover:text-[#37352f] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-[#37352f] dark:text-[#ecebed]">
            {isAr ? currentConfig.titleAr : currentConfig.titleFr}
          </h3>
          <p className="text-xs text-[#5f5e5b] dark:text-[#9b9a97] leading-relaxed">
            {isAr ? currentConfig.descAr : currentConfig.descFr}
          </p>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-full bg-[#f1f0ee] dark:bg-[#282828] h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2383e2] transition-all duration-300"
            style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              endTour();
              setActiveScreen('dashboard');
            }}
            className="text-xs text-[#787774] hover:underline"
          >
            {isAr ? 'تخطي الجولة' : 'Passer'}
          </button>

          <div className="flex items-center gap-2">
            {tourStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-2.5 py-1 rounded text-xs font-medium border border-[#e3e2de] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#ecebed] hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>{isAr ? 'السابق' : 'Précédent'}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3 py-1 rounded text-xs font-medium bg-[#2383e2] hover:bg-[#1a73cb] text-white transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>{isLast ? (isAr ? 'إنهاء واستخدام التطبيق' : 'Terminer') : isAr ? 'التالي' : 'Suivant'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
