import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NoteItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Search,
  Lock,
  Sparkles,
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
  const isAr = language === 'ar';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#10b981');
  const [noteCategory, setNoteCategory] = useState('');

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
        title: noteTitle.trim() || 'Sans titre',
        content: noteContent.trim(),
        color: noteColor,
        category: noteCategory.trim() || undefined,
      });
    } else {
      const now = new Date().toISOString();
      addNoteItem({
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: noteTitle.trim() || (isAr ? 'بدون عنوان' : 'Sans titre'),
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isAr ? 'ملاحظات وأفكار شخصية' : 'Notes & Idées'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{isAr ? 'سرية في هاتفك' : 'Privé'}</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'مساحة حرة لتدوين أفكارك، مخططاتك، وكوداتك محفوظة محلياً بنسبة 100%'
              : 'Espace de prise de notes rapide, confidentiel et sauvegardé sur votre appareil.'}
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          variant="primary"
          className="flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isAr ? 'تدوين ملاحظة' : 'Nouvelle Note'}</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? 'بحث في الملاحظات...' : 'Rechercher une note ou mot-clé...'}
          className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] text-xs text-[#37352f] dark:text-[#ecebed] focus:outline-none focus:border-[#2383e2] shadow-sm"
        />
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-5 h-5" />}
          title={isAr ? 'لا توجد أي ملاحظة بعد' : 'Aucune note enregistrée'}
          description={
            isAr
              ? 'استغل هذه المساحة لكتابة أهدافك، أفكار مشاريعك أو ملخصاتك'
              : 'Notez vos idées, réflexions ou objectifs personnels.'
          }
          action={
            <Button onClick={handleOpenAdd} variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              <span>{isAr ? 'إنشاء أول ملاحظة' : 'Créer une note'}</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Pin className="w-3.5 h-3.5 fill-amber-500" />
                <span>{isAr ? 'الملاحظات المثبتة' : 'Notes Épinglées'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleOpenEdit(note)}
                    onDelete={() => deleteNoteItem(note.id)}
                    onTogglePin={() => togglePinNote(note.id)}
                    isAr={isAr}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-bold text-slate-400">
                  {isAr ? 'باقي الملاحظات' : 'Autres notes'}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {otherNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleOpenEdit(note)}
                    onDelete={() => deleteNoteItem(note.id)}
                    onTogglePin={() => togglePinNote(note.id)}
                    isAr={isAr}
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
        title={editingNote ? (isAr ? 'تعديل الملاحظة' : 'Modifier la note') : (isAr ? 'تدوين ملاحظة جديدة' : 'Nouvelle Note')}
        subtitle={isAr ? 'احفظ أفكارك بأمان في هاتفك' : 'Note personnelle 100% hors-ligne.'}
      >
        <form onSubmit={handleSaveNote} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'العنوان' : 'Titre'}
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={isAr ? 'عنوان الفكرة أو الموضوع...' : 'Titre de la note...'}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'المحتوى' : 'Contenu'} *
            </label>
            <textarea
              rows={5}
              required
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={isAr ? 'اكتب ملاحظتك أو خطتك هنا...' : 'Écrivez votre pensée, check-list ou idée ici...'}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'التصنيف' : 'Catégorie'}
              </label>
              <input
                type="text"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                placeholder="Ex: Projet, Idée, Livres, Personnel..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'لون الملاحظة' : 'Couleur d’accent'}
              </label>
              <div className="flex items-center gap-2 pt-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNoteColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      noteColor === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button type="submit" variant="primary">
              {editingNote ? (isAr ? 'حفظ' : 'Enregistrer') : (isAr ? 'حفظ الملاحظة' : 'Créer la note')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

interface NoteCardProps {
  note: NoteItem;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  isAr: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete, onTogglePin, isAr }) => {
  const accentColor = note.color || '#2383e2';

  return (
    <div className="relative group bg-white dark:bg-[#202020] rounded-lg p-3.5 border border-[#e3e2de] dark:border-[#2f2f2f] hover:border-[#d3d1cb] dark:hover:border-[#3f3f3f] shadow-sm flex flex-col justify-between space-y-2.5 transition-all">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <h4 className="font-medium text-xs sm:text-sm text-[#37352f] dark:text-[#ecebed] leading-tight">
              {note.title}
            </h4>
          </div>

          <button
            onClick={onTogglePin}
            className={`p-1 rounded transition-colors ${
              note.isPinned
                ? 'text-[#2383e2] bg-[#f1f0ee] dark:bg-[#282828]'
                : 'text-[#9b9a97] hover:text-[#37352f]'
            }`}
            title={note.isPinned ? 'Détacher' : 'Épingler en haut'}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        <p className="text-xs text-[#5f5e5b] dark:text-[#9b9a97] whitespace-pre-wrap leading-relaxed line-clamp-6">
          {note.content}
        </p>
      </div>

      <div className="pt-2 border-t border-[#e3e2de] dark:border-[#2f2f2f] flex items-center justify-between text-[10px] text-[#787774]">
        <span>{note.category || (isAr ? 'عام' : 'Général')}</span>

        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
