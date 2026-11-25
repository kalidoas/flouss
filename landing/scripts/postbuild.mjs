import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const index = await readFile(resolve(dist, 'index.html'), 'utf8');

const localizedMetadata = {
  fr: {
    name: 'Flouss',
    title: 'Flouss — Votre argent, à votre façon.',
    description: 'Suivez vos dépenses, préparez vos projets et gardez une vue claire en dirhams marocains.',
    locale: 'fr_FR',
    image: 'og-fr.png',
  },
  en: {
    name: 'Flouss',
    title: 'Flouss — Your money, your way.',
    description: 'Keep up with spending, plan what’s next, and see the bigger picture in Moroccan dirhams.',
    locale: 'en_US',
    image: 'og-en.png',
  },
};

function setMeta(html, type, key, content) {
  const pattern = new RegExp(`(<meta ${type}="${key}" content=")[^"]*(" />)`);
  return html.replace(pattern, `$1${content}$2`);
}

for (const locale of ['fr', 'en']) {
  const directory = resolve(dist, locale);
  await mkdir(directory, { recursive: true });
  let localizedIndex = index
    .replace('<html lang="ar" dir="rtl">', `<html lang="${locale}" dir="ltr">`)
    .replace('href="https://flouss.live/"', `href="https://flouss.live/${locale}/"`);
  const metadata = localizedMetadata[locale];
  for (const [type, key, value] of [
    ['name', 'description', metadata.description],
    ['property', 'og:site_name', metadata.name],
    ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description],
    ['property', 'og:locale', metadata.locale],
    ['property', 'og:image', `https://flouss.live/images/${metadata.image}`],
  ]) {
    localizedIndex = setMeta(localizedIndex, type, key, value);
  }
  localizedIndex = localizedIndex.replace(/<title>[^<]*<\/title>/, `<title>${metadata.title}</title>`);
  await writeFile(resolve(directory, 'index.html'), localizedIndex);
}
