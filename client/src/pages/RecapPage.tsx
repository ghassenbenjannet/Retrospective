import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Card, Action, User } from '@/types';
import { Card as CardUI } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, ThumbsUp, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// ── Mailto body builder ────────────────────────────────────────────────────────
function buildMailtoBody(session: Session, cards: Card[], actions: Action[]): string {
  const lines: string[] = [];
  const sections = session.templateSnapshot.sections;

  lines.push(`Bonjour,`);
  lines.push('');
  lines.push(`Notre dernière rétrospective : ${session.name}`);
  lines.push('');

  // ── Ressenti de l'équipe (mood) ──
  const moodSection = sections.find(s => s.type === 'mood');
  if (moodSection) {
    const moodCards = cards.filter(c => c.sectionId === moodSection._id);
    if (moodCards.length > 0) {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push(`Ressenti de l'équipe`);
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // Count choices per option
      const counts: Record<string, number> = {};
      moodCards.forEach(c => { counts[c.content] = (counts[c.content] ?? 0) + 1; });
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([opt, n]) => lines.push(`  ${opt} : ${n} réponse${n > 1 ? 's' : ''}`));
      lines.push('');
    }
  }

  // ── Évaluation du sprint (positive + negative) ──
  const positiveSection = sections.find(s => s.type === 'positive');
  const negativeSection = sections.find(s => s.type === 'negative');
  if (positiveSection || negativeSection) {
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('Évaluation du sprint');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (positiveSection) {
      const pts = cards.filter(c => c.sectionId === positiveSection._id).sort((a, b) => b.voteCount - a.voteCount);
      lines.push('✅ Points positifs');
      pts.length > 0
        ? pts.forEach(c => lines.push(`  • ${c.content}${c.voteCount > 0 ? ` (${c.voteCount} vote${c.voteCount > 1 ? 's' : ''})` : ''}`))
        : lines.push('  (aucun)');
      lines.push('');
    }
    if (negativeSection) {
      const pts = cards.filter(c => c.sectionId === negativeSection._id).sort((a, b) => b.voteCount - a.voteCount);
      lines.push('❌ Points à améliorer');
      pts.length > 0
        ? pts.forEach(c => lines.push(`  • ${c.content}${c.voteCount > 0 ? ` (${c.voteCount} vote${c.voteCount > 1 ? 's' : ''})` : ''}`))
        : lines.push('  (aucun)');
      lines.push('');
    }
  }

  // ── Suivi d'actions ──
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push("Notre suivi d'actions");
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const groups: Record<string, Action[]> = { todo: [], in_progress: [], done: [], dropped: [] };
  actions.forEach(a => groups[a.status]?.push(a));

  const statusLabels: Record<string, string> = {
    todo: '📋 À faire',
    in_progress: '⏳ En cours',
    done: '✅ Terminé',
    dropped: '❌ Abandonné',
  };

  Object.entries(statusLabels).forEach(([key, label]) => {
    const items = groups[key];
    if (items.length > 0) {
      lines.push(label);
      items.forEach(a => lines.push(`  • ${a.title} → ${a.ownerName}`));
      lines.push('');
    }
  });

  if (actions.length === 0) lines.push('Aucune action définie.\n');

  lines.push('---');
  lines.push('Rétrospective Live');

  return lines.join('\n');
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function RecapPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);

  const isAdmin = me?.role === 'admin';

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => setSession(r.data));
    api.get(`/sessions/${id}/cards`).then(r => setCards(r.data));
    api.get(`/sessions/${id}/actions`).then(r => setActions(r.data));
    if (isAdmin) api.get('/users').then(r => setWorkspaceUsers(r.data));
  }, [id, isAdmin]);

  const openMailto = () => {
    if (!session) return;
    const subject = `Rétrospective : ${session.name}`;
    const body = buildMailtoBody(session, cards, actions);

    // Build recipient list from session participants + workspace users
    const participantIds = new Set(session.participants.map(p => p.userId));
    const emails = workspaceUsers
      .filter(u => participantIds.has(u.id))
      .map(u => u.email)
      .filter(Boolean);

    const mailto = `mailto:${emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    toast.success('Messagerie ouverte avec le récapitulatif pré-rempli');
  };

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/sessions" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} />Retour aux sessions
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{session.name}</h2>
        <p className="text-gray-500 mt-1">Récapitulatif · {new Date(session.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>

      {/* Email recap button — admin only */}
      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Mail size={15} className="text-indigo-500" />
              Envoyer le récapitulatif par email
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Ouvre votre messagerie avec le résumé pré-rempli (ressenti, sprint, actions) — destinataires : {session.participants.length} participant{session.participants.length > 1 ? 's' : ''}.
            </p>
          </div>
          <button
            onClick={openMailto}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Mail size={14} /> Préparer l'email
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
