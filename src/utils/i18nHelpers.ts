import { Category, CategoryGroupId, IncomeSource, Language, SubCategory, NoteItem } from '../types';
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

/**
 * Returns translated category name if stable `key` exists, otherwise fallback to custom user name.
 */
export function getCategoryName(
  category: Category | null | undefined,
  language: Language = 'fr'
): string {
  if (!category) return '';
  if (category.key) {
    const dict = translations[language]?.categoriesData;
    if (dict && (category.key in dict)) {
      return (dict as Record<string, string>)[category.key];
    }
  }
  return category.name;
}

/**
 * Returns translated sub-category name if stable `key` exists, otherwise fallback to custom user name.
 */
export function getSubCategoryName(
  subCategory: SubCategory | null | undefined,
  language: Language = 'fr'
): string {
  if (!subCategory) return '';
  if (subCategory.key) {
    const dict = translations[language]?.categoriesData;
    if (dict && (subCategory.key in dict)) {
      return (dict as Record<string, string>)[subCategory.key];
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
