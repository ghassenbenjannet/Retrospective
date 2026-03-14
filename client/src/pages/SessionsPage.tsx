import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Template, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, PlayCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { CreateSessionModal } from '@/components/sessions/CreateSessionModal';

const statusColors: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'> = {
  draft: 'gray', planned: 'blue', lobby: 'yellow', active: 'green', finished: 'indigo', archived: 'gray',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon', planned: 'Planifiée', lobby: 'Lobby', active: 'En cours', finished: 'Terminée', archived: 'Archivée',
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
      toast.success('Statut mis à jour');
      load();
    } catch { toast.error('Erreur'); }
  };

  const nextStatus: Record<string, string> = {
    draft: 'planned', planned: 'lobby', lobby: 'active', active: 'finished',
  };
  const nextLabel: Record<string, string> = {
    draft: 'Planifier', planned: 'Ouvrir lobby', lobby: 'Démarrer', active: 'Terminer',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sessions</h2>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-2" />Nouvelle session</Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-8">Aucune session.</p></Card>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => (
            <Card key={s._id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <Badge label={statusLabels[s.status]} color={statusColors[s.status]} />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {s.participants.length} participants ·{' '}
                  {s.participants.filter(p => p.status === 'connected').length} connectés ·{' '}
                  {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {['lobby', 'active'].includes(s.status) && (
                  <Link to={`/sessions/${s._id}/live`}>
                    <Button size="sm"><PlayCircle size={14} className="mr-1" />Rejoindre</Button>
                  </Link>
                )}
                {['finished', 'archived'].includes(s.status) && (
                  <Link to={`/sessions/${s._id}/recap`}>
                    <Button size="sm" variant="secondary"><Eye size={14} className="mr-1" />Récap</Button>
                  </Link>
                )}
                {user?.role === 'admin' && nextStatus[s.status] && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(s._id, nextStatus[s.status])}>
                    {nextLabel[s.status]}
                  </Button>
                )}
              </div>
            </Card>
          ))}
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
