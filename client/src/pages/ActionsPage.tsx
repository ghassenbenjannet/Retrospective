import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Action } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle, Clock, Loader2, XCircle, Star, Trophy, Medal, Award, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const COLUMNS: { id: Action['status']; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { id: 'todo',        label: 'À faire',    color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200',   icon: <Clock size={14} /> },
  { id: 'in_progress', label: 'En cours',   color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200',   icon: <Loader2 size={14} className="animate-spin" /> },
  { id: 'done',        label: 'Terminé',    color: 'text-green-600',bg: 'bg-green-50 border-green-200', icon: <CheckCircle size={14} /> },
  { id: 'dropped',     label: 'Abandonné',  color: 'text-red-500',  bg: 'bg-red-50 border-red-200',     icon: <XCircle size={14} /> },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  prio: { label: 'Prio',  color: 'bg-red-100 text-red-700',    icon: <Star size={10} className="fill-red-500" /> },
  top1: { label: 'Top 1', color: 'bg-yellow-100 text-yellow-700', icon: <Trophy size={10} /> },
  top2: { label: 'Top 2', color: 'bg-gray-100 text-gray-600',   icon: <Medal size={10} /> },
  top3: { label: 'Top 3', color: 'bg-amber-100 text-amber-700', icon: <Award size={10} /> },
};

export function ActionsPage() {
  const { user } = useAuthStore();
  const [actions, setActions] = useState<Action[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Action['status'] | null>(null);

  const load = () => api.get('/actions').then(r => setActions(r.data));
  useEffect(() => { load(); }, []);

  const moveAction = async (action: Action, newStatus: Action['status']) => {
    if (action.status === newStatus) return;
    setActions(prev => prev.map(a => a._id === action._id ? { ...a, status: newStatus } : a));
    try {
      await api.patch(`/actions/${action._id}`, { status: newStatus });
    } catch {
      toast.error('Erreur lors du déplacement');
      load();
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, col: Action['status']) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragging) return;
    const action = actions.find(a => a._id === dragging);
    if (action) moveAction(action, col);
    setDragging(null);
  };

  const canEdit = (a: Action) => user?.role === 'admin' || a.ownerId === user?.id;
  const isAdmin = user?.role === 'admin';

  const deleteAction = async (action: Action) => {
    if (!confirm(`Supprimer l'action "${action.title}" ?`)) return;
    try {
      await api.delete(`/actions/${action._id}`);
      setActions(prev => prev.filter(a => a._id !== action._id));
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const total = actions.length;
  const done = actions.filter(a => a.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Suivi des actions</h2>
            <p className="text-sm text-gray-500 mt-0.5">{total} action{total > 1 ? 's' : ''} · {done} terminée{done > 1 ? 's' : ''}</p>
          </div>
          <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-4 h-full min-h-0">
          {COLUMNS.map(col => {
            const colActions = actions.filter(a => a.status === col.id);
            const isOver = dragOver === col.id;
            return (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.id)}
                className={clsx(
                  'flex flex-col rounded-2xl border transition-all',
                  col.bg,
                  isOver && 'ring-2 ring-indigo-400 scale-[1.01] shadow-lg',
                )}
              >
                {/* Column header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-black/5">
                  <div className={clsx('flex items-center gap-2 font-semibold text-sm', col.color)}>
                    {col.icon}
                    {col.label}
                  </div>
                  <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', col.color, 'bg-white/70')}>
                    {colActions.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {colActions.map(action => {
                    const prio = action.priority ? PRIORITY_CONFIG[action.priority] : null;
                    return (
                      <div
                        key={action._id}
                        draggable={canEdit(action)}
                        onDragStart={e => handleDragStart(e, action._id)}
                        onDragEnd={() => setDragging(null)}
                        className={clsx(
                          'bg-white rounded-xl border border-gray-200 p-3 shadow-sm transition-all',
                          canEdit(action) ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'cursor-default',
                          dragging === action._id && 'opacity-40 scale-95',
                        )}
                      >
                        {/* Priority badge + delete */}
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <div>
                            {prio && (
                              <span className={clsx('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full', prio.color)}>
                                {prio.icon}{prio.label}
                              </span>
                            )}
                          </div>
                          {isAdmin && (
                            <button
                              onClick={e => { e.stopPropagation(); deleteAction(action); }}
                              className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 leading-snug mb-2">{action.title}</p>
                        {action.description && (
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{action.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] flex items-center justify-center">
                              {action.ownerName.slice(0, 1).toUpperCase()}
                            </span>
                            {action.ownerName}
                          </span>
                          {/* Quick move dropdown if can edit */}
                          {canEdit(action) && (
                            <select
                              value={action.status}
                              onChange={e => moveAction(action, e.target.value as Action['status'])}
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] border-0 bg-transparent text-gray-400 cursor-pointer focus:ring-0 pr-4 -mr-1"
                            >
                              <option value="todo">À faire</option>
                              <option value="in_progress">En cours</option>
                              <option value="done">Terminé</option>
                              <option value="dropped">Abandonné</option>
                            </select>
                          )}
                        </div>
                        {action.dueDate && (
                          <p className="text-[10px] text-gray-400 mt-1.5">
                            📅 {new Date(action.dueDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {colActions.length === 0 && (
                    <div className={clsx(
                      'border-2 border-dashed rounded-xl p-6 text-center text-xs transition-all',
                      isOver ? 'border-indigo-400 bg-indigo-50 text-indigo-400' : 'border-transparent text-gray-300',
                    )}>
                      {isOver ? 'Déposer ici' : 'Vide'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
