import { describe, expect, it } from 'vitest';
import { copy, localeLabels } from './copy';

describe('localized landing copy', () => {
  it('provides complete localized page sections for the three supported locales', () => {
    expect(Object.keys(copy).sort()).toEqual(['ar', 'en', 'fr']);
    for (const locale of Object.keys(copy) as Array<keyof typeof copy>) {
      expect(copy[locale].steps).toHaveLength(3);
      expect(copy[locale].features.items).toHaveLength(6);
      expect(copy[locale].hero.primary).not.toBe('');
      expect(copy[locale].privacy.note).toMatch(/Firebase/);
      expect(localeLabels[locale]).not.toBe('');
    }
  });

  it('includes the quick-entry example and locally saved sync behavior', () => {
    for (const locale of Object.keys(copy) as Array<keyof typeof copy>) {
      expect(copy[locale].features.items[0].demo).toBeTruthy();
      expect(copy[locale].features.items[5].body).toMatch(/locally|localement|محلياً/i);
    }
  });
});
