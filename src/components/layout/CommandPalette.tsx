import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { ScreenId } from '../../types';

interface Props { onQuickAdd: () => void; }
export const CommandPalette: React.FC<Props> = ({ onQuickAdd }) => {
  const { language, setActiveScreen } = useAppStore();
  const t = translations[language];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pages: { id: ScreenId; label: string }[] = [
    { id: 'dashboard', label: t.nav.dashboard }, { id: 'categories', label: t.nav.categories },
    { id: 'income', label: t.nav.income }, { id: 'expenses', label: t.nav.expenses },
    { id: 'history', label: t.nav.history }, { id: 'stats', label: t.nav.stats },
    { id: 'tasks', label: t.nav.tasks }, { id: 'debts', label: t.nav.debts },
    { id: 'subscriptions', label: t.nav.subscriptions }, { id: 'notes', label: t.nav.notes },
    { id: 'settings', label: t.nav.settings },
  ];
  const filtered = useMemo(() => pages.filter((page) => page.label.toLowerCase().includes(query.toLowerCase())), [pages, query]);
  const quickAddLabel = language === 'ar' ? 'إضافة مصروف' : language === 'fr' ? 'Ajouter une dépense' : 'Add expense';

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setOpen((current) => !current); setQuery('');
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!open) return null;
  const close = () => setOpen(false);
  return <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/45 p-3 pt-[12vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div role="dialog" aria-modal="true" aria-label={t.common.quickAdd} className="w-full max-w-lg overflow-hidden rounded-card border border-border-subtle bg-surface shadow-2xl">
      <label className="flex min-h-14 items-center gap-3 border-b border-border-subtle px-4"><Search className="h-4 w-4 shrink-0 text-muted" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === 'ar' ? 'ابحث عن صفحة أو إجراء…' : language === 'fr' ? 'Rechercher une page ou action…' : 'Search pages or actions…'} className="min-w-0 flex-1 bg-transparent text-sm text-content outline-none placeholder:text-muted" /><button type="button" onClick={close} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-control text-muted hover:bg-surface-raised"><X className="h-4 w-4" /></button></label>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {quickAddLabel.toLowerCase().includes(query.toLowerCase()) ? <button type="button" onClick={() => { close(); onQuickAdd(); }} className="flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-start text-sm font-semibold text-accent hover:bg-accent/10"><Plus className="h-4 w-4" />{quickAddLabel}</button> : null}
        {filtered.map((page) => <button key={page.id} type="button" onClick={() => { setActiveScreen(page.id); close(); }} className="flex min-h-12 w-full items-center rounded-control px-3 text-start text-sm text-content hover:bg-surface-raised">{page.label}</button>)}
        {!filtered.length && !quickAddLabel.toLowerCase().includes(query.toLowerCase()) && <p className="px-3 py-5 text-sm text-muted">{language === 'ar' ? 'لا توجد نتائج' : language === 'fr' ? 'Aucun résultat' : 'No results'}</p>}
      </div>
      <div className="border-t border-border-subtle px-4 py-2 text-caption text-muted">Ctrl/⌘ K</div>
    </div>
  </div>;
};
