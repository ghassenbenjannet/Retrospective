import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Action } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PlayCircle, CheckSquare, FileText, Users } from 'lucide-react';

const statusColors: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'> = {
  draft: 'gray', planned: 'blue', lobby: 'yellow', active: 'green', finished: 'indigo', archived: 'gray',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data));
    api.get('/actions').then(r => setActions(r.data));
  }, []);

  const activeSessions = sessions.filter(s => ['lobby', 'active'].includes(s.status));
  const pendingActions = actions.filter(a => a.status !== 'done' && a.status !== 'dropped');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bonjour, {user?.name} 👋</h2>
        <p className="text-gray-500 mt-1">Bienvenue sur votre espace rétrospective</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Sessions actives', value: activeSessions.length, icon: PlayCircle, color: 'text-green-600' },
          { label: 'Actions en cours', value: pendingActions.length, icon: CheckSquare, color: 'text-yellow-600' },
          { label: 'Total sessions', value: sessions.length, icon: FileText, color: 'text-blue-600' },
          { label: 'Total actions', value: actions.length, icon: Users, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-4">
              <Icon size={28} className={color} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions en cours</h3>
          <div className="space-y-3">
            {activeSessions.map(s => (
              <Card key={s._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge label={s.status} color={statusColors[s.status]} />
                    <span className="text-sm text-gray-500">{s.participants.filter(p => p.status === 'connected').length} connectés</span>
                  </div>
                </div>
                <Link
                  to={`/sessions/${s._id}/live`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Rejoindre
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Actions récentes</h3>
          <Link to="/actions" className="text-sm text-primary-600 hover:text-primary-700">Voir tout →</Link>
        </div>
        {pendingActions.length === 0 ? (
          <Card><p className="text-gray-500 text-center py-4">Aucune action en attente</p></Card>
        ) : (
          <div className="space-y-3">
            {pendingActions.slice(0, 5).map(a => (
              <Card key={a._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-500">Responsable : {a.ownerName}</p>
                </div>
                <Badge label={a.status} color={a.status === 'in_progress' ? 'blue' : 'gray'} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
