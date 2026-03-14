import { useState, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { Action } from '@/types';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcon: Record<string, React.ReactNode> = {
  todo: <Clock size={14} className="text-gray-400" />,
  in_progress: <Loader size={14} className="text-blue-500" />,
  done: <CheckCircle size={14} className="text-green-500" />,
  dropped: <XCircle size={14} className="text-red-400" />,
};

const statusColor: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
  todo: 'gray', in_progress: 'blue', done: 'green', dropped: 'red',
};

interface Props { sessionId: string; isAdmin: boolean; }

export function ActionPanel({ sessionId, isAdmin }: Props) {
  const { actions, setActions } = useSessionStore();

  useEffect(() => {
    api.get(`/sessions/${sessionId}/actions`).then(r => setActions(r.data));
  }, [sessionId]);

  const handleStatusChange = async (action: Action, status: string) => {
    try {
      await api.patch(`/actions/${action._id}`, { status });
      setActions(actions.map(a => a._id === action._id ? { ...a, status: status as Action['status'] } : a));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-3">
      {actions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucune action retenue pour cette session.</div>
      ) : (
        actions.map(action => (
          <div key={action._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {statusIcon[action.status]}
                  <p className="font-medium text-gray-900">{action.title}</p>
                </div>
                {action.description && <p className="text-sm text-gray-500 mb-2">{action.description}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Responsable : {action.ownerName}</span>
                  {action.dueDate && <span>· Échéance : {new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge label={action.status.replace('_', ' ')} color={statusColor[action.status]} />
                {(isAdmin || true) && action.status !== 'done' && (
                  <select
                    value={action.status}
                    onChange={e => handleStatusChange(action, e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                    <option value="dropped">Abandonné</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
