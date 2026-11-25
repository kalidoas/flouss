import React, { useEffect, useState } from 'react';
import { ChevronLeft, Edit3, Pin, Plus, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAppStore } from '../../store/useAppStore';
import { NoteItem } from '../../types';
import { translations } from '../../i18n/translations';

export const DashboardPinnedNote: React.FC = () => {
  const { notes = [], addNoteItem, updateNoteItem, language } = useAppStore();
  const t = translations[language].dashboard;
  const common = translations[language].common;
  const pinned = notes.filter((note) => note.isPinned);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const current = pinned[Math.min(index, Math.max(pinned.length - 1, 0))];

  useEffect(
    () => setIndex((value) => Math.min(value, Math.max(pinned.length - 1, 0))),
    [pinned.length]
  );

  const openEditor = (note?: NoteItem) => {
    setEditing(note || null);
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setIsOpen(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() && !content.trim()) return;
    if (editing) {
      updateNoteItem(editing.id, { title: title.trim(), content: content.trim() });
    } else {
      const now = new Date().toISOString();
      addNoteItem({
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim() || t.pinnedNoteTitle,
        content: content.trim(),
        isPinned: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    setIsOpen(false);
  };

  const move = (direction: number) =>
    setIndex((value) => (value + direction + pinned.length) % pinned.length);

  return (
    <>
      <div
        data-spotlight="true"
        className="spotlight-card flex flex-col justify-between gap-3 rounded-2xl bg-surface dark:bg-surface-3/5 p-4 sm:p-5 backdrop-blur-xl border border-border-subtle dark:border-border-subtle/10 shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_16px_36px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden h-fit min-w-0"
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h2 className="flex items-center gap-1.5 text-[15px] sm:text-base font-semibold text-content dark:text-content truncate">
            <Pin aria-hidden="true" className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
            <span>{t.pinnedNoteTitle}</span>
          </h2>
          <button
            type="button"
            onClick={() => openEditor()}
            aria-label={t.pinNote}
            title={t.pinNote}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised dark:bg-surface-3/5 hover:bg-surface dark:hover:bg-surface-2 text-muted hover:text-content dark:text-muted dark:hover:text-content transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {current ? (
          <div
            className="flex-1 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 transition-all min-w-0"
            onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
            onTouchEnd={(event) => {
              if (touchStart === null || pinned.length < 2) return;
              const delta = event.changedTouches[0].clientX - touchStart;
              if (Math.abs(delta) > 45) move((delta > 0) !== (language === 'ar') ? -1 : 1);
              setTouchStart(null);
            }}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs sm:text-sm font-semibold text-content dark:text-zinc-100"
                  title={current.title}
                >
                  {current.title}
                </p>
                {current.content && (
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-muted dark:text-zinc-300">
                    {current.content}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => openEditor(current)}
                aria-label={t.editNote}
                title={t.editNote}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openEditor()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle dark:border-white/10 text-xs font-semibold text-muted hover:text-content hover:border-amber-400/50 hover:bg-amber-500/[0.03] transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t.pinNote}</span>
          </button>
        )}

        {pinned.length > 1 && (
          <div className="flex items-center justify-between pt-1 min-w-0">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label={t.previousNote}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-content hover:bg-surface-raised dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5" aria-label={`${index + 1}/${pinned.length}`}>
              {pinned.map((note, dotIndex) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  aria-label={t.notePosition
                    .replace('{current}', String(dotIndex + 1))
                    .replace('{total}', String(pinned.length))}
                  aria-current={dotIndex === index ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    dotIndex === index ? 'w-4 bg-amber-500 dark:bg-amber-400' : 'w-1.5 bg-muted/30 dark:bg-muted/20'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label={t.nextNote}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-content hover:bg-surface-raised dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white transition-all cursor-pointer"
            >
              <ChevronLeft className={`h-4 w-4 rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} />
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? t.editNote : t.pinNote} maxWidth="sm">
        <form onSubmit={save} className="space-y-4 p-4">
          <label className="block space-y-1 text-xs font-semibold text-content dark:text-zinc-300">
            {t.noteTitle}
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              className="min-h-11 w-full rounded-xl border border-border-subtle bg-surface px-3 text-xs sm:text-sm text-content dark:border-border-subtle/10 dark:bg-surface-3/5 dark:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-content dark:text-zinc-300">
            {t.noteContent}
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs sm:text-sm text-content dark:border-border-subtle/10 dark:bg-surface-3/5 dark:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              <X className="me-1 h-4 w-4" />
              {common.cancel}
            </Button>
            <Button type="submit">{t.saveNote}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
