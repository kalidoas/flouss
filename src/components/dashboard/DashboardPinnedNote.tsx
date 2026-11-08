import React, { useEffect, useState } from 'react';
import { ChevronLeft, Edit3, Pin, Plus, X } from 'lucide-react';
import { Card } from '../common/Card';
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

  useEffect(() => setIndex((value) => Math.min(value, Math.max(pinned.length - 1, 0))), [pinned.length]);

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
  const move = (direction: number) => setIndex((value) => (value + direction + pinned.length) % pinned.length);

  return (
    <>
      <Card padding="md" className="flex min-h-[190px] flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-content"><Pin aria-hidden="true" className="h-4 w-4 text-amber-400" />{t.pinnedNoteTitle}</h2>
          <button type="button" onClick={() => openEditor()} aria-label={t.pinNote} title={t.pinNote} className="flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Plus className="h-4 w-4" /></button>
        </div>
        {current ? <div
          className="min-h-20 flex-1 rounded-control border border-amber-400/20 bg-amber-500/[0.06] p-3"
          onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
          onTouchEnd={(event) => {
            if (touchStart === null || pinned.length < 2) return;
            const delta = event.changedTouches[0].clientX - touchStart;
            if (Math.abs(delta) > 45) move((delta > 0) !== (language === 'ar') ? -1 : 1);
            setTouchStart(null);
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-content" title={current.title}>{current.title}</p>
              {current.content && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted">{current.content}</p>}
            </div>
            <button type="button" onClick={() => openEditor(current)} aria-label={t.editNote} title={t.editNote} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Edit3 className="h-4 w-4" /></button>
          </div>
        </div> : <button type="button" onClick={() => openEditor()} className="flex min-h-20 flex-1 items-center justify-center gap-2 rounded-control border border-dashed border-border-subtle text-xs font-medium text-muted hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Plus className="h-4 w-4" />{t.pinNote}</button>}
        {pinned.length > 1 && <div className="flex items-center justify-between">
          <button type="button" onClick={() => move(-1)} aria-label={t.previousNote} className="flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ChevronLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} /></button>
          <div className="flex items-center gap-1.5" aria-label={`${index + 1}/${pinned.length}`}>
            {pinned.map((note, dotIndex) => <button key={note.id} type="button" onClick={() => setIndex(dotIndex)} aria-label={t.notePosition.replace('{current}', String(dotIndex + 1)).replace('{total}', String(pinned.length))} aria-current={dotIndex === index ? 'true' : undefined} className={`h-2.5 rounded-full transition-all ${dotIndex === index ? 'w-5 bg-accent' : 'w-2.5 bg-border-subtle'}`} />)}
          </div>
          <button type="button" onClick={() => move(1)} aria-label={t.nextNote} className="flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ChevronLeft className={`h-4 w-4 rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} /></button>
        </div>}
      </Card>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? t.editNote : t.pinNote} maxWidth="sm">
        <form onSubmit={save} className="space-y-4 p-4">
          <label className="block space-y-1 text-xs font-medium text-muted">{t.noteTitle}<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} className="min-h-11 w-full rounded-control border border-border-subtle bg-surface px-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></label>
          <label className="block space-y-1 text-xs font-medium text-muted">{t.noteContent}<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} maxLength={2000} className="w-full resize-y rounded-control border border-border-subtle bg-surface px-3 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" /></label>
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setIsOpen(false)}><X className="me-1 h-4 w-4" />{common.cancel}</Button><Button type="submit">{t.saveNote}</Button></div>
        </form>
      </Modal>
    </>
  );
};
