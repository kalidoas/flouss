export type Locale = 'ar' | 'fr' | 'en';

type Copy = {
  nav: { how: string; features: string; privacy: string; open: string; language: string; theme: string };
  hero: { eyebrow: string; title: string; accent: string; description: string; primary: string; secondary: string; scroll: string; mockupLabel: string; balance: string; balanceLabel: string; activity: string; groceries: string; today: string; goal: string; goalValue: string; goalCaption: string; online: string };
  intro: { eyebrow: string; title: string; body: string };
  steps: { number: string; title: string; body: string }[];
  install: { eyebrow: string; title: string; body: string; steps: { icon: string; title: string; body: string }[]; note: string };
  features: { eyebrow: string; title: string; body: string; items: { icon: string; title: string; body: string; demo?: string }[] };
  privacy: { eyebrow: string; title: string; body: string; points: { title: string; body: string }[]; note: string };
  closing: { eyebrow: string; title: string; accent: string; body: string; cta: string; footnote: string };
  footer: { note: string; themeLight: string; themeDark: string };
};

export const copy: Record<Locale, Copy> = {
  ar: {
    nav: { how: 'كيفاش خدام', features: 'المزايا', privacy: 'الخصوصية', open: 'جرّب فلوس', language: 'اختار اللغة', theme: 'بدّل المظهر' },
    hero: {
      eyebrow: 'فلوس • تدبير المصاريف والادخار',
      title: 'فلوسك،',
      accent: 'على راحتك.',
      description: 'نظّم مصاريفك، خطّط للي جاي، وشوف الصورة كاملة بالدرهم المغربي.',
      primary: 'ابدأ مع فلوس',
      secondary: 'تعرّف على التطبيق',
      scroll: 'اكتشف فلوس',
      mockupLabel: 'نموذج توضيحي للواجهة',
      balance: '8 450',
      balanceLabel: 'الرصيد المتاح',
      activity: 'آخر الحركات',
      groceries: 'مشتريات',
      today: 'اليوم',
      goal: 'عطلة الصيف',
      goalValue: '3 200 د.م.',
      goalCaption: 'هدف الادخار',
      online: 'متزامن',
    },
    intro: { eyebrow: 'بسيطة، من البداية', title: 'من أول حركة، للصورة كاملة.', body: 'فلوس كتعاونك تتابع مصاريفك ومدخولك وادخارك، بلا ما تعقّد عليك الأمور.' },
    steps: [
      { number: '01', title: 'بدا برصيدك', body: 'حدد نقطة البداية ديالك بالدرهم. ومن بعد، كل حركة كتزيدها كتكمّل الصورة.' },
      { number: '02', title: 'سجّل حركاتك', body: 'زيد المصروف ولا المدخول ديالك، وصنّفهم باش يبقا كلشي واضح.' },
      { number: '03', title: 'تابع اللي مهم', body: 'شوف الرصيد، الميزانيات وأهداف الادخار ديالك فمكان واحد.' },
    ],
    install: {
      eyebrow: 'على iPhone',
      title: 'ثبّت فلوس فالشاشة الرئيسية.',
      body: 'ثلاث خطوات باش توصل للتطبيق بسرعة من iPhone ديالك.',
      steps: [
        { icon: 'share', title: 'شارك الصفحة', body: 'حلّ قائمة المشاركة فـ Safari.' },
        { icon: 'home', title: 'أضف للشاشة الرئيسية', body: 'اختار “أضف إلى الشاشة الرئيسية”.' },
        { icon: 'open', title: 'حلّ فلوس', body: 'رجع للشاشة الرئيسية وحلّ فلوس.' },
      ],
      note: 'الإشعارات كتخدم من بعد تثبيت التطبيق على الشاشة الرئيسية.',
    },
    features: {
      eyebrow: 'كلشي فبلاصتو',
      title: 'تفاصيل يومك، بلا ضجيج.',
      body: 'أدوات عملية للفلوس اليومية، من المصروف الصغير حتى الهدف الكبير.',
      items: [
        { icon: 'spark', title: 'إضافة سريعة', body: 'سجّل المصروف ولا المدخول ديالك بخطوات قليلة.', demo: '30 طاكسي' },
        { icon: 'gauge', title: 'ميزانية مفهومة', body: 'تبع مصروف كل فئة مقارنة بالميزانية الشهرية.' },
        { icon: 'target', title: 'أهداف الادخار', body: 'حدّد هدفك وشوف التقدم ديالك مع كل مساهمة.' },
        { icon: 'calendar', title: 'الفواتير الدورية', body: 'نظّم المواعيد والمبالغ اللي كتعاود كل شهر.' },
        { icon: 'shield', title: 'قفل اختياري', body: 'زيد طبقة حماية برمز PIN من اختيارك.' },
        { icon: 'cloud', title: 'على أجهزتك', body: 'تحديثاتك كتبقى محفوظة محلياً، وكيتعاود التزامن ملي يرجع الاتصال.' },
      ],
    },
    privacy: {
      eyebrow: 'الثقة قبل كلشي',
      title: 'صورة أوضح لفلوسك.',
      body: 'تابع مصاريفك ومدخولك وادخارك فبلاصة وحدة.',
      points: [
        { title: 'بلا إعلانات موجهة', body: 'ما كنستعملوش معلوماتك المالية باش نوجّهو ليك الإعلانات.' },
      ],
      note: 'التطبيق كيعتمد على Firebase للمصادقة ومزامنة البيانات. ما كنقدموش تشفير من طرف لطرف.',
    },
    closing: { eyebrow: 'خطوة صغيرة، وضوح أكثر', title: 'خلي فلوسك', accent: 'تمشي معاك.', body: 'جمع الصورة ديال مصروفك وادخارك فبلاصة وحدة.', cta: 'جرّب فلوس دابا', footnote: 'بالدرهم المغربي. وبالطريقة اللي تناسبك.' },
    footer: { note: 'نظرة أوضح على فلوسك، كل نهار.', themeLight: 'المظهر الفاتح', themeDark: 'المظهر الداكن' },
  },
  fr: {
    nav: { how: 'Comment ça marche', features: 'Fonctionnalités', privacy: 'Confidentialité', open: 'Essayer Flouss', language: 'Choisir la langue', theme: 'Changer le thème' },
    hero: {
      eyebrow: 'Flouss • Budget & épargne',
      title: 'Votre argent,',
      accent: 'à votre façon.',
      description: 'Suivez vos dépenses, préparez vos projets et gardez une vue claire en dirhams marocains.',
      primary: 'Découvrir Flouss',
      secondary: 'Voir comment ça marche',
      scroll: 'Découvrir Flouss',
      mockupLabel: 'Maquette d’interface',
      balance: '8 450',
      balanceLabel: 'Solde disponible',
      activity: 'Activité récente',
      groceries: 'Courses',
      today: 'Aujourd’hui',
      goal: 'Vacances d’été',
      goalValue: '3 200 MAD',
      goalCaption: 'Objectif d’épargne',
      online: 'Synchronisé',
    },
    intro: { eyebrow: 'Simple dès le départ', title: 'Du premier geste à une vue d’ensemble.', body: 'Flouss vous aide à suivre vos dépenses, revenus et économies, sans compliquer les choses.' },
    steps: [
      { number: '01', title: 'Définissez votre solde', body: 'Choisissez votre point de départ en dirhams. Chaque mouvement complète ensuite le tableau.' },
      { number: '02', title: 'Ajoutez vos opérations', body: 'Enregistrez une dépense ou un revenu et classez-le pour garder vos comptes lisibles.' },
      { number: '03', title: 'Suivez l’essentiel', body: 'Retrouvez solde, budgets et objectifs d’épargne au même endroit.' },
    ],
    install: {
      eyebrow: 'Sur iPhone',
      title: 'Ajoutez Flouss à l’écran d’accueil.',
      body: 'Trois étapes pour ouvrir Flouss rapidement depuis votre iPhone.',
      steps: [
        { icon: 'share', title: 'Partager la page', body: 'Ouvrez le menu de partage dans Safari.' },
        { icon: 'home', title: 'Ajouter à l’écran d’accueil', body: 'Choisissez « Ajouter à l’écran d’accueil ».' },
        { icon: 'open', title: 'Ouvrir Flouss', body: 'Revenez à l’écran d’accueil et ouvrez Flouss.' },
      ],
      note: 'Les notifications fonctionnent après l’installation sur l’écran d’accueil.',
    },
    features: {
      eyebrow: 'Tout à sa place',
      title: 'Les détails du quotidien, sans bruit.',
      body: 'Des outils pratiques pour gérer votre argent, des petites dépenses aux grands projets.',
      items: [
        { icon: 'spark', title: 'Ajout rapide', body: 'Notez une dépense ou un revenu en quelques étapes.', demo: '30 taxi' },
        { icon: 'gauge', title: 'Budgets lisibles', body: 'Comparez les dépenses de chaque catégorie à son budget mensuel.' },
        { icon: 'target', title: 'Objectifs d’épargne', body: 'Fixez un objectif et suivez votre progression à chaque contribution.' },
        { icon: 'calendar', title: 'Factures récurrentes', body: 'Organisez les échéances et montants qui reviennent chaque mois.' },
        { icon: 'shield', title: 'Verrouillage optionnel', body: 'Ajoutez une protection avec un code PIN de votre choix.' },
        { icon: 'cloud', title: 'Sur vos appareils', body: 'Vos changements restent enregistrés localement et se synchronisent au retour de la connexion.' },
      ],
    },
    privacy: {
      eyebrow: 'La confiance d’abord',
      title: 'Vos finances, en un coup d’œil.',
      body: 'Suivez vos dépenses, revenus et économies au même endroit.',
      points: [
        { title: 'Pas de publicité ciblée', body: 'Vos informations financières ne servent pas à cibler les publicités.' },
      ],
      note: 'L’application utilise Firebase pour l’authentification et la synchronisation. Nous ne prétendons pas offrir un chiffrement de bout en bout.',
    },
    closing: { eyebrow: 'Un petit pas, plus de clarté', title: 'Votre argent,', accent: 'à votre rythme.', body: 'Rassemblez vos dépenses et votre épargne au même endroit.', cta: 'Essayer Flouss', footnote: 'En dirhams marocains. À votre façon.' },
    footer: { note: 'Une vision plus claire de votre argent, chaque jour.', themeLight: 'Thème clair', themeDark: 'Thème sombre' },
  },
  en: {
    nav: { how: 'How it works', features: 'Features', privacy: 'Privacy', open: 'Try Flouss', language: 'Choose language', theme: 'Change theme' },
    hero: {
      eyebrow: 'Flouss • Spending & saving',
      title: 'Your money,',
      accent: 'your way.',
      description: 'Keep up with spending, plan what’s next, and see the bigger picture in Moroccan dirhams.',
      primary: 'Get started with Flouss',
      secondary: 'See how it works',
      scroll: 'Meet Flouss',
      mockupLabel: 'Illustrative app mockup',
      balance: '8,450',
      balanceLabel: 'Available balance',
      activity: 'Recent activity',
      groceries: 'Groceries',
      today: 'Today',
      goal: 'Summer trip',
      goalValue: '3,200 MAD',
      goalCaption: 'Savings goal',
      online: 'Synced',
    },
    intro: { eyebrow: 'Simple from the start', title: 'From the first entry to the full picture.', body: 'Flouss helps you keep track of spending, income, and savings—without making money management feel like work.' },
    steps: [
      { number: '01', title: 'Set your starting balance', body: 'Choose your starting point in dirhams. Each entry you add builds a clearer picture.' },
      { number: '02', title: 'Record your activity', body: 'Add an expense or income and give it a category to keep things easy to follow.' },
      { number: '03', title: 'Keep an eye on what matters', body: 'See your balance, budgets, and savings goals in one place.' },
    ],
    install: {
      eyebrow: 'On iPhone',
      title: 'Add Flouss to your Home Screen.',
      body: 'Three steps to open Flouss quickly from your iPhone.',
      steps: [
        { icon: 'share', title: 'Share the page', body: 'Open the Share menu in Safari.' },
        { icon: 'home', title: 'Add to Home Screen', body: 'Choose “Add to Home Screen”.' },
        { icon: 'open', title: 'Open Flouss', body: 'Return to your Home Screen and open Flouss.' },
      ],
      note: 'Notifications work after installing the app on your Home Screen.',
    },
    features: {
      eyebrow: 'Everything in its place',
      title: 'Everyday details, minus the noise.',
      body: 'Practical tools for everyday money, from the little expenses to the bigger plans.',
      items: [
        { icon: 'spark', title: 'Quick add', body: 'Record an expense or income in just a few steps.', demo: '30 taxi' },
        { icon: 'gauge', title: 'Clear budgets', body: 'Compare spending in each category with its monthly budget.' },
        { icon: 'target', title: 'Savings goals', body: 'Set a goal and follow your progress as you contribute.' },
        { icon: 'calendar', title: 'Recurring bills', body: 'Organize the dates and amounts that come around each month.' },
        { icon: 'shield', title: 'Optional PIN lock', body: 'Add a layer of protection with a PIN you choose.' },
        { icon: 'cloud', title: 'Across your devices', body: 'Updates are saved locally and sync again when your connection returns.' },
      ],
    },
    privacy: {
      eyebrow: 'Trust comes first',
      title: 'Your finances, in clear view.',
      body: 'Keep track of spending, income, and savings in one place.',
      points: [
        { title: 'No targeted advertising', body: 'Financial information isn’t used to target ads.' },
      ],
      note: 'The app uses Firebase for authentication and data sync. We do not claim end-to-end encryption.',
    },
    closing: { eyebrow: 'A small step, a clearer view', title: 'Make your money', accent: 'feel more manageable.', body: 'Bring spending and savings together in one place.', cta: 'Try Flouss', footnote: 'In Moroccan dirhams. On your terms.' },
    footer: { note: 'A clearer view of your money, every day.', themeLight: 'Light theme', themeDark: 'Dark theme' },
  },
};

export const localeLabels: Record<Locale, string> = { ar: 'العربية', fr: 'Français', en: 'English' };
