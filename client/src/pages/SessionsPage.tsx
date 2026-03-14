import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Template, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, PlayCircle, Eye, Trash2, Users, Calendar, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { CreateSessionModal } from '@/components/sessions/CreateSessionModal';
import { clsx } from 'clsx';

const statusColors: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'> = {
  draft: 'gray', planned: 'blue', lobby: 'yellow', active: 'green', finished: 'indigo', archived: 'gray',
};
const statusLabels: Record<string, string> = {
  draft: 'Brouillon', planned: 'Planifiée', lobby: 'Lobby', active: 'En cours', finished: 'Terminée', archived: 'Archivée',
};
const statusDot: Record<string, string> = {
  draft: 'bg-gray-400', planned: 'bg-blue-500', lobby: 'bg-yellow-400',
  active: 'bg-green-500 animate-pulse', finished: 'bg-indigo-500', archived: 'bg-gray-400',
};
const nextStatus: Record<string, string> = {
  draft: 'planned', planned: 'lobby', lobby: 'active', active: 'finished',
};
const nextLabel: Record<string, string> = {
  draft: 'Planifier', planned: 'Ouvrir lobby', lobby: 'Démarrer', active: 'Terminer',
};

export function SessionsPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => api.get('/sessions').then(r => setSessions(r.data));

  useEffect(() => {
    load();
    if (user?.role === 'admin') {
      api.get('/templates').then(r => setTemplates(r.data));
      api.get('/users').then(r => setUsers(r.data));
    }
  }, [user]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/sessions/${id}/status`, { status });
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette session ? Cette action est irréversible.')) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success('Session supprimée');
      load();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const active = sessions.filter(s => ['lobby', 'active'].includes(s.status));
  const others = sessions.filter(s => !['lobby', 'active'].includes(s.status));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
          <p className="text-sm text-gray-500 mt-1">{sessions.length} session{sessions.length > 1 ? 's' : ''} au total</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-2" />Nouvelle session
          </Button>
        )}
      </div>

      {/* Active sessions spotlight */}
      {active.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">🟢 En cours</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map(s => (
              <div key={s._id}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-bold text-gray-900 text-lg leading-tight">{s.name}</h4>
                  <Badge label={statusLabels[s.status]} color={statusColors[s.status]} />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    {s.participants.filter(p => p.status === 'connected').length}/{s.participants.length} connectés
                  </span>
                </div>
                <Link to={`/sessions/${s._id}/live`}>
                  <Button className="w-full justify-center">
                    <PlayCircle size={15} className="mr-2" />Rejoindre la session
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All other sessions */}
      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Toutes les sessions</h3>
          <div className="space-y-2">
            {others.map(s => (
              <div key={s._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                {/* Status dot */}
                <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', statusDot[s.status])} />
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                    <Badge label={statusLabels[s.status]} color={statusColors[s.status]} />
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                    <Users size={11} />{s.participants.length} participants
                    <Calendar size={11} />{new Date(s.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {['finished', 'archived'].includes(s.status) && (
                    <Link to={`/sessions/${s._id}/recap`}>
                      <Button size="sm" variant="secondary">
                        <Eye size={13} className="mr-1" />Récap
                      </Button>
                    </Link>
                  )}
                  {user?.role === 'admin' && nextStatus[s.status] && (
                    <Button size="sm" variant="secondary"
                      onClick={() => handleStatusChange(s._id, nextStatus[s.status])}>
                      {nextLabel[s.status]} <ChevronRight size={13} className="ml-1" />
                    </Button>
                  )}
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(s._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <PlayCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500">Aucune session</p>
          <p className="text-sm mt-1">Créez votre première session rétrospective</p>
        </div>
      )}

      {showCreate && (
        <CreateSessionModal
          templates={templates.filter(t => t.status === 'active')}
          users={users}
          onClose={() => setShowCreate(false)}
          onCreated={() => { load(); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
