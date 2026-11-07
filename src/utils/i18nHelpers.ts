import { Category, CategoryGroupId, IncomeSource, Language, SubCategory, NoteItem, ProgramTrack, Transaction } from '../types';
import { translations } from '../i18n/translations';

/**
 * Returns translated category group name
 */
export function getCategoryGroupName(
  groupId: CategoryGroupId | string | null | undefined,
  language: Language = 'fr'
): string {
  if (!groupId) return '';
  const groupsDict = translations[language]?.categoryGroups;
  if (groupsDict && groupId in groupsDict) {
    return (groupsDict as Record<string, string>)[groupId];
  }
  return groupId;
}

// Map known default category IDs to stable translation keys
const CATEGORY_ID_KEY_MAP: Record<string, string> = {
  cat_nourriture: 'food',
  cat_cafe: 'cafe',
  cat_transport: 'transport',
  cat_vetements: 'clothing',
  cat_electronics: 'electronics',
  cat_education: 'education',
  cat_sante: 'health',
  cat_sport: 'sport',
  cat_logement: 'home',
  cat_telecom: 'phone',
  cat_shopping: 'shopping',
  cat_famille: 'family',
  cat_charite: 'charity',
  cat_investissement: 'investment',
  cat_autre: 'other',
};

// Map known Arabic category names to stable translation keys
export const ARABIC_CATEGORY_KEY_MAP: Record<string, string> = {
  'الرياضية': 'sport',
  'الرياضة': 'sport',
  'الرياضة والنشاط': 'sport',
  'رياضة': 'sport',
  'المأكولات والمشتريات': 'food',
  'المأكولات': 'food',
  'طعام': 'food',
  'أكل': 'food',
  'تغذية': 'food',
  'المقهى والخرجات': 'cafe',
  'المقهى': 'cafe',
  'مقهى': 'cafe',
  'خرجات': 'cafe',
  'المواصلات والتنقل': 'transport',
  'المواصلات': 'transport',
  'التنقل': 'transport',
  'مواصلات': 'transport',
  'نقل': 'transport',
  'الملابس والمظهر': 'clothing',
  'الملابس': 'clothing',
  'ملابس': 'clothing',
  'الإلكترونيات والتقنية': 'electronics',
  'الإلكترونيات': 'electronics',
  'تقنية': 'electronics',
  'التعليم والتكوين': 'education',
  'التعليم': 'education',
  'تعليم': 'education',
  'الصحة والنظافة': 'health',
  'الصحة': 'health',
  'صحة': 'health',
  'السكن والبيت': 'home',
  'السكن': 'home',
  'البيت': 'home',
  'سكن': 'home',
  'الاتصالات والاشتراكات': 'phone',
  'الاتصالات': 'phone',
  'اشتراكات': 'phone',
  'التسوق والمشتريات': 'shopping',
  'التسوق': 'shopping',
  'تسوق': 'shopping',
  'العائلة والأقارب': 'family',
  'العائلة': 'family',
  'عائلة': 'family',
  'الصدقة والخير': 'charity',
  'الصدقة': 'charity',
  'صدقة': 'charity',
  'الاستثمار والمستقبل': 'investment',
  'الاستثمار': 'investment',
  'استثمار': 'investment',
  'مصاريف أخرى': 'other',
  'أخرى': 'other',
};

export const SUBCATEGORY_ID_KEY_MAP: Record<string, string> = {
  sub_groceries: 'groceries',
  sub_restaurant: 'restaurant',
  sub_fastFood: 'fastFood',
  sub_bakery: 'bakery',
  sub_snacks: 'snacks',
  sub_coffee: 'coffee',
  sub_cinema: 'cinema',
  sub_friendsOuting: 'friendsOuting',
  sub_games: 'games',
  sub_events: 'events',
  sub_taxi: 'taxi',
  sub_tramBus: 'tramBus',
  sub_train: 'train',
  sub_fuel: 'fuel',
  sub_carMaintenance: 'carMaintenance',
  sub_gym: 'gym',
  sub_skincare: 'skincare',
};

