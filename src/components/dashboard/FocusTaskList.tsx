import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../i18n/translations';
import { Plus, Trash2, Pin, Calendar, AlertCircle, Check, Edit2, X } from 'lucide-react';

export interface FocusTask {
  id: string;
  text: string;
  completed: boolean;
  isPinned: boolean;
  priority: 'urgent' | 'normal';
  dueDate?: string; // YYYY-MM-DD
  createdAt: string;
}

const STORAGE_KEY = 'flouss_focus_tasks_v1';

export const FocusTaskList: React.FC = () => {
  const { language } = useAppStore();
  const tFocus = translations[language].focusList;

  const [tasks, setTasks] = useState<FocusTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load focus tasks', e);
    }
    // Default initial tasks matching Moroccan personal finance & focus
    return [
      {
        id: 't_1',
        text:
          language === 'ar'
            ? 'دفع فاتورة الويفي والماء قبل 10 في الشهر'
            : language === 'en'
            ? 'Pay wifi and water utility before the 10th'
            : 'Régler la facture wifi & électricité avant le 10',
        completed: false,
        isPinned: true,
        priority: 'urgent',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 't_2',
        text:
          language === 'ar'
            ? 'تحويل 1 000 درهم لحساب صندوق الطوارئ'
            : language === 'en'
            ? 'Transfer 1,000 MAD to emergency fund'
            : 'Virer 1 000 MAD au fonds d’urgence',
        completed: false,
        isPinned: true,
        priority: 'normal',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't_3',
        text:
          language === 'ar'
            ? 'مراجعة مصاريف الأسبوع الماضي'
            : language === 'en'
            ? 'Review last week expenses'
            : 'Passer en revue les dépenses de la semaine',
        completed: true,
        isPinned: false,
        priority: 'normal',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState<'urgent' | 'normal'>('normal');
  const [newDueDate, setNewDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<'urgent' | 'normal'>('normal');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save focus tasks', e);
    }
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const newTask: FocusTask = {
      id: 'ft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: trimmed,
      completed: false,
      isPinned: false,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
    setNewDueDate('');
    setNewPriority('normal');
    setIsAdding(false);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleTogglePin = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
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

    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? {
              ...t,
              text: trimmed,
              priority: editPriority,
              dueDate: editDueDate || undefined,
            }
          : t
      )
    );
    setEditingId(null);
  };

  // Sort: Pinned first, then incomplete first, then priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) return a.priority === 'urgent' ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-white/80 dark:bg-zinc-900/65 backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.7)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-5 space-y-3">
      {/* Task List Header */}
      <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.05] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {tFocus.title}
          </span>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full tabular-nums">
            {completedCount}/{tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? tFocus.cancel : tFocus.add}</span>
        </button>
      </div>

      {/* Add Task Form inline */}
      {isAdding && (
        <form
          onSubmit={handleAddTask}
          className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-black/[0.04] dark:border-white/[0.06] space-y-2.5 animate-in fade-in duration-150"
        >
          <input
            type="text"
            required
            autoFocus
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder={tFocus.placeholder}
            className="w-full text-xs px-3 py-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {/* Priority Selector */}
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'urgent' | 'normal')}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
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

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              {tFocus.save}
            </button>
          </div>
        </form>
      )}

      {/* Inline Editing Form */}
      {editingId && (
        <form
          onSubmit={handleSaveEdit}
          className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-blue-500/30 space-y-2.5"
        >
          <input
            type="text"
            required
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-blue-500/30 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as 'urgent' | 'normal')}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
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
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                {tFocus.cancel}
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                {tFocus.update}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tasks List Items */}
      {sortedTasks.length === 0 ? (
        <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
          {tFocus.empty}
        </div>
      ) : (
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="group py-2.5 flex items-start justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-colors"
            >
              {/* Checkbox + Title */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-400'
                  }`}
                  aria-label={task.completed ? 'Completed' : 'Mark complete'}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span
                    onClick={() => handleToggleTask(task.id)}
                    className={`cursor-pointer block text-xs leading-normal select-none ${
                      task.completed
                        ? 'text-zinc-400 dark:text-zinc-500 line-through'
                        : 'text-zinc-800 dark:text-zinc-200 font-medium'
                    }`}
                  >
                    {task.text}
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

              {/* Action Buttons: Pin, Edit, Delete */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                <button
                  onClick={() => handleTogglePin(task.id)}
                  className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    task.isPinned
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => handleStartEdit(task)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
