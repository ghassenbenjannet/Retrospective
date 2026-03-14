import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Action } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { PlayCircle, CheckSquare, FileText, TrendingUp, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const statusDot: Record<string, string> = {
  lobby: 'bg-yellow-400', active: 'bg-green-400 animate-pulse',
};
const statusLabel: Record<string, string> = {
  lobby: 'Lobby', active: 'En cours',
};
const actionStatusStyle: Record<string, { color: string; icon: React.ReactNode }> = {
  todo:        { color: 'text-gray-500 bg-gray-100',   icon: <Clock size={11} /> },
  in_progress: { color: 'text-blue-600 bg-blue-100',   icon: <Loader2 size={11} className="animate-spin" /> },
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
  const doneActions = actions.filter(a => a.status === 'done');
  const pct = actions.length > 0 ? Math.round((doneActions.length / actions.length) * 100) : 0;

  const stats = [
    {
      label: 'Sessions actives', value: activeSessions.length,
      icon: PlayCircle, gradient: 'from-green-400 to-emerald-500', link: '/sessions',
    },
    {
      label: 'Actions en attente', value: pendingActions.length,
      icon: CheckSquare, gradient: 'from-yellow-400 to-orange-500', link: '/actions',
    },
    {
      label: 'Total sessions', value: sessions.length,
      icon: FileText, gradient: 'from-blue-400 to-indigo-500', link: '/sessions',
    },
    {
      label: 'Avancement actions', value: `${pct}%`,
      icon: TrendingUp, gradient: 'from-purple-400 to-pink-500', link: '/actions',
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 mt-1.5">Voici un aperçu de votre espace rétrospective.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, gradient, link }) => (
          <Link to={link} key={label}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group">
              <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm', gradient)}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Progress bar */}
      {actions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Progression globale des actions</p>
            <span className="text-sm font-bold text-indigo-600">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span>✅ {doneActions.length} terminée{doneActions.length > 1 ? 's' : ''}</span>
            <span>⏳ {pendingActions.length} en attente</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Sessions en cours</h3>
            <Link to="/sessions" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>
          {activeSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              <PlayCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune session active</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeSessions.map(s => (
                <div key={s._id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', statusDot[s.status])} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400">{statusLabel[s.status]} · {s.participants.filter(p => p.status === 'connected').length} connectés</p>
                    </div>
                  </div>
                  <Link to={`/sessions/${s._id}/live`}
                    className="flex-shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Rejoindre
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Actions récentes</h3>
            <Link to="/actions" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
              Voir kanban <ArrowRight size={12} />
            </Link>
          </div>
          {pendingActions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Toutes les actions sont terminées 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingActions.slice(0, 5).map(a => {
                const s = actionStatusStyle[a.status];
                return (
                  <div key={a._id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
                    <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0', s.color)}>
                      {s.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 truncate">{a.ownerName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