export const ARABIC_SUBCATEGORY_KEY_MAP: Record<string, string> = {
  'الحافلة والترامواي': 'tramBus',
  'حافلة': 'tramBus',
  'باص': 'tramBus',
  'ترامواي': 'tramBus',
  'طاكسي / VTC': 'taxi',
  'طاكسي': 'taxi',
  'تاكسي': 'taxi',
  'قطار / ONCF': 'train',
  'قطار': 'train',
  'وقود وبنزين': 'fuel',
  'وقود': 'fuel',
  'بنزين': 'fuel',
  'صيانة وميكانيك': 'carMaintenance',
  'مشتريات البيت والسوق': 'groceries',
  'المطعم': 'restaurant',
  'وجبات سريعة وخفيفة': 'fastFood',
  'المخبزة والحلويات': 'bakery',
  'وجبات خفيفة ومسليات': 'snacks',
  'قهوة وشاي': 'coffee',
  'قهوة': 'coffee',
  'شاي': 'coffee',
  'سينما وعروض': 'cinema',
  'لقاءات الأصدقاء': 'friendsOuting',
  'ألعاب وترفيه': 'games',
  'سهرات ومناسبات': 'events',
  'الأحذية': 'shoes',
  'صنادل': 'sandals',
  'سراويل وجينز': 'pants',
  'قمصان وأقمصة': 'tshirts',
  'سترات ومعاطف': 'jackets',
  'ملابس داخلية وجوارب': 'underwearSocks',
  'إكسسوارات (ساعة، حزام، حقيبة)': 'accessories',
  'إكسسوارات': 'accessories',
  'حاسوب محمول / PC': 'pc',
  'حاسوب': 'pc',
  'هاتف ذكي': 'smartphone',
  'هاتف': 'smartphone',
  'ملحقات (فأرة، لوحة مفاتيح، شاحن)': 'pcAccessories',
  'سماعات رأس': 'headphones',
  'ألعاب فيديو': 'gaming',
  'إصلاحات وتصليح': 'repairs',
  'واجبات مدرسية / دراسية': 'schoolFees',
  'كتب ومراجع': 'books',
  'أدوات مدرسية ومكتبية': 'supplies',
  'دورات عبر الإنترنت': 'onlineCourses',
  'طباعة ونسخ الوثائق': 'printing',
  'امتحانات ومباريات': 'exams',
  'صيدلية وأدوية': 'pharmacy',
  'طبيب وفحوصات': 'doctor',
  'حلاق وتجميل': 'barber',
  'عطور ومستحضرات': 'perfume',
  'عناية بالبشرة': 'skincare',
  'اشتراك القاعة الرياضية': 'gym',
  'معدات وملابس رياضية': 'equipment',
  'مكملات غذائية': 'supplements',
  'نوادي وأنشطة': 'club',
  'كراء البيت / السكن': 'rent',
  'كهرباء (أمانديس / ليديك)': 'electricity',
  'ماء صالح للشرب': 'water',
  'إنترنت وألياف بصرية': 'internet',
  'أثاث وديكور': 'furniture',
  'مواد ولوازم التنظيف': 'cleaning',
  'تعبئة الهاتف وجواز': 'topup',
  'اشتراك شهري للهاتف': 'internetPlan',
  'منصات البث (Netflix...)': 'streaming',
  'موسيقى وصوتيات': 'music',
  'برامج وتطبيقات سحابية': 'cloudSoftware',
  'هدايا': 'gifts',
  'تزيين وديكور': 'decoration',
  'طلبيات الإنترنت': 'onlineOrders',
  'بر الوالدين ومساعدتهم': 'parents',
  'مصاريف العائلة': 'familySupport',
  'مصاريف الأبناء': 'children',
  'صدقة وتبرعات': 'charitySadaqa',
  'زكاة المال': 'zakat',
  'مساعدة المحتاجين': 'helpNeedy',
  'أسهم وصناديق': 'stocks',
  'عملات رقمية': 'crypto',
  'ذهب ومعادن': 'gold',
  'عقارات': 'realEstate',
  'صندوق الطوارئ': 'emergencyFund',
  'مصاريف طارئة': 'unforeseen',
  'أوراق وإداريات': 'paperwork',
  'عمولات ورسوم بنكية': 'bankFees',
};

/**
 * Maps any raw database string (Arabic category, subcategory, ID, or legacy name)
 * to its stable translation key (e.g. 'قهوة وشاي' -> 'coffee', 'cat_cafe' -> 'cafe').
 */
