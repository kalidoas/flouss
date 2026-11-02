import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { FocusTask, FocusListMenu } from '../../types';
import { islandManager } from '../../utils/islandManager';
import { GoogleCalendarAlarmModal } from '../common/GoogleCalendarAlarmModal';
import { getFocusListName, getFocusTaskText } from '../../utils/i18nHelpers';
import { playHapticFeedback } from '../../utils/haptics';
import confetti from 'canvas-confetti';
import {
  Plus,
  Trash2,
  Pin,
  Calendar,
  AlertCircle,
  Check,
  Edit2,
  X,
  ListTodo,
  FolderPlus,
  Bell,
} from 'lucide-react';

export const FocusTaskList: React.FC = () => {
  const {
    focusTasks,
    focusLists,
    activeFocusListId,
    setActiveFocusListId,
    addFocusList,
    deleteFocusList,
    addFocusTask,
    updateFocusTask,
    deleteFocusTask,
    toggleFocusTask,
    togglePinFocusTask,
    language,
  } = useAppStore();

  const tFocus = translations[language].focusList;
  const isAr = language === 'ar';

  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState<'urgent' | 'normal'>('normal');
  const [newDueDate, setNewDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New Menu / List creation state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<'urgent' | 'normal'>('normal');
  const [editDueDate, setEditDueDate] = useState('');
  const [alarmFocusTask, setAlarmFocusTask] = useState<FocusTask | null>(null);

  // Active list ID fallback
  const currentListId = activeFocusListId || 'default';

  // Filter tasks for the selected menu/list (or show all if selected)
  const currentListTasks = useMemo(() => {
    return (focusTasks || []).filter((t: FocusTask) => {
      if (currentListId === 'all') return true;
      const tListId = t.listId || 'default';
      return tListId === currentListId;
    });
  }, [focusTasks, currentListId]);

  // Sort: Pinned first, then incomplete first, then urgent priority, then creation date
  const sortedTasks = useMemo(() => {
    return [...currentListTasks].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [currentListTasks]);

  const completedCount = currentListTasks.filter((t) => t.completed).length;

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;

    addFocusList(trimmed);
    setNewListName('');
    setIsAddingList(false);

    islandManager.notify({
      type: 'check',
      title: isAr ? 'تمت إضافة القائمة ومزامنتها سحابياً ✓' : language === 'en' ? 'Menu created and cloud synced ✓' : 'Menu créé et synchronisé ✓',
      subtitle: trimmed,
    });
  };

  const handleDeleteList = (list: FocusListMenu) => {
    if (list.id === 'default') return;
    if (window.confirm(tFocus.deleteListConfirm)) {
      deleteFocusList(list.id);
      islandManager.notify({
        type: 'check',
        title: isAr ? 'تم حذف القائمة' : 'Menu supprimé',
        subtitle: list.name,
      });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const newTask: FocusTask = {
      id: 'ft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      listId: currentListId === 'all' ? 'default' : currentListId,
      text: trimmed,
      completed: false,
      isPinned: false,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    addFocusTask(newTask);
    playHapticFeedback('medium');
    setNewTaskText('');
    setNewDueDate('');
    setNewPriority('normal');
    setIsAdding(false);

    islandManager.notify({
      type: 'check',
      title: isAr ? 'تم حفظ المهمة في السحابة ✓' : language === 'en' ? 'Task saved to Cloud ✓' : 'Tâche synchronisée au Cloud ✓',
      subtitle: trimmed,
    });
  };

  const handleToggleTask = (id: string, currentState: boolean) => {
    playHapticFeedback(currentState ? 'light' : 'success');
    toggleFocusTask(id);
    if (!currentState) {
      // Confetti burst on completion
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
  };

  const handleStartEdit = (task: FocusTask) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;

    updateFocusTask(editingId, {
      text: trimmed,
      priority: editPriority,
      dueDate: editDueDate || undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-5 space-y-3.5">
      {/* 1. Header with Title & Quick Add Button */}
      <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ListTodo className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
            {tFocus.title}
          </span>
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full tabular-nums">
            {completedCount}/{currentListTasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 hover:bg-blue-500/20 transition-all shadow-xs"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 stroke-[2.4]" />}
          <span>{isAdding ? tFocus.cancel : tFocus.add}</span>
        </button>
      </div>

      {/* 2. Horizontal Menu / List Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
        {(focusLists || []).map((list) => {
          const isActive = currentListId === list.id;
          const count = (focusTasks || []).filter(
            (t) => (t.listId || 'default') === list.id
          ).length;

          return (
            <div
              key={list.id}
              className={`group/item relative flex items-center shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              onClick={() => setActiveFocusListId(list.id)}
            >
              <span>{getFocusListName(list, language)}</span>
              <span
                className={`ml-1.5 text-[10px] tabular-nums px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-black/15 dark:text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>

              {/* Delete Menu button (Only for non-default lists) */}
              {list.id !== 'default' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list);
                  }}
                  className="ml-1.5 p-0.5 rounded hover:bg-rose-500/20 hover:text-rose-500 transition-colors opacity-60 hover:opacity-100"
                  title="Supprimer ce menu"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* All Lists Filter Pill */}
        <button
          onClick={() => setActiveFocusListId('all')}
          className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            currentListId === 'all'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {tFocus.allLists} ({(focusTasks || []).length})
        </button>

        {/* Add New Menu Button */}
        {!isAddingList ? (
          <button
            onClick={() => setIsAddingList(true)}
            className="flex items-center gap-1 shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{tFocus.newList}</span>
          </button>
        ) : (
          <form
            onSubmit={handleCreateList}
            className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-zinc-800 p-1 rounded-xl border border-blue-500/30 shadow-xs"
          >
            <input
              type="text"
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder={tFocus.newListPlaceholder}
              className="text-xs px-2 py-1 rounded-lg bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none w-32 sm:w-40"
            />
            <button
              type="submit"
              className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold shadow-xs hover:bg-blue-700 transition-colors"
            >
              {tFocus.createListBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingList(false);
                setNewListName('');
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        )}
      </div>

      {/* 3. Inline Task Creation Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddTask}
            className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] space-y-3 overflow-hidden shadow-xs"
          >
            <input
              type="text"
              required
              autoFocus
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={tFocus.placeholder}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {/* Priority Selector */}
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'urgent' | 'normal')}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                >
                  <option value="normal">{tFocus.normalPriority}</option>
                  <option value="urgent">{tFocus.urgentPriority}</option>
                </select>

                {/* Due Date */}
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {tFocus.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  {tFocus.save}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 4. Inline Editing Form */}
      <AnimatePresence>
        {editingId && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveEdit}
            className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-blue-500/30 space-y-3 overflow-hidden shadow-xs"
          >
            <input
              type="text"
              required
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-blue-500/30 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as 'urgent' | 'normal')}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                >
                  <option value="normal">{tFocus.normalPriority}</option>
                  <option value="urgent">{tFocus.urgentPriority}</option>
                </select>

                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const cur = (focusTasks || []).find((t) => t.id === editingId);
                    if (cur) {
                      setAlarmFocusTask(cur);
                    } else if (editText.trim()) {
                      setAlarmFocusTask({
                        id: editingId || 'temp',
                        text: editText.trim(),
                        completed: false,
                        isPinned: false,
                        priority: editPriority,
                        dueDate: editDueDate || undefined,
                        createdAt: new Date().toISOString(),
                      });
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 border border-blue-500/20 transition-all"
                  title={tFocus.googleCalendarAlarmBtn}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tFocus.googleCalendarAlarmBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  {tFocus.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs transition-colors hover:bg-blue-700"
                >
                  {tFocus.update}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 5. Render Tasks in the Active Menu */}
      {sortedTasks.length === 0 ? (
        <div className="py-7 text-center space-y-1">
          <ListTodo className="w-5 h-5 mx-auto text-zinc-400 opacity-60" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {tFocus.empty}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {sortedTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              className="group py-2.5 flex items-start justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-colors"
            >
              {/* Checkbox + Title */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id, task.completed)}
                  className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-500'
                  }`}
                  aria-label={task.completed ? 'Completed' : 'Mark complete'}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span
                    onClick={() => handleStartEdit(task)}
                    className={`cursor-pointer block text-xs leading-normal select-none transition-colors hover:underline ${
                      task.completed
                        ? 'text-zinc-400 dark:text-zinc-500 line-through'
                        : 'text-zinc-800 dark:text-zinc-200 font-medium'
                    }`}
                  >
                    {getFocusTaskText(task, language)}
                  </span>

                  {/* Badges: Due Date & Urgent */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {task.priority === 'urgent' && (
                      <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                        <AlertCircle className="w-3 h-3" />
                        <span>{tFocus.urgentBadge}</span>
                      </span>
                    )}

                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md tabular-nums">
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pin, Alarm, Edit, Delete */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                <button
                  type="button"
                  onClick={() => setAlarmFocusTask(task)}
                  title={tFocus.googleCalendarAlarmBtn}
                  className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => togglePinFocusTask(task.id)}
                  title="Épingler"
                  className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    task.isPinned
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => handleStartEdit(task)}
                  title="Modifier"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => deleteFocusTask(task.id)}
                  title="Supprimer"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Standalone Google Calendar Alarm Modal */}
      {alarmFocusTask && (
        <GoogleCalendarAlarmModal
          isOpen={Boolean(alarmFocusTask)}
          onClose={() => setAlarmFocusTask(null)}
          taskTitle={alarmFocusTask.text}
          taskDescription={alarmFocusTask.priority === 'urgent' ? 'Tâche urgente' : 'Tâche de ma liste'}
          defaultDate={alarmFocusTask.dueDate}
        />
      )}
    </div>
  );
};
