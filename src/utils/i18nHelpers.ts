import { Category, IncomeSource, Language, SubCategory } from '../types';
import { translations } from '../i18n/translations';

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