export function getCategoryTranslationKey(rawText: string | null | undefined): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // 1. Check direct key in translations
  const frDict = translations.fr?.categoriesData as Record<string, string> | undefined;
  if (frDict && trimmed in frDict) {
    return trimmed;
  }

  // 2. Direct ID mappings
  if (CATEGORY_ID_KEY_MAP[trimmed]) return CATEGORY_ID_KEY_MAP[trimmed];
  if (SUBCATEGORY_ID_KEY_MAP[trimmed]) return SUBCATEGORY_ID_KEY_MAP[trimmed];

  // 3. Known Arabic category & subcategory tables
  if (ARABIC_CATEGORY_KEY_MAP[trimmed]) return ARABIC_CATEGORY_KEY_MAP[trimmed];
  if (ARABIC_SUBCATEGORY_KEY_MAP[trimmed]) return ARABIC_SUBCATEGORY_KEY_MAP[trimmed];

  // 4. Exact match against Arabic dictionary
  const arDict = translations.ar?.categoriesData as Record<string, string> | undefined;
  if (arDict) {
    for (const [key, val] of Object.entries(arDict)) {
      if (val === trimmed) return key;
    }
  }

  // 5. Exact match against French / English dictionaries
  if (frDict) {
    for (const [key, val] of Object.entries(frDict)) {
      if (val.toLowerCase() === trimmed.toLowerCase()) return key;
    }
  }
  const enDict = translations.en?.categoriesData as Record<string, string> | undefined;
  if (enDict) {
    for (const [key, val] of Object.entries(enDict)) {
      if (val.toLowerCase() === trimmed.toLowerCase()) return key;
    }
  }

  // 6. Substring match against Arabic values
  if (arDict) {
    for (const [key, val] of Object.entries(arDict)) {
      if (trimmed.includes(val) || val.includes(trimmed)) return key;
    }
  }
  for (const [arText, key] of Object.entries(ARABIC_SUBCATEGORY_KEY_MAP)) {
    if (trimmed.includes(arText)) return key;
  }
  for (const [arText, key] of Object.entries(ARABIC_CATEGORY_KEY_MAP)) {
    if (arText === 'أخرى') {
      if (trimmed === 'أخرى' || trimmed === 'مصاريف أخرى') return key;
    } else if (trimmed.includes(arText)) {
      return key;
    }
  }

  return null;
}

/**
 * Translates any raw category name, subcategory name, or note text from the database
 * to the currently selected language.
 * E.g., 'قهوة وشاي' -> 'Coffee & Tea' in English, 'Café & Thé' in French, 'قهوة وشاي' in Arabic.
 */
export function translateCategoryText(
  rawText: string | null | undefined,
  language: Language = 'fr'
): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  const key = getCategoryTranslationKey(trimmed);
  if (key) {
    const dict = translations[language]?.categoriesData as Record<string, string> | undefined;
    if (dict && dict[key]) {
      const arVal = (translations.ar?.categoriesData as Record<string, string> | undefined)?.[key];
      if (arVal && trimmed !== arVal && trimmed.startsWith(arVal)) {
        const extra = trimmed.slice(arVal.length).trim().replace(/^[-–—:]\s*/, '');
        if (extra) {
          return `${dict[key]} (${extra})`;
        }
      }
      return dict[key];
    }
  }

  return trimmed;
}

/**
 * Returns translated category name if stable `key` or `translationKey` exists,
 * or maps hardcoded Arabic categories to the active language if viewing in English/French.
 */
export function getCategoryName(
  category: Category | null | undefined,
  language: Language = 'fr'
): string {
  if (!category) return '';

  // 1. Check explicit translationKey or key or ID mapping
  const key =
    category.translationKey ||
    category.key ||
    (category.id ? CATEGORY_ID_KEY_MAP[category.id] : undefined);

  if (key) {
    const dict = translations[language]?.categoriesData as Record<string, string> | undefined;
    if (dict && key in dict) {
      return dict[key];
    }
  }

  // 2. Derive key from category.name or category.id
  const derivedKey = getCategoryTranslationKey(category.name) || getCategoryTranslationKey(category.id);
  if (derivedKey) {
    const dict = translations[language]?.categoriesData as Record<string, string> | undefined;
    if (dict && derivedKey in dict) {
      return dict[derivedKey];
    }
  }

  return category.name || '';
}

/**
 * Returns translated sub-category name if stable `key` or `translationKey` exists,
 * or maps hardcoded Arabic subcategories to the active language if viewing in English/French.
 */
