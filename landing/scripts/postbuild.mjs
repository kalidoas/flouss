import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');

for (const locale of ['ar', 'fr', 'en']) {
  const directory = resolve(dist, locale);
  await mkdir(directory, { recursive: true });
  await copyFile(resolve(dist, 'index.html'), resolve(directory, 'index.html'));
}
