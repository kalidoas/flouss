import { CategoryGroupId } from '../types';

export interface CategoryGroupMeta {
  id: CategoryGroupId;
  translationKey: string;
  iconName: string;
  color: string;
  badgeClass: string;
  borderClass: string;
}

export const CATEGORY_GROUPS_META: Record<CategoryGroupId, CategoryGroupMeta> = {
  essentials_housing: {
    id: 'essentials_housing',
    translationKey: 'essentials_housing',
    iconName: 'Home',
    color: '#0d9488', // teal-600
    badgeClass: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
    borderClass: 'border-teal-500/20',
  },
  food_dining: {
    id: 'food_dining',
    translationKey: 'food_dining',
    iconName: 'Utensils',
    color: '#10b981', // emerald-500
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    borderClass: 'border-emerald-500/20',
  },
  transport_mobility: {
    id: 'transport_mobility',
    translationKey: 'transport_mobility',
    iconName: 'Car',
    color: '#06b6d4', // cyan-500
    badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    borderClass: 'border-cyan-500/20',
  },
  lifestyle_entertainment: {
    id: 'lifestyle_entertainment',
    translationKey: 'lifestyle_entertainment',
    iconName: 'Sparkles',
    color: '#a855f7', // purple-500
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
    borderClass: 'border-purple-500/20',
  },
  subscriptions_utilities: {
    id: 'subscriptions_utilities',
    translationKey: 'subscriptions_utilities',
    iconName: 'CreditCard',
    color: '#6366f1', // indigo-500
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    borderClass: 'border-indigo-500/20',
  },
  income_investments: {
    id: 'income_investments',
    translationKey: 'income_investments',
    iconName: 'TrendingUp',
    color: '#f59e0b', // amber-500
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    borderClass: 'border-amber-500/20',
  },
  savings: {
    id: 'savings',
    translationKey: 'savings',
    iconName: 'PiggyBank',
    color: '#3b82f6', // blue-500
    badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    borderClass: 'border-blue-500/20',
  },
};

/**
 * Returns Apple semantic translucent badge classes according to color or category key
 */
export function getSemanticBadgeClass(color?: string, isGoal?: boolean): string {
  if (isGoal) {
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20';
  }

  if (!color) {
    return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20';
  }

  const hex = color.toLowerCase();

  // Emerald / Green
  if (hex.includes('10b981') || hex.includes('059669') || hex.includes('22c55e')) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  }
  // Amber / Orange / Yellow
  if (hex.includes('f59e0b') || hex.includes('f97316') || hex.includes('d97706')) {
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20';
  }
  // Cyan / Sky
  if (hex.includes('06b6d4') || hex.includes('0ea5e9')) {
    return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
  }
  // Blue / Indigo
  if (hex.includes('3b82f6') || hex.includes('6366f1') || hex.includes('2563eb')) {
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20';
  }
  // Purple / Violet
  if (hex.includes('8b5cf6') || hex.includes('a855f7') || hex.includes('7c3aed')) {
    return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20';
  }
  // Rose / Pink / Red
  if (hex.includes('ec4899') || hex.includes('f43f5e') || hex.includes('ef4444') || hex.includes('db2777')) {
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20';
  }
  // Teal
  if (hex.includes('14b8a6') || hex.includes('0d9488')) {
    return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20';
  }

  return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/20';
}

/**
 * Resolves a category's financial taxonomy group with semantic inference
 * for custom or legacy categories missing an explicit `group` field.
 */
export function resolveCategoryGroup(category: Category | null | undefined): CategoryGroupId {
  if (!category) return 'lifestyle_entertainment';
  if (category.group && category.group in CATEGORY_GROUPS_META) {
    return category.group;
  }
  if ((category as any).groupId && (category as any).groupId in CATEGORY_GROUPS_META) {
    return (category as any).groupId as CategoryGroupId;
  }
  if (category.isGoal) {
    return 'savings';
  }

  const key = (category.key || category.id || '').toLowerCase();
  const name = (category.name || '').toLowerCase();

  // Food & dining
  if (
    key.includes('food') ||
    key.includes('nourriture') ||
    key.includes('cafe') ||
    key.includes('resto') ||
    name.includes('nourriture') ||
    name.includes('café') ||
    name.includes('مطعم') ||
    name.includes('طعام') ||
    name.includes('أكل') ||
    name.includes('قهوة')
  ) {
    return 'food_dining';
  }

  // Transport & mobility
  if (
    key.includes('transport') ||
    name.includes('transport') ||
    name.includes('taxi') ||
    name.includes('car') ||
    name.includes('voiture') ||
    name.includes('نقل') ||
    name.includes('مواصلات')
  ) {
    return 'transport_mobility';
  }

  // Essentials & housing
  if (
    key.includes('home') ||
    key.includes('maison') ||
    key.includes('logement') ||
    key.includes('ecole') ||
    key.includes('sante') ||
    key.includes('education') ||
    key.includes('health') ||
    name.includes('logement') ||
    name.includes('santé') ||
    name.includes('loyer') ||
    name.includes('école') ||
    name.includes('تعليم') ||
    name.includes('سكن') ||
    name.includes('صحة')
  ) {
    return 'essentials_housing';
  }

  // Subscriptions & utilities
  if (
    key.includes('telecom') ||
    key.includes('phone') ||
    key.includes('subscription') ||
    key.includes('abonnement') ||
    name.includes('télécom') ||
    name.includes('abonnement') ||
    name.includes('اشتراك') ||
    name.includes('هاتف')
  ) {
    return 'subscriptions_utilities';
  }

  // Income & investments
  if (
    key.includes('invest') ||
    key.includes('income') ||
    name.includes('invest') ||
    name.includes('bourse') ||
    name.includes('استثمار')
  ) {
    return 'income_investments';
  }

  // Savings
  if (
    key.includes('epargne') ||
    key.includes('saving') ||
    name.includes('épargne') ||
    name.includes('ادخار')
  ) {
    return 'savings';
  }

  return 'lifestyle_entertainment';
}

