import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { NoteItem, NoteChecklistItem, TaskItem } from '../types';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { GoogleCalendarAlarmModal } from '../components/common/GoogleCalendarAlarmModal';
import { translations } from '../i18n/translations';
import { playHapticFeedback } from '../utils/haptics';
import confetti from 'canvas-confetti';
import {
  FileText,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Search,
  Lock,
  Bell,
  Zap,
  CheckSquare,
  Square,
  Sparkles,
  Check,
  X,
  ListTodo,
} from 'lucide-react';

const NOTE_COLORS = [
  'bg-accent', // indigo
  'bg-positive', // emerald
  'bg-info', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

type FilterTag = 'all' | 'pinned' | 'checklists' | 'motivation' | 'ideas';

export const NotesPage: React.FC = () => {
  const {
    notes,
    addNoteItem,
    updateNoteItem,
    deleteNoteItem,
    togglePinNote,
    addTask,
    language,
    showToast,
  } = useAppStore();

  const tNote = translations[language].notes;

  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<FilterTag>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('bg-accent');
  const [noteCategory, setNoteCategory] = useState('');
  const [modalChecklist, setModalChecklist] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [alarmNote, setAlarmNote] = useState<NoteItem | null>(null);
  const [cardChecklistInput, setCardChecklistInput] = useState<Record<string, string>>({});

  // Filter logic
  const filteredNotes = useMemo(() => {
    return (notes || []).filter((n) => {
      // 1. Tag filter
      if (activeTag === 'pinned' && !n.isPinned) return false;
      if (activeTag === 'checklists') {
        const hasChecklist = Boolean(n.checklist && n.checklist.length > 0);
        const isCatChecklist = (n.category || '').toLowerCase().includes('check');
        if (!hasChecklist && !isCatChecklist) return false;
      }
      if (activeTag === 'motivation') {
        const cat = (n.category || '').toLowerCase();
        const title = n.title.toLowerCase();
        if (!cat.includes('motivation') && !cat.includes('تحفيز') && !title.includes('motivation') && !title.includes('تحفيز')) {
          return false;
        }
      }
      if (activeTag === 'ideas') {
        const cat = (n.category || '').toLowerCase();
        const title = n.title.toLowerCase();
        if (!cat.includes('idea') && !cat.includes('فكرة') && !cat.includes('idée') && !title.includes('idea') && !title.includes('idée')) {
          return false;
        }
      }

      // 2. Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const inChecklist = (n.checklist || []).some((item) => item.text.toLowerCase().includes(q));
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.category || '').toLowerCase().includes(q) ||
        inChecklist
      );
    });
  }, [notes, activeTag, search]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  const handleOpenAdd = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('bg-accent');
    setNoteCategory('');
    setModalChecklist([]);
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handleNewNote = () => handleOpenAdd();
    window.addEventListener('flouss:open-add-note', handleNewNote);
    return () => window.removeEventListener('flouss:open-add-note', handleNewNote);
  }, []);

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color || 'bg-accent');
    setNoteCategory(note.category || '');
    setModalChecklist(note.checklist || []);
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim() && modalChecklist.length === 0) return;

    if (editingNote) {
      updateNoteItem(editingNote.id, {
        title: noteTitle.trim() || tNote.untitled,
        content: noteContent.trim(),
        color: noteColor,
        category: noteCategory.trim() || undefined,
        checklist: modalChecklist.length > 0 ? modalChecklist : undefined,
      });
      playHapticFeedback('light');
    } else {
      const now = new Date().toISOString();
      addNoteItem({
        id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: noteTitle.trim() || tNote.untitled,
        content: noteContent.trim(),
        color: noteColor,
        category: noteCategory.trim() || undefined,
        checklist: modalChecklist.length > 0 ? modalChecklist : undefined,
        isPinned: false,
        createdAt: now,
        updatedAt: now,
      });
      playHapticFeedback('success');
    }

    setIsModalOpen(false);
  };

  const handleToggleChecklistItem = (note: NoteItem, itemId: string) => {
    const list = note.checklist || [];
    const updated = list.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateNoteItem(note.id, { checklist: updated });
    playHapticFeedback('selection');
  };

  const handleAddCardChecklistItem = (note: NoteItem) => {
    const text = (cardChecklistInput[note.id] || '').trim();
    if (!text) return;
    const current = note.checklist || [];
    const newItem: NoteChecklistItem = {
      id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text,
      completed: false,
    };
    updateNoteItem(note.id, { checklist: [...current, newItem] });
    setCardChecklistInput((prev) => ({ ...prev, [note.id]: '' }));
    playHapticFeedback('light');
  };

  // ⚡ Send to Today's Tasks action
  const handleSendToTodayTasks = (note: NoteItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const subtasks = (note.checklist || []).map((c) => ({
      id: c.id,
      title: c.text,
      completed: c.completed,
    }));

    const newTask: TaskItem = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: note.title || tNote.untitled,
      category: 'routine',
      frequency: 'daily',
      notes: note.content || undefined,
      scheduledDate: todayStr,
      completedDates: [],
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      createdAt: new Date().toISOString(),
    };

    addTask(newTask);
    playHapticFeedback('success');
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
    });
    showToast({
      message: language === 'ar'
        ? `⚡ أُرسلت "${note.title}" إلى مهام اليوم بنجاح!`
        : `⚡ "${note.title}" sent to Today's Tasks!`,
    });
  };

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 animate-page pb-24 select-text">
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text dark:text-text tracking-tight">
              {tNote.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info/10 text-info dark:text-info border text-info/20 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{tNote.subtitle}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted dark:text-muted mt-1">
            {tNote.badge} • {(notes || []).length} {tNote.registeredNotes}
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

      {/* ── Command-Style Search & Tag Filters Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-surface border border-border-subtle dark:bg-surface/5 dark:backdrop-blur-xl dark:border-border/10">
        {/* Filter Tag Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTag('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTag === 'all'
                ? 'bg-surface text-accent-contrast dark:bg-surface dark:text-text font-bold shadow-xs'
                : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04]'
            }`}
          >
            {tNote.all} ({(notes || []).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTag('pinned')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTag === 'pinned'
                ? 'bg-warning/20 text-warning dark:text-warning border border-warning/30 font-bold'
                : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04]'
            }`}
          >
            📌 {tNote.pinnedChip}
          </button>
          <button
            type="button"
            onClick={() => setActiveTag('checklists')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTag === 'checklists'
                ? 'bg-info/20 text-info dark:text-info border text-info/30 font-bold'
                : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04]'
            }`}
          >
            ☑️ {tNote.checklists}
          </button>
          <button
            type="button"
            onClick={() => setActiveTag('motivation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTag === 'motivation'
                ? 'bg-negative/20 text-negative dark:text-negative border border-negative/30 font-bold'
                : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04]'
            }`}
          >
            🔥 {tNote.motivation}
          </button>
          <button
            type="button"
            onClick={() => setActiveTag('ideas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTag === 'ideas'
                ? 'bg-accent/20 text-accent dark:text-accent border border-accent/30 font-bold'
                : 'text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04]'
            }`}
          >
            💡 {tNote.ideas}
          </button>
        </div>

        {/* Command Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted dark:text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tNote.searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-surface-3 dark:bg-surface/[0.04] border border-border dark:border-border/[0.08] text-xs text-text dark:text-text placeholder:text-muted focus:outline-none focus:border-accent/60 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text dark:hover:text-accent-contrast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Empty State ── */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-5 h-5 text-accent" />}
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
              <div className="flex items-center gap-1.5 text-xs font-bold text-warning uppercase tracking-wider">
                <Pin className="w-3.5 h-3.5 fill-amber-400" />
                <span>{tNote.pinned}</span>
                <span className="text-muted font-mono">({pinnedNotes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {pinnedNotes.map((note) => (
                  <NoteBentoCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleOpenEdit(note)}
                    onAlarm={() => setAlarmNote(note)}
                    onDelete={() => deleteNoteItem(note.id)}
                    onTogglePin={() => togglePinNote(note.id)}
                    onSendToTasks={() => handleSendToTodayTasks(note)}
                    onToggleChecklistItem={(id) => handleToggleChecklistItem(note, id)}
                    onAddChecklistItem={() => handleAddCardChecklistItem(note)}
                    checklistInputValue={cardChecklistInput[note.id] || ''}
                    onChecklistInputChange={(val) =>
                      setCardChecklistInput((prev) => ({ ...prev, [note.id]: val }))
                    }
                    generalLabel={tNote.general}
                    language={language}
                    tNote={tNote}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-bold text-muted uppercase tracking-wider">
                  {tNote.otherNotes} <span className="text-muted font-mono">({otherNotes.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {otherNotes.map((note) => (
                  <NoteBentoCard
                    key={note.id}
                    note={note}
                    onEdit={() => handleOpenEdit(note)}
                    onAlarm={() => setAlarmNote(note)}
                    onDelete={() => deleteNoteItem(note.id)}
                    onTogglePin={() => togglePinNote(note.id)}
                    onSendToTasks={() => handleSendToTodayTasks(note)}
                    onToggleChecklistItem={(id) => handleToggleChecklistItem(note, id)}
                    onAddChecklistItem={() => handleAddCardChecklistItem(note)}
                    checklistInputValue={cardChecklistInput[note.id] || ''}
                    onChecklistInputChange={(val) =>
                      setCardChecklistInput((prev) => ({ ...prev, [note.id]: val }))
                    }
                    generalLabel={tNote.general}
                    language={language}
                    tNote={tNote}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT NOTE MODAL ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? tNote.editNote : tNote.newNote}
        subtitle={tNote.subtitle}
      >
        <form onSubmit={handleSaveNote} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-text dark:text-muted mb-1">
              {tNote.titleLabel}
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder={tNote.titlePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-3 dark:bg-surface/[0.04] border border-border dark:border-border/[0.09] text-text dark:text-text text-sm font-semibold focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text dark:text-muted mb-1">
              {tNote.contentLabel}
            </label>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={tNote.contentPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-3 dark:bg-surface/[0.04] border border-border dark:border-border/[0.09] text-text dark:text-text text-sm focus:outline-none focus:border-accent leading-relaxed"
            />
          </div>

          {/* Interactive Checklist Editor inside Modal */}
          <div className="space-y-2 pt-1 border-t border-border/[0.06] dark:border-border/[0.06]">
            <label className="block text-xs font-bold text-text dark:text-muted">
              ☑️ {tNote.checklistItems}
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {modalChecklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 bg-canvas/[0.03] dark:bg-surface/[0.03] border border-border/[0.06] dark:border-border/[0.06] rounded-xl px-3 py-1.5 text-xs text-text dark:text-text"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setModalChecklist((prev) =>
                        prev.map((c) => (c.id === item.id ? { ...c, completed: !c.completed } : c))
                      );
                    }}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-positive dark:text-positive" />
                    ) : (
                      <Square className="w-4 h-4 text-muted dark:text-muted" />
                    )}
                    <span className={item.completed ? 'line-through text-muted dark:text-muted' : ''}>
                      {item.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalChecklist((prev) => prev.filter((c) => c.id !== item.id));
                    }}
                    className="text-muted hover:text-negative p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Item Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newChecklistText.trim()) {
                      setModalChecklist((prev) => [
                        ...prev,
                        {
                          id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                          text: newChecklistText.trim(),
                          completed: false,
                        },
                      ]);
                      setNewChecklistText('');
                    }
                  }
                }}
                placeholder={tNote.addChecklistItem}
                className="flex-1 px-3 py-1.5 rounded-xl bg-surface-3 dark:bg-surface/[0.04] border border-border dark:border-border/[0.08] text-xs text-text dark:text-text placeholder:text-muted outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => {
                  if (newChecklistText.trim()) {
                    setModalChecklist((prev) => [
                      ...prev,
                      {
                        id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                        text: newChecklistText.trim(),
                        completed: false,
                      },
                    ]);
                    setNewChecklistText('');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-surface text-accent-contrast dark:bg-surface dark:text-text font-bold text-xs hover:bg-surface dark:hover:bg-surface-2"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/[0.06] dark:border-border/[0.06]">
            <div>
              <label className="block text-xs font-bold text-text dark:text-muted mb-1">
                {tNote.categoryLabel}
              </label>
              <input
                type="text"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                placeholder={tNote.categoryPlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-3 dark:bg-surface/[0.04] border border-border dark:border-border/[0.09] text-text dark:text-text text-xs focus:outline-none focus:border-accent"
              />
              {/* Quick Category Chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['Motivation', 'Ideas', 'Checklist', 'Personal'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNoteCategory(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-canvas/[0.04] hover:bg-canvas/[0.08] text-muted border border-border/[0.06] dark:bg-surface/[0.04] dark:hover:bg-surface/[0.08] dark:text-muted dark:border-border/[0.06]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text dark:text-muted mb-1">
                {tNote.colorLabel}
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNoteColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      noteColor === c ? 'scale-125 ring-2 ring-ring ring-offset-2 ring-offset-surface' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Prominent Action Button: Add Alarm via Google Calendar */}
          <div className="pt-2 border-t border-border/[0.08] dark:border-border/[0.08]">
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
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-info to-accent hover:from-info hover:to-accent text-accent-contrast font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              <Bell className="w-4 h-4" />
              <span>{tNote.googleCalendarAlarmBtn}</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/[0.08] dark:border-border/[0.08]">
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

interface NoteBentoCardProps {
  note: NoteItem;
  onEdit: () => void;
  onAlarm: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onSendToTasks: () => void;
  onToggleChecklistItem: (id: string) => void;
  onAddChecklistItem: () => void;
  checklistInputValue: string;
  onChecklistInputChange: (val: string) => void;
  generalLabel: string;
  language: string;
  tNote: any;
}

const NoteBentoCard: React.FC<NoteBentoCardProps> = ({
  note,
  onEdit,
  onAlarm,
  onDelete,
  onTogglePin,
  onSendToTasks,
  onToggleChecklistItem,
  onAddChecklistItem,
  checklistInputValue,
  onChecklistInputChange,
  generalLabel,
  language,
  tNote,
}) => {
  const accentColor = note.color || 'bg-accent';
  const checklist = note.checklist || [];
  const totalChecklist = checklist.length;
  const completedChecklist = checklist.filter((c) => c.completed).length;
  const checklistProgress =
    totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="relative group bg-surface text-content border border-border-subtle shadow-xs dark:bg-surface/5 dark:backdrop-blur-xl dark:border-border/10 dark:hover:border-border/20 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_16px_36px_-12px_rgba(0,0,0,0.6)] rounded-2xl p-5 flex flex-col justify-between space-y-3 transition-all duration-300"
    >
      {/* Top subtle ambient glow line matching note color */}
      <div
        className="absolute inset-x-8 top-0 h-[1.5px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      <div className="space-y-3">
        {/* Header Row: Dot + Title + Glowing Squircle Pin */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: accentColor }}
            />
            <h4
              onClick={onEdit}
              className="font-bold text-sm sm:text-base text-text dark:text-text tracking-tight truncate cursor-pointer hover:underline"
            >
              {note.title}
            </h4>
          </div>

          {/* Glowing Squircle Pin Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              note.isPinned
                ? 'bg-warning/15 text-warning dark:text-warning border border-warning/35 shadow-xs'
                : 'text-muted dark:text-muted hover:text-text dark:hover:text-text hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.06] border border-border'
            }`}
            title={note.isPinned ? tNote.unpinNote : tNote.pinNote}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Text Content */}
        {note.content && (
          <p
            onClick={onEdit}
            className="text-xs text-muted dark:text-muted whitespace-pre-wrap leading-relaxed line-clamp-4 cursor-pointer hover:text-text dark:hover:text-muted transition-colors selectable-text"
          >
            {note.content}
          </p>
        )}

        {/* ── Inline Interactive Checklist with Mini-Progress Bar ── */}
        {totalChecklist > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/[0.06] dark:border-border/[0.06]">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-[11px] text-muted dark:text-muted">
              <span className="font-semibold flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-info dark:text-info" />
                {completedChecklist}/{totalChecklist} {tNote.completed}
              </span>
              <span className="tabular-nums font-bold text-text dark:text-text">{checklistProgress}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-canvas/[0.06] dark:bg-surface/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-info to-positive rounded-full transition-all duration-300"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>

            {/* Checklist Items list */}
            <div className="space-y-1 pt-1 max-h-36 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleChecklistItem(item.id);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-xs text-text dark:text-muted hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.04] transition-colors"
                >
                  {item.completed ? (
                    <CheckSquare className="w-3.5 h-3.5 text-positive dark:text-positive shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-muted dark:text-muted shrink-0" />
                  )}
                  <span
                    className={`truncate text-xs ${
                      item.completed ? 'line-through text-muted dark:text-muted' : 'text-text dark:text-text'
                    }`}
                  >
                    {item.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Action to edit checklist in Modal */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onEdit}
                className="w-full py-1.5 px-2 rounded-lg bg-canvas/[0.03] dark:bg-surface/[0.04] hover:bg-canvas/[0.06] dark:hover:bg-surface/[0.08] border border-border/[0.06] dark:border-border/[0.08] text-[11px] font-semibold text-muted dark:text-muted hover:text-text dark:hover:text-accent-contrast transition-all text-center"
              >
                {tNote.manageChecklistItems}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Row: Category Badge + Action Buttons ── */}
      <div className="pt-3 border-t border-border/[0.06] dark:border-border/[0.06] flex items-center justify-between text-xs text-muted dark:text-muted">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-canvas/[0.04] border border-border/[0.06] text-text dark:bg-surface/[0.04] dark:border-border/[0.06] dark:text-muted truncate max-w-[120px]">
          {note.category || generalLabel}
        </span>

        <div className="flex items-center gap-1">
          {/* ⚡ Send to Today's Tasks action button (User Requirement) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSendToTasks();
            }}
            className="p-1.5 rounded-lg text-warning dark:text-warning hover:text-warning dark:hover:text-warning hover:bg-warning/10 transition-colors"
            title={tNote.sendToTodayTasks}
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400/20" />
          </button>

          {/* Google Calendar Alarm */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAlarm();
            }}
            className="p-1.5 rounded-lg text-info dark:text-info hover:text-info dark:hover:text-info hover:bg-info/10 transition-colors"
            title="Google Calendar"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 rounded-lg text-muted hover:text-text dark:hover:text-accent-contrast hover:bg-canvas/[0.04] dark:hover:bg-surface/[0.06] transition-colors"
            title={tNote.editNote}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-muted hover:text-negative dark:hover:text-negative hover:bg-negative/10 transition-colors"
            title={tNote.deleteNote}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
