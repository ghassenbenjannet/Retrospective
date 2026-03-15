import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Template } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  Plus, Copy, Archive, Edit2, Trash2, Layers,
  CheckCircle, Clock, ArchiveIcon, Zap, Vote, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TemplateFormModal } from '@/components/templates/TemplateFormModal';
import { imgSrc } from '@/lib/imageUrl';
import { clsx } from 'clsx';

type FilterStatus = 'all' | 'draft' | 'active' | 'archived';

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:    { label: 'Brouillon', color: 'text-amber-600',  bg: 'bg-amber-50',   icon: <Clock size={12} /> },
  active:   { label: 'Actif',     color: 'text-emerald-600',bg: 'bg-emerald-50', icon: <CheckCircle size={12} /> },
  archived: { label: 'Archivé',   color: 'text-gray-500',   bg: 'bg-gray-100',   icon: <ArchiveIcon size={12} /> },
};

const SECTION_ICONS: Record<string, string> = {
  mood: '😊', positive: '✅', negative: '❌', brainstorming: '💡',
  minigame: '🎮', vote: '🗳️', action_selection: '🎯', action_review: '📋',
};

const COVER_GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-700',
];

function getCoverGradient(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_GRADIENTS[sum % COVER_GRADIENTS.length];
}

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null | 'new'>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const load = () => api.get('/templates').then(r => setTemplates(r.data));
  useEffect(() => { load(); }, []);

  const handleDuplicate = async (id: string) => {
    try { await api.post(`/templates/${id}/duplicate`); toast.success('Template dupliqué'); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce template ?')) return;
    try { await api.delete(`/templates/${id}`); toast.success('Supprimé'); load(); }
    catch { toast.error('Erreur'); }
  };

  const handleStatusChange = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await api.put(`/templates/${id}`, { status }); toast.success('Statut mis à jour'); load(); }
    catch { toast.error('Erreur'); }
  };

  const filtered = filter === 'all' ? templates : templates.filter(t => t.status === filter);
  const counts = { all: templates.length, draft: templates.filter(t => t.status === 'draft').length, active: templates.filter(t => t.status === 'active').length, archived: templates.filter(t => t.status === 'archived').length };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 px-8 pt-10 pb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-48 h-48 bg-white rounded-full blur-2xl" />
        </div>
        <div className="relative flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Layers size={20} className="text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium uppercase tracking-wider">Bibliothèque</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-1">Templates</h1>
            <p className="text-indigo-200 text-base">
              {counts.active} actif{counts.active !== 1 ? 's' : ''} · {counts.draft} brouillon{counts.draft !== 1 ? 's' : ''} · {counts.all} total
            </p>
          </div>
          <Button
            onClick={() => setEditing('new')}
            className="!bg-white !text-indigo-700 hover:!bg-indigo-50 shadow-xl"
            size="lg"
          >
            <Plus size={18} className="mr-2" />Nouveau template
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-8 -mt-6 mb-8 relative z-10">
        <div className="inline-flex bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5 gap-1">
          {(['all', 'active', 'draft', 'archived'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
            >
              {f === 'all' ? 'Tous' : STATUS_META[f].label}
              <span className={clsx(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold',
                filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 pb-12">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
              <FileText size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun template</h3>
            <p className="text-gray-400 mb-6">Créez votre premier template pour démarrer</p>
            <Button onClick={() => setEditing('new')}><Plus size={16} className="mr-2" />Créer un template</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(t => {
              const meta = STATUS_META[t.status];
              const gradient = getCoverGradient(t._id);
              return (
                <div
                  key={t._id}
                  onClick={() => setEditing(t)}
                  className="group bg-white rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Cover */}
                  <div className="relative h-40 overflow-hidden">
                    {t.theme.coverImage ? (
                      <img src={imgSrc(t.theme.coverImage)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={clsx('w-full h-full bg-gradient-to-br', gradient, 'group-hover:scale-105 transition-transform duration-500')} />
                    )}
                    {/* Overlay actions on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={e => { e.stopPropagation(); setEditing(t); }}
                        className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-indigo-50 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} className="text-indigo-600" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDuplicate(t._id); }}
                        className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-indigo-50 transition-colors"
                        title="Dupliquer"
                      >
                        <Copy size={16} className="text-indigo-600" />
                      </button>
                      {t.status === 'draft' && (
                        <button
                          onClick={e => handleStatusChange(t._id, 'active', e)}
                          className="p-2.5 bg-emerald-500 rounded-xl shadow-lg hover:bg-emerald-600 transition-colors"
                          title="Activer"
                        >
                          <CheckCircle size={16} className="text-white" />
                        </button>
                      )}
                      {t.status === 'active' && (
                        <button
                          onClick={e => handleStatusChange(t._id, 'archived', e)}
                          className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-amber-50 transition-colors"
                          title="Archiver"
                        >
                          <Archive size={16} className="text-amber-500" />
                        </button>
                      )}
                      <button
                        onClick={e => handleDelete(t._id, e)}
                        className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                    {/* Status badge */}
                    <div className={clsx('absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm', meta.bg, meta.color)}>
                      {meta.icon}<span>{meta.label}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{t.name}</h3>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Layers size={13} />{t.sections.length} section{t.sections.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Vote size={13} />{t.initialVotes} votes
                      </span>
                    </div>

                    {/* Section pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {t.sections.slice(0, 5).map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-600">
                          <span>{SECTION_ICONS[s.type] ?? '📌'}</span>
                          <span className="max-w-[80px] truncate">{s.title}</span>
                        </span>
                      ))}
                      {t.sections.length > 5 && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                          +{t.sections.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {t.status === 'active' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Zap size={11} />Prêt à utiliser
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create new card */}
            <button
              onClick={() => setEditing('new')}
              className="group border-2 border-dashed border-gray-200 rounded-3xl h-[280px] flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <Plus size={24} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-500 group-hover:text-indigo-700 transition-colors">Nouveau template</p>
                <p className="text-xs text-gray-400 mt-0.5">Créer depuis zéro</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {editing !== null && (
        <TemplateFormModal
          template={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { load(); setEditing(null); }}
        />
      )}
    </div>
  );
}
