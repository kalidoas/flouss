import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { NoteItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { GoogleCalendarAlarmModal } from '../components/common/GoogleCalendarAlarmModal';
import { translations } from '../i18n/translations';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Search,
  Lock,
  Bell,
} from 'lucide-react';

const NOTE_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
];

export const NotesPage: React.FC = () => {
  const { notes, addNoteItem, updateNoteItem, deleteNoteItem, togglePinNote, language } =
    useAppStore();
  const tNote = translations[language].notes;

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#10b981');
  const [noteCategory, setNoteCategory] = useState('');
  const [alarmNote, setAlarmNote] = useState<NoteItem | null>(null);

  const filteredNotes = useMemo(() => {
    return (notes || []).filter((n) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.category || '').toLowerCase().includes(q)
      );
    });
  }, [notes, search]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  const handleOpenAdd = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('#10b981');
    setNoteCategory('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color || '#10b981');
    setNoteCategory(note.category || '');
    setIsModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    if (editingNote) {
      updateNoteItem(editingNote.id, {
        title: noteTitle.trim() || tNote.untitled,
        content: noteContent.trim(),
        color: noteColor,
        category: noteCategory.trim() || undefined,
      });
    } else {
      const now = new Date().toISOString();
      addNoteItem({
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: noteTitle.trim() || tNote.untitled,
        content: noteContent.trim(),
        color: noteColor,
        category: noteCategory.trim() || undefined,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 animate-page pb-20 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {tNote.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{tNote.subtitle}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {tNote.badge}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          <span>{tNote.newNote}</span>
        </Button>
      </div>

      {/* Localized Glass Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tNote.searchPlaceholder}
          className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
        />
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-5 h-5" />}
          title={tNote.emptyTitle}
          description={tNote.subtitle}
          action={
            <Button
              onClick={handleOpenAdd}
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              <span>{tNote.createFirst}</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Pin className="w-3.5 h-3.5 fill-amber-500" />
                <span>{tNote.pinned}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleOpenEdit(note)}
                    onAlarm={() => setAlarmNote(note)}
                    onDelete={() => deleteNoteItem(note.id)}
                    onTogglePin={() => togglePinNote(note.id)}
                    generalLabel={tNote.general}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-semibold text-zinc-400">
                  {tNote.otherNotes}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleOpenEdit(note)}
                    onAlarm={() => setAlarmNote(note)}
                    onDelete={() => deleteNoteItem(note.id)}
                    onTogglePin={() => togglePinNote(note.id)}
                    generalLabel={tNote.general}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT NOTE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? tNote.editNote : tNote.newNote}
        subtitle={tNote.subtitle}
      >
        <form onSubmit={handleSaveNote} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tNote.titleLabel}
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={tNote.titlePlaceholder}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              {tNote.contentLabel} *
            </label>
            <textarea
              rows={5}
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={tNote.contentPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {tNote.categoryLabel}
              </label>
              <input
                type="text"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                placeholder="Ex: Projet, Livres..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {tNote.colorLabel}
              </label>
              <div className="flex items-center gap-2 pt-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNoteColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      noteColor === c ? 'scale-125 ring-2 ring-zinc-900 dark:ring-white ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Prominent Action Button: Add Alarm via Google Calendar */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setAlarmNote({
                  id: editingNote?.id || 'temp_' + Date.now(),
                  title: noteTitle.trim() || tNote.untitled,
                  content: noteContent.trim(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Bell className="w-4 h-4" />
              <span>{tNote.googleCalendarAlarmBtn}</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {tNote.cancel}
            </Button>
            <Button type="submit" variant="primary">
              {tNote.save}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Standalone Google Calendar Alarm Modal for Notes */}
      {alarmNote && (
        <GoogleCalendarAlarmModal
          isOpen={Boolean(alarmNote)}
          onClose={() => setAlarmNote(null)}
          taskTitle={alarmNote.title}
          taskDescription={alarmNote.content}
        />
      )}
    </div>
  );
};

interface NoteCardProps {
  note: NoteItem;
  onEdit: () => void;
  onAlarm: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  generalLabel: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onAlarm, onDelete, onTogglePin, generalLabel }) => {
  const accentColor = note.color || '#2383e2';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative group bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.08)] flex flex-col justify-between space-y-3 transition-all cursor-pointer"
      onClick={onEdit}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: accentColor }}
            />
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-tight tracking-tight">
              {note.title}
            </h4>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              note.isPinned
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
            title={note.isPinned ? 'Détacher' : 'Épingler'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed line-clamp-6">
          {note.content}
        </p>
      </div>

      <div className="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between text-[11px] text-zinc-400">
        <span>{note.category || generalLabel}</span>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onAlarm}
            className="p-1.5 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
            title="Google Calendar"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