export function getSubCategoryName(
  subCategory: SubCategory | null | undefined,
  language: Language = 'fr'
): string {
  if (!subCategory) return '';

  const key =
    subCategory.translationKey ||
    subCategory.key ||
    (subCategory.id ? SUBCATEGORY_ID_KEY_MAP[subCategory.id] : undefined);

  if (key) {
    const dict = translations[language]?.categoriesData as Record<string, string> | undefined;
    if (dict && key in dict) {
      return dict[key];
    }
  }

  const derivedKey = getCategoryTranslationKey(subCategory.name) || getCategoryTranslationKey(subCategory.id);
  if (derivedKey) {
    const dict = translations[language]?.categoriesData as Record<string, string> | undefined;
    if (dict && derivedKey in dict) {
      return dict[derivedKey];
    }
  }

  return subCategory.name || '';
}

/**
 * Returns translated income source name if stable `key` exists, otherwise fallback to custom user name.
 */
export function getIncomeSourceName(
  source: IncomeSource | null | undefined,
  language: Language = 'fr'
): string {
  if (!source) return '';
  if (source.key) {
    const dict = translations[language]?.incomeSourcesData;
    if (dict && (source.key in dict)) {
      return (dict as Record<string, string>)[source.key];
    }
  }
  return source.name;
}

/**
 * Returns translated income sub-source name if stable `key` exists, otherwise fallback to custom user name.
 */
export function getIncomeSubSourceName(
  subSource: SubCategory | null | undefined,
  language: Language = 'fr'
): string {
  if (!subSource) return '';
  if (subSource.key) {
    const dict = translations[language]?.incomeSourcesData;
    if (dict && (subSource.key in dict)) {
      return (dict as Record<string, string>)[subSource.key];
    }
  }
  return subSource.name;
}

/**
 * Returns translated title for an income transaction using income sources and income source keys,
 * never falling back to an expense label.
 */
export function getIncomeTransactionTitle(
  tx: Transaction,
  incomeSources: IncomeSource[] = [],
  language: Language = 'fr'
): string {
  const isAr = language === 'ar';
  const otherIncomeText =
    translations[language]?.incomeSourcesData?.other ||
    (isAr ? 'مداخيل أخرى' : language === 'fr' ? 'Autre revenu' : 'Other income');

  // 1. If sourceId or categoryId is 'cat_autre' or 'src_autre' or 'other', return other income
  if (
    tx.sourceId === 'cat_autre' ||
    tx.sourceId === 'src_autre' ||
    tx.sourceId === 'other' ||
    tx.categoryId === 'cat_autre'
  ) {
    return otherIncomeText;
  }

  // 2. Source lookup by ID or key
  if (tx.sourceId) {
    const src = incomeSources.find((s) => s.id === tx.sourceId || s.key === tx.sourceId);
    if (src) {
      return getIncomeSourceName(src, language);
    }
  }

  // 3. Note lookup against income sources dictionary
  if (tx.note) {
    const trimmed = tx.note.trim();

    // Guard against accidental expense label translations appearing on income
    if (
      trimmed === 'Other expenses' ||
      trimmed === 'Autres dépenses' ||
      trimmed === 'مصاريف أخرى' ||
      trimmed === 'Autre' ||
      trimmed === 'Other' ||
      trimmed === 'أخرى'
    ) {
      return otherIncomeText;
    }

    if (trimmed === 'أعمال أخرى' || trimmed.includes('أعمال أخرى')) {
      return (
        translations[language]?.incomeSourcesData?.otherWork ||
        (isAr ? 'أعمال أخرى' : language === 'fr' ? 'Autre travail' : 'Other work')
      );
    }

    // Match against any incomeSourceData value across languages
    for (const lang of ['ar', 'fr', 'en'] as const) {
      const dict = translations[lang]?.incomeSourcesData as Record<string, string> | undefined;
      if (dict) {
        for (const [key, val] of Object.entries(dict)) {
          if (val && (trimmed === val || trimmed.toLowerCase() === val.toLowerCase())) {
            const activeDict = translations[language]?.incomeSourcesData as Record<string, string> | undefined;
            if (activeDict && activeDict[key]) return activeDict[key];
          }
        }
      }
    }

    return trimmed;
  }

  // 4. Fallback generic income label
  return isAr ? 'مدخول' : language === 'fr' ? 'Revenu' : 'Income';
}

