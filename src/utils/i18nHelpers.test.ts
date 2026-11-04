import { describe, it, expect } from 'vitest';
import {
  getCategoryTranslationKey,
  translateCategoryText,
  getCategoryName,
  getSubCategoryName,
} from './i18nHelpers';
import { Category, SubCategory } from '../types';

describe('i18nHelpers category translation mapping', () => {
  describe('getCategoryTranslationKey', () => {
    it('maps raw Arabic database strings to stable keys', () => {
      expect(getCategoryTranslationKey('قهوة وشاي')).toBe('coffee');
      expect(getCategoryTranslationKey('المقهى والخرجات')).toBe('cafe');
      expect(getCategoryTranslationKey('المأكولات والمشتريات')).toBe('food');
      expect(getCategoryTranslationKey('مشتريات البيت والسوق')).toBe('groceries');
      expect(getCategoryTranslationKey('اشتراك القاعة الرياضية')).toBe('gym');
      expect(getCategoryTranslationKey('وجبات سريعة وخفيفة')).toBe('fastFood');
      expect(getCategoryTranslationKey('عناية بالبشرة')).toBe('skincare');
    });

    it('maps category and subcategory IDs to stable keys', () => {
      expect(getCategoryTranslationKey('cat_cafe')).toBe('cafe');
      expect(getCategoryTranslationKey('cat_nourriture')).toBe('food');
      expect(getCategoryTranslationKey('sub_coffee')).toBe('coffee');
      expect(getCategoryTranslationKey('sub_fastFood')).toBe('fastFood');
    });

    it('maps English and French display names to stable keys', () => {
      expect(getCategoryTranslationKey('Coffee & Tea')).toBe('coffee');
      expect(getCategoryTranslationKey('Café & Thé')).toBe('coffee');
    });

    it('returns null for null, empty, or unknown strings', () => {
      expect(getCategoryTranslationKey(null)).toBeNull();
      expect(getCategoryTranslationKey('')).toBeNull();
      expect(getCategoryTranslationKey('   ')).toBeNull();
      expect(getCategoryTranslationKey('xyz_completely_unknown_value_12345')).toBeNull();
    });
  });

  describe('translateCategoryText', () => {
    it('translates raw Arabic database strings to English', () => {
      expect(translateCategoryText('قهوة وشاي', 'en')).toBe('Coffee & Tea');
      expect(translateCategoryText('المقهى والخرجات', 'en')).toBe('Café & Outings');
      expect(translateCategoryText('اشتراك القاعة الرياضية', 'en')).toBe('Gym membership');
      expect(translateCategoryText('وجبات سريعة وخفيفة', 'en')).toBe('Fast Food & Snacks');
    });

    it('translates raw Arabic database strings to French', () => {
      expect(translateCategoryText('قهوة وشاي', 'fr')).toBe('Café & Thé');
      expect(translateCategoryText('المقهى والخرجات', 'fr')).toBe('Café & Sorties');
      expect(translateCategoryText('اشتراك القاعة الرياضية', 'fr')).toBe('Abonnement Salle');
    });

    it('preserves Arabic strings when language is Arabic', () => {
      expect(translateCategoryText('قهوة وشاي', 'ar')).toBe('قهوة وشاي');
      expect(translateCategoryText('المقهى والخرجات', 'ar')).toBe('المقهى والخرجات');
    });

    it('preserves extra suffix note details while translating prefix', () => {
      expect(translateCategoryText('عناية بالبشرة Gel douch', 'en')).toBe('Skincare (Gel douch)');
      expect(translateCategoryText('عناية بالبشرة Gel douch', 'fr')).toBe('Soins de la peau (Gel douch)');
    });

    it('falls back safely for unknown custom user texts', () => {
      expect(translateCategoryText('Custom User Project Note', 'en')).toBe('Custom User Project Note');
      expect(translateCategoryText('', 'en')).toBe('');
      expect(translateCategoryText(null, 'en')).toBe('');
    });
  });

  describe('getCategoryName and getSubCategoryName with raw database categories', () => {
    it('translates category with raw Arabic name to English', () => {
      const rawCat: Category = {
        id: 'user_custom_cat',
        name: 'قهوة وشاي',
        icon: 'Coffee',
        color: '#f59e0b',
        isGoal: false,
        isArchived: false,
        createdAt: '2026-11-01',
      };

      expect(getCategoryName(rawCat, 'en')).toBe('Coffee & Tea');
      expect(getCategoryName(rawCat, 'fr')).toBe('Café & Thé');
      expect(getCategoryName(rawCat, 'ar')).toBe('قهوة وشاي');
    });

    it('translates subcategory with raw Arabic name to English', () => {
      const rawSub: SubCategory = {
        id: 'user_custom_sub',
        name: 'قهوة وشاي',
      };

      expect(getSubCategoryName(rawSub, 'en')).toBe('Coffee & Tea');
      expect(getSubCategoryName(rawSub, 'fr')).toBe('Café & Thé');
      expect(getSubCategoryName(rawSub, 'ar')).toBe('قهوة وشاي');
    });
  });
});
