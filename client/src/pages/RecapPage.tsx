import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Card, Action, User } from '@/types';
import { Card as CardUI } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, ThumbsUp, Send, Mail, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export function RecapPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [senderUserId, setSenderUserId] = useState<string>('');
  const [sending, setSending] = useState(false);

  const isAdmin = me?.role === 'admin';

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => setSession(r.data));
    api.get(`/sessions/${id}/cards`).then(r => setCards(r.data));
    api.get(`/sessions/${id}/actions`).then(r => setActions(r.data));
    if (isAdmin) {
      api.get('/users').then(r => {
        setWorkspaceUsers(r.data);
        // Pre-select current user as sender
        const me2 = r.data.find((u: User) => u.id === me?.id);
        if (me2) setSenderUserId(me2.id);
      });
    }
  }, [id, isAdmin]);

  const sendEmail = async () => {
    if (!senderUserId) { toast.error('Sélectionne un expéditeur'); return; }
    setSending(true);
    try {
      const res = await api.post(`/sessions/${id}/send-email`, { senderUserId });
      toast.success(`${res.data.message} (${res.data.count} destinataire${res.data.count > 1 ? 's' : ''})`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  const participantUsers = session.participants.map(p => ({ id: p.userId, name: p.name }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/sessions" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} />Retour aux sessions
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{session.name}</h2>
        <p className="text-gray-500 mt-1">Récapitulatif · {new Date(session.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Email section — admin only */}
      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <Mail size={16} className="text-indigo-500" />
            Envoyer le récap par email
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sender picker */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <UserIcon size={12} /> Expéditeur
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {workspaceUsers.map(u => (
                  <label
                    key={u.id}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-all text-sm',
                      senderUserId === u.id
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700',
                    )}
                  >
                    <input
                      type="radio"
                      name="sender"
                      value={u.id}
                      checked={senderUserId === u.id}
                      onChange={() => setSenderUserId(u.id)}
                      className="accent-indigo-600"
                    />
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {u.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{u.name}</span>
                      <span className="text-[10px] text-gray-400 truncate block">{u.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recipients list */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Send size={12} /> Destinataires ({participantUsers.length})
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {participantUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun participant</p>
                ) : participantUsers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700">
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    {p.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={sendEmail}
            disabled={sending || !senderUserId}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Envoi en cours…</>
              : <><Send size={14} /> Envoyer à {participantUsers.length} destinataire{participantUsers.length > 1 ? 's' : ''}</>
            }
          </button>
        </div>
      )}

      {/* Actions retenues */}
      {actions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Actions retenues</h3>
          <div className="space-y-3">
            {actions.map(a => (
              <CardUI key={a._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-gray-500">Responsable : {a.ownerName}</p>
                </div>
                <Badge label={a.status} color={a.status === 'done' ? 'green' : a.status === 'in_progress' ? 'blue' : 'gray'} />
              </CardUI>
            ))}
          </div>
        </div>
      )}

      {/* Cards par section */}
      {session.templateSnapshot.sections.map(section => {
        const sectionCards = cards.filter(c => c.sectionId === section._id).sort((a, b) => b.voteCount - a.voteCount);
        if (sectionCards.length === 0) return null;
        return (
          <div key={section._id} className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {sectionCards.map(card => (
                <CardUI key={card._id} padding={false} className="p-4">
                  <p className="text-sm text-gray-800">{card.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{card.authorName}</span>
                    <span className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                      <ThumbsUp size={12} />{card.voteCount}
                    </span>
                  </div>
                </CardUI>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
