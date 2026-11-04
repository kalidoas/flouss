import { Category, CategoryGroupId, IncomeSource, Language, SubCategory, NoteItem, ProgramTrack } from '../types';
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
const ARABIC_CATEGORY_KEY_MAP: Record<string, string> = {
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

const SUBCATEGORY_ID_KEY_MAP: Record<string, string> = {
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
};

const ARABIC_SUBCATEGORY_KEY_MAP: Record<string, string> = {
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
  'سينما وعروض': 'cinema',
  'لقاءات الأصدقاء': 'friendsOuting',
  'ألعاب وترفيه': 'games',
  'سهرات ومناسبات': 'events',
};

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
    const dict = translations[language]?.categoriesData;
    if (dict && key in dict) {
      return (dict as Record<string, string>)[key];
    }
  }

  // 2. If viewing in English/French and the category name is hardcoded in Arabic:
  if (language !== 'ar' && category.name) {
    const trimmed = category.name.trim();
    const mappedKey = ARABIC_CATEGORY_KEY_MAP[trimmed];
    if (mappedKey) {
      const dict = translations[language]?.categoriesData;
      if (dict && mappedKey in dict) {
        return (dict as Record<string, string>)[mappedKey];
      }
    }

    // Fuzzy check against Arabic dictionary keys
    const arDict = translations.ar?.categoriesData as Record<string, string> | undefined;
    if (arDict) {
      for (const [dictKey, arVal] of Object.entries(arDict)) {
        if (arVal === trimmed || trimmed.includes(arVal) || arVal.includes(trimmed)) {
          const targetDict = translations[language]?.categoriesData as Record<string, string> | undefined;
          if (targetDict && targetDict[dictKey]) {
            return targetDict[dictKey];
          }
        }
      }
    }
  }

  // 3. Fallback to Arabic translation if language is Arabic and key is known
  if (language === 'ar' && key) {
    const arDict = translations.ar?.categoriesData as Record<string, string> | undefined;
    if (arDict && arDict[key]) {
      return arDict[key];
    }
  }

  return category.name;
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
    const dict = translations[language]?.categoriesData;
    if (dict && key in dict) {
      return (dict as Record<string, string>)[key];
    }
  }

  if (language !== 'ar' && subCategory.name) {
    const trimmed = subCategory.name.trim();
    const mappedKey = ARABIC_SUBCATEGORY_KEY_MAP[trimmed];
    if (mappedKey) {
      const dict = translations[language]?.categoriesData;
      if (dict && mappedKey in dict) {
        return (dict as Record<string, string>)[mappedKey];
      }
    }

    const arDict = translations.ar?.categoriesData as Record<string, string> | undefined;
    if (arDict) {
      for (const [dictKey, arVal] of Object.entries(arDict)) {
        if (arVal === trimmed || trimmed.includes(arVal) || arVal.includes(trimmed)) {
          const targetDict = translations[language]?.categoriesData as Record<string, string> | undefined;
          if (targetDict && targetDict[dictKey]) {
            return targetDict[dictKey];
          }
        }
      }
    }
  }

  return subCategory.name;
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


