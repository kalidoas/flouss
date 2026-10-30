import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
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
  const isAr = language === 'ar';

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
        text: isAr ? 'دفع فاتورة الويفي والماء قبل 10 في الشهر' : 'Régler la facture wifi & électricité avant le 10',
        completed: false,
        isPinned: true,
        priority: 'urgent',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 't_2',
        text: isAr ? 'تحويل 1 000 درهم لحساب صندوق الطوارئ' : 'Virer 1 000 MAD au fonds d’urgence',
        completed: false,
        isPinned: true,
        priority: 'normal',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't_3',
        text: isAr ? 'مراجعة مصاريف الأسبوع الماضي' : 'Passer en revue les dépenses de la semaine',
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

  // Edit inline modal / state
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
    <div className="bg-white dark:bg-[#202020] border border-[#e3e2de] dark:border-[#2f2f2f] rounded-lg p-4 sm:p-5 shadow-sm space-y-3">
      {/* Notion Task List Header */}
      <div className="flex items-center justify-between border-b border-[#e3e2de] dark:border-[#2f2f2f] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#37352f] dark:text-[#ecebed]">
            {isAr ? 'قائمتي' : 'Ma liste'}
          </span>
          <span className="text-[11px] text-[#787774] dark:text-[#9b9a97] tabular-nums">
            {completedCount}/{tasks.length}
          </span>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-[#ecebed] px-2 py-1 rounded hover:bg-[#f1f0ee] dark:hover:bg-[#282828] transition-colors"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? (isAr ? 'إلغاء' : 'Annuler') : (isAr ? 'مهمة جديدة' : 'Ajouter')}</span>
        </button>
      </div>

      {/* Add Task Form inline */}
      {isAdding && (
        <form onSubmit={handleAddTask} className="p-3 bg-[#fbfbfa] dark:bg-[#1a1a1a] rounded-md border border-[#e3e2de] dark:border-[#2f2f2f] space-y-2.5 animate-in fade-in duration-100">
          <input
            type="text"
            required
            autoFocus
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder={isAr ? 'اكتب مهمتك المالية أو اليومية...' : 'Nouvelle tâche (ex: payer loyer, vérifier virement)...'}
            className="w-full text-xs px-2.5 py-1.5 rounded border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none focus:border-[#2383e2]"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {/* Priority Selector */}
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'urgent' | 'normal')}
                className="text-xs px-2 py-1 rounded border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
              >
                <option value="normal">{isAr ? 'أولوية عادية' : 'Normal'}</option>
                <option value="urgent">{isAr ? 'عاجل جداً' : 'Urgent'}</option>
              </select>

              {/* Due Date */}
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-3 py-1 rounded bg-[#2383e2] hover:bg-[#1a73cb] text-white font-medium text-xs shadow-sm transition-colors"
            >
              {isAr ? 'حفظ المهمة' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {/* Inline Editing Form */}
      {editingId && (
        <form onSubmit={handleSaveEdit} className="p-3 bg-[#fbfbfa] dark:bg-[#1a1a1a] rounded-md border border-[#2383e2] space-y-2.5">
          <input
            type="text"
            required
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as 'urgent' | 'normal')}
                className="text-xs px-2 py-1 rounded border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
              >
                <option value="normal">{isAr ? 'أولوية عادية' : 'Normal'}</option>
                <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
              </select>

              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="text-xs px-2 py-1 rounded border border-[#e3e2de] dark:border-[#2f2f2f] bg-white dark:bg-[#202020] text-[#37352f] dark:text-[#ecebed] outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-2.5 py-1 rounded text-xs text-[#787774] hover:bg-[#f1f0ee] transition-colors"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-[#2383e2] text-white font-medium text-xs shadow-sm transition-colors"
              >
                {isAr ? 'تحديث' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tasks List Items */}
      {sortedTasks.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#787774] dark:text-[#9b9a97]">
          {isAr ? 'قائمتك فارغة، أضف أول مهمة' : 'Aucune tâche dans votre liste.'}
        </div>
      ) : (
        <div className="divide-y divide-[#f1f0ee] dark:divide-[#282828]">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="group py-2 flex items-start justify-between gap-3 hover:bg-[#fbfbfa] dark:hover:bg-[#252525] px-1.5 rounded transition-colors"
            >
              {/* Checkbox + Title */}
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-[#2383e2] border-[#2383e2] text-white'
                      : 'border-[#d3d1cb] dark:border-[#3f3f3f] bg-white dark:bg-[#202020] hover:border-[#787774]'
                  }`}
                  aria-label={task.completed ? 'Marquer comme non fait' : 'Marquer comme fait'}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <span
                    onClick={() => handleToggleTask(task.id)}
                    className={`cursor-pointer block text-xs leading-normal select-none ${
                      task.completed
                        ? 'text-[#9b9a97] dark:text-[#787774] line-through'
                        : 'text-[#37352f] dark:text-[#ecebed]'
                    }`}
                  >
                    {task.text}
                  </span>

                  {/* Badges: Due Date & Urgent */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {task.priority === 'urgent' && (
                      <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>{isAr ? 'عاجل' : 'Urgent'}</span>
                      </span>
                    )}

                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 text-[#787774] dark:text-[#9b9a97]">
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Pin, Edit, Delete */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                <button
                  onClick={() => handleTogglePin(task.id)}
                  title={task.isPinned ? 'Détacher' : 'Épingler en haut'}
                  className={`p-1 rounded hover:bg-[#f1f0ee] dark:hover:bg-[#2e2e2e] ${
                    task.isPinned
                      ? 'text-[#2383e2]'
                      : 'text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97]'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${task.isPinned ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => handleStartEdit(task)}
                  title="Modifier"
                  className="p-1 rounded text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] hover:bg-[#f1f0ee] dark:hover:bg-[#2e2e2e]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  title="Supprimer"
                  className="p-1 rounded text-[#787774] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