/**
 * Returns dynamically translated title & content for default seeded notes (e.g. note_welcome)
 */
export function getNoteItemDisplay(
  note: NoteItem,
  language: Language = 'fr'
): { title: string; content: string } {
  if (
    note.id === 'note_welcome' ||
    note.title.includes('Espace Personnel') ||
    note.title.includes('المساحة الشخصية') ||
    note.title.includes('Personal Workspace')
  ) {
    if (language === 'ar') {
      return {
        title: 'مرحباً بك في مساحتك الشخصية 🌟',
        content: 'مساحتك آمنة ومزامنة سحابياً مع فايربيس. يمكنك تدوين أولوياتك وخططك وتذكيراتك هنا.',
      };
    }
    if (language === 'en') {
      return {
        title: 'Welcome to your Personal Workspace 🌟',
        content: 'Your space is secure and cloud-synced with Firebase. You can jot down your priorities, plans, or reminders here.',
      };
    }
    return {
      title: 'Bienvenue dans votre Espace Personnel 🌟',
      content: 'Votre espace est sécurisé et synchronisé dans le cloud avec Firebase. Vous pouvez y noter vos priorités, plans ou pense-bêtes.',
    };
  }
  return { title: note.title, content: note.content };
}

/**
 * Returns strictly localized title for program tracks across AR, EN, FR.
 * Eliminates all language leaks from hardcoded database seed strings.
 */
export function getProgramTrackTitle(
  track: ProgramTrack | null | undefined,
  language: Language = 'fr'
): string {
  if (!track) return '';
  if (track.type === 'salat') {
    return language === 'ar' ? 'الصلوات الخمس (Salat)' : language === 'en' ? 'Daily Prayers (Salat)' : 'Prières quotidiennes (Salat)';
  }
  if (track.type === 'coding') {
    return language === 'ar' ? 'البرمجة والتطوير (Coding)' : language === 'en' ? 'Coding & Development' : 'Programmation & Code';
  }
  if (track.type === 'english') {
    return language === 'ar' ? 'اللغة الإنجليزية (English)' : language === 'en' ? 'English Mastery' : 'Pratique de l’Anglais';
  }
  if (track.type === 'gym') {
    return language === 'ar' ? 'الرياضة والجيم (Gym)' : language === 'en' ? 'Gym & Fitness' : 'Sport & Musculation (Gym)';
  }
  if (track.type === 'study') {
    return language === 'ar' ? 'المراجعة والدراسة (Study)' : language === 'en' ? 'Study & Revision' : 'Études & Révisions (S3)';
  }
  return track.title;
}

/**
 * Returns translated focus list menu name (e.g. for default "قائمتي" / "Ma liste" / "My Focus List")
 */
export function getFocusListName(
  list: { id?: string; name: string } | null | undefined,
  language: Language = 'fr'
): string {
  if (!list) return '';
  const isDefault =
    list.id === 'default' ||
    list.name === 'قائمتي' ||
    list.name === 'Ma liste' ||
    list.name === 'My Focus List' ||
    list.name === 'myList' ||
    list.name === 'default_my_list';

  if (isDefault) {
    return translations[language]?.focusList?.title || 'Ma liste';
  }
  return list.name;
}

/**
 * Returns dynamically translated default seeded focus tasks (ft_1, ft_2, ft_3)
 */
export function getFocusTaskText(
  task: { id?: string; text: string } | null | undefined,
  language: Language = 'fr'
): string {
  if (!task) return '';
  if (task.id === 'ft_1') {
    if (language === 'ar') return 'دفع فاتورة الويفي والماء قبل 10 في الشهر';
    if (language === 'en') return 'Pay Wi-Fi & utilities bill before the 10th';
    return "Payer la facture d'Internet et eau avant le 10 du mois";
  }
  if (task.id === 'ft_2') {
    if (language === 'ar') return 'تحويل 1 000 درهم لحساب صندوق الطوارئ';
    if (language === 'en') return 'Transfer 1,000 DH to Emergency Fund';
    return "Transférer 1 000 DH vers le fonds d'urgence";
  }
  if (task.id === 'ft_3') {
    if (language === 'ar') return 'مراجعة مصاريف الأسبوع الماضي';
    if (language === 'en') return 'Review last week spending';
    return 'Vérifier les dépenses de la semaine passée';
  }
  return task.text;
}


