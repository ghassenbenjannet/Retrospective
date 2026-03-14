import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Card, Action } from '@/types';
import { Card as CardUI } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, ThumbsUp } from 'lucide-react';

export function RecapPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => setSession(r.data));
    api.get(`/sessions/${id}/cards`).then(r => setCards(r.data));
    api.get(`/sessions/${id}/actions`).then(r => setActions(r.data));
  }, [id]);

  if (!session) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/sessions" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} />Retour aux sessions
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{session.name}</h2>
        <p className="text-gray-500 mt-1">Récapitulatif · {new Date(session.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>

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
