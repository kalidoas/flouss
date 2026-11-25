import { describe, expect, it } from 'vitest';
import { copy, localeLabels } from './copy';

describe('localized landing copy', () => {
  it('provides complete localized page sections for the three supported locales', () => {
    expect(Object.keys(copy).sort()).toEqual(['ar', 'en', 'fr']);
    for (const locale of Object.keys(copy) as Array<keyof typeof copy>) {
      expect(copy[locale].hero.description).not.toBe('');
      expect(copy[locale].kinetic.lead).not.toBe('');
      expect(copy[locale].kinetic.emphasis).not.toBe('');
      expect(copy[locale].steps).toHaveLength(3);
      expect(copy[locale].features.items).toHaveLength(6);
      expect(copy[locale].install.steps).toHaveLength(3);
      expect(copy[locale].install.note).not.toBe('');
      expect(copy[locale].hero.primary).not.toBe('');
      expect(copy[locale].privacy.note).toMatch(/Firebase/);
      expect(copy[locale].privacy.points).toHaveLength(1);
      expect(`${copy[locale].features.items[4].title} ${copy[locale].features.items[4].body}`).toMatch(/PIN|code PIN|رمز PIN/);
      expect(JSON.stringify(copy[locale])).not.toMatch(/100%\s*(private|offline|privé|hors-ligne)|100%\s*بدون إنترنت/i);
      expect(JSON.stringify(copy[locale])).not.toMatch(/\bprivate\b|\bprivé\b|\bprivée\b/i);
      expect(JSON.stringify(copy[locale])).not.toMatch(/\boffline\b|\bhors[- ]ligne\b|بدون إنترنت|دون اتصال/i);
      expect(localeLabels[locale]).not.toBe('');
    }
    expect(copy.ar.hero.description).toBe('نظّم مصاريفك، وخطّط للقادم، وشوف الصورة كاملة.');
    expect(copy.ar.kinetic.lead).toBe('صرف أقل.');
    expect(copy.ar.kinetic.emphasis).toBe('اعرف أكثر.');
    expect(copy.fr.kinetic.lead).toBe('Dépensez moins.');
    expect(copy.fr.kinetic.emphasis).toBe('Sachez plus.');
    expect(copy.en.kinetic.lead).toBe('Spend less.');
    expect(copy.en.kinetic.emphasis).toBe('Know more.');
  });

  it('includes the quick-entry example and accurate locally saved sync behavior', () => {
    for (const locale of Object.keys(copy) as Array<keyof typeof copy>) {
      expect(copy[locale].features.items[0].demo).toBeTruthy();
      expect(copy[locale].features.items[5].body).toMatch(/locally|localement|محلياً/i);
    }
  });

  it('provides complete how-it-works content for each locale', () => {
    for (const locale of Object.keys(copy) as Array<keyof typeof copy>) {
      expect(copy[locale].how.eyebrow).not.toBe('');
      expect(copy[locale].how.title).not.toBe('');
      expect(copy[locale].how.body).not.toBe('');
      expect(copy[locale].how.steps).toHaveLength(3);
      copy[locale].how.steps.forEach((step) => {
        expect(step.title).not.toBe('');
        expect(step.body).not.toBe('');
        expect(step.screen).not.toBe('');
      });
    }
  });
});