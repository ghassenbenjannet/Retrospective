import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Action } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, Loader, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcon: Record<string, React.ReactNode> = {
  todo: <Clock size={16} className="text-gray-400" />,
  in_progress: <Loader size={16} className="text-blue-500" />,
  done: <CheckCircle size={16} className="text-green-500" />,
  dropped: <XCircle size={16} className="text-red-400" />,
};
const statusColor: Record<string, 'gray' | 'blue' | 'green' | 'red'> = {
  todo: 'gray', in_progress: 'blue', done: 'green', dropped: 'red',
};
const statusLabel: Record<string, string> = {
  todo: 'À faire', in_progress: 'En cours', done: 'Terminé', dropped: 'Abandonné',
};

type FilterStatus = 'all' | 'todo' | 'in_progress' | 'done' | 'dropped';

export function ActionsPage() {
  const { user } = useAuthStore();
  const [actions, setActions] = useState<Action[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const load = () => api.get('/actions').then(r => setActions(r.data));
  useEffect(() => { load(); }, []);

  const handleStatus = async (action: Action, status: string) => {
    try {
      await api.patch(`/actions/${action._id}`, { status });
      setActions(prev => prev.map(a => a._id === action._id ? { ...a, status: status as Action['status'] } : a));
      toast.success('Mis à jour');
    } catch { toast.error('Erreur'); }
  };

  const filtered = filter === 'all' ? actions : actions.filter(a => a.status === filter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Actions</h2>
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done', 'dropped'] as FilterStatus[]).map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {s === 'all' ? 'Tout' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-8">Aucune action trouvée.</p></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(action => (
            <Card key={action._id} className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{statusIcon[action.status]}</div>
                <div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                  {action.description && <p className="text-sm text-gray-500 mt-0.5">{action.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Responsable : {action.ownerName}</span>
                    {action.dueDate && <span>Échéance : {new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>}
                    <span>Créé le {new Date(action.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge label={statusLabel[action.status]} color={statusColor[action.status]} />
                {(user?.role === 'admin' || action.ownerId === user?.id) && (
                  <select value={action.status} onChange={e => handleStatus(action, e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5">
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Terminé</option>
                    <option value="dropped">Abandonné</option>
                  </select>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
