const MUTED_CATEGORY_PALETTE = [
  '#668F86', '#7185A6', '#A17D68', '#8A7D9B',
  '#76919A', '#A18A5C', '#8A9670', '#A4777D',
] as const;

/** Stable, presentation-only category color; stored category colors remain untouched. */
export function getCategoryVisualColor(id: string | undefined): string {
  const key = id || 'default';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return MUTED_CATEGORY_PALETTE[Math.abs(hash) % MUTED_CATEGORY_PALETTE.length];
}
