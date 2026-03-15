import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { Action, ActionStatus } from '@/types';
import { api } from '@/lib/api';
import { clsx } from 'clsx';
import { CheckCircle, Clock, XCircle, Loader2, User, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS: { id: ActionStatus; label: string }[] = [
  { id: 'todo',        label: 'À faire' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'done',        label: 'Terminé' },
  { id: 'dropped',     label: 'Abandonné' },
];

const columnStyle: Record<ActionStatus, { header: string; bg: string; border: string }> = {
  todo:        { header: 'bg-gray-100 text-gray-700',    bg: 'bg-gray-50',   border: 'border-gray-200' },
  in_progress: { header: 'bg-blue-100 text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  done:        { header: 'bg-green-100 text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
  dropped:     { header: 'bg-red-100 text-red-700',     bg: 'bg-red-50',    border: 'border-red-200' },
};

const StatusIcon = ({ status }: { status: ActionStatus }) => {
  if (status === 'todo')        return <Clock size={13} className="text-gray-400" />;
  if (status === 'in_progress') return <Loader2 size={13} className="text-blue-500 animate-spin" />;
  if (status === 'done')        return <CheckCircle size={13} className="text-green-500" />;
  return <XCircle size={13} className="text-red-400" />;
};

interface Props { sessionId: string; isAdmin: boolean; }

export function ActionPanel({ sessionId, isAdmin }: Props) {
  const { actions, setActions, updateAction, removeAction } = useSessionStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<ActionStatus | null>(null);
  const dragAction = useRef<Action | null>(null);

  useEffect(() => {
    api.get(`/sessions/${sessionId}/actions`).then(r => setActions(r.data));
  }, [sessionId]);

  const deleteAction = async (action: Action) => {
    if (!confirm(`Supprimer l'action "${action.title}" ?`)) return;
    try {
      await api.delete(`/actions/${action._id}`);
      removeAction(action._id);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const patchStatus = async (action: Action, status: ActionStatus) => {
    if (action.status === status) return;
    try {
      const { data } = await api.patch(`/actions/${action._id}`, { status });
      updateAction(data);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  /* ── drag & drop handlers ── */
  const onDragStart = (e: React.DragEvent, action: Action) => {
    dragAction.current = action;
    setDragging(action._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDragging(null);
    setOver(null);
    dragAction.current = null;
  };

  const onDragOver = (e: React.DragEvent, colId: ActionStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOver(colId);
  };

  const onDrop = (e: React.DragEvent, colId: ActionStatus) => {
    e.preventDefault();
    if (dragAction.current) {
      patchStatus(dragAction.current, colId);
    }
    setOver(null);
    setDragging(null);
  };

  const grouped = (status: ActionStatus) => actions.filter(a => a.status === status);

  return (
    <div className="overflow-x-auto pb-4">
      {actions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Aucune action retenue pour cette session.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 min-w-[700px]">
          {COLUMNS.map(col => {
            const cards = grouped(col.id);
            const style = columnStyle[col.id];
            const isDropTarget = over === col.id;
            return (
              <div
                key={col.id}
                onDragOver={e => onDragOver(e, col.id)}
                onDragLeave={() => setOver(null)}
                onDrop={e => onDrop(e, col.id)}
                className={clsx(
                  'rounded-xl border-2 flex flex-col transition-colors',
                  style.border,
                  isDropTarget ? 'border-indigo-400 bg-indigo-50' : style.bg,
                )}
              >
                {/* Column header */}
                <div className={clsx('rounded-t-xl px-3 py-2 flex items-center justify-between', style.header)}>
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="text-xs font-medium opacity-70">{cards.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 flex-1 min-h-[120px]">
                  {cards.map(action => (
                    <div
                      key={action._id}
                      draggable
                      onDragStart={e => onDragStart(e, action)}
                      onDragEnd={onDragEnd}
                      className={clsx(
                        'bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-opacity',
                        dragging === action._id && 'opacity-40',
                      )}
                    >
                      <div className="flex items-start gap-1.5 mb-1">
                        <StatusIcon status={action.status} />
                        <p className="text-sm font-medium text-gray-900 leading-tight flex-1">{action.title}</p>
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
                      {action.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{action.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User size={10} />{action.ownerName}
                        </span>
                        {action.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />{new Date(action.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {/* Quick status select for non-drag interaction */}
                      <select
                        value={action.status}
                        onChange={e => patchStatus(action, e.target.value as ActionStatus)}
                        onClick={e => e.stopPropagation()}
                        className="mt-2 w-full text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-600"
                      >
                        {COLUMNS.map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xs text-gray-300 italic">Déposer ici</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
