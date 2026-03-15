import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Session, Section, SectionOption } from '@/types';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { imgSrc } from '@/lib/imageUrl';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ChevronUp, ChevronDown, Check, Loader2, ImageIcon,
  Smile, CheckSquare, MessageSquare, PenLine, Vote, Layers, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Snapshot = Session['templateSnapshot'];
type SaveState = 'saved' | 'unsaved' | 'saving';

// ─── Section type metadata ────────────────────────────────────────────────────
const SECTION_TYPE_LABELS: Record<string, string> = {
  mood: 'Ressenti', positive: 'Points positifs', negative: 'Points négatifs',
  brainstorming: 'Brainstorming', vote: 'Vote', minigame: 'Mini-jeu',
  action_selection: 'Sélection d\'actions', action_review: 'Suivi d\'actions',
};
const SECTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  mood: <Smile size={12} />, positive: <CheckSquare size={12} />, negative: <MessageSquare size={12} />,
  brainstorming: <PenLine size={12} />, vote: <Vote size={12} />,
  action_selection: <Layers size={12} />, action_review: <Layers size={12} />,
};

// ─── Inline image editor ──────────────────────────────────────────────────────
function ImageEditZone({
  url, onUpdate, onClear, hint, aspectClass = 'h-40', placeholder = 'Ajouter une image',
}: {
  url: string | null;
  onUpdate: (v: string) => void;
  onClear: () => void;
  hint?: string;
  aspectClass?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {url ? (
        <div className={clsx('relative group rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center', aspectClass)}>
          <img src={imgSrc(url)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={() => setOpen(v => !v)}
              className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow hover:bg-gray-100 transition-colors"
            >
              Changer l'image
            </button>
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="bg-red-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow hover:bg-red-700 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          className={clsx(
            'w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-indigo-500',
            aspectClass,
          )}
        >
          <ImageIcon size={16} />{placeholder}
        </button>
      )}
      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Image</p>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
              <X size={13} className="text-gray-400" />
            </button>
          </div>
          <ImageUploader
            value={url ?? ''}
            onChange={v => { onUpdate(v); if (v) setOpen(false); }}
            onClear={() => { onClear(); setOpen(false); }}
            hint={hint}
          />
        </div>
      )}
    </div>
  );
}

// ─── Auto-resize textarea ─────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={clsx('resize-none overflow-hidden', className)}
    />
  );
}

// ─── Main planner page ────────────────────────────────────────────────────────
export function SessionPlannerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => {
      const s: Session = r.data;
      setSession(s);
      setName(s.name);
      setSnapshot(s.templateSnapshot);
    });
  }, [id]);

  // ── Autosave ────────────────────────────────────────────────────────────────
  const scheduleSave = useCallback((newName: string, newSnapshot: Snapshot) => {
    setSaveState('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await api.patch(`/sessions/${id}/snapshot`, { name: newName, templateSnapshot: newSnapshot });
        setSaveState('saved');
      } catch {
        toast.error('Erreur lors de la sauvegarde');
        setSaveState('unsaved');
      }
    }, 700);
  }, [id]);

  const updateName = (v: string) => {
    setName(v);
    if (snapshot) scheduleSave(v, snapshot);
  };

  const updateSnapshot = useCallback((updater: (s: Snapshot) => Snapshot) => {
    setSnapshot(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      scheduleSave(name, next);
      return next;
    });
  }, [name, scheduleSave]);

  const updateSection = (sectionId: string, field: keyof Section, value: any) =>
    updateSnapshot(s => ({
      ...s,
      sections: s.sections.map(sec => sec._id === sectionId ? { ...sec, [field]: value } : sec),
    }));

  const updateOption = (sectionId: string, optIdx: number, field: keyof SectionOption, value: string) =>
    updateSnapshot(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec._id === sectionId
          ? { ...sec, options: sec.options.map((opt, i) => i === optIdx ? { ...opt, [field]: value } : opt) }
          : sec
      ),
    }));

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (!snapshot || target < 0 || target >= snapshot.sections.length) return;
    updateSnapshot(s => {
      const sections = [...s.sections];
      [sections[idx], sections[target]] = [sections[target], sections[idx]];
      return { ...s, sections };
    });
  };

  const openLobby = async () => {
    try {
      // Flush any pending save first
      clearTimeout(saveTimer.current);
      await api.patch(`/sessions/${id}/snapshot`, { name, templateSnapshot: snapshot });
      await api.patch(`/sessions/${id}/status`, { status: 'lobby' });
      toast.success('Lobby ouvert !');
      navigate('/sessions');
    } catch {
      toast.error('Erreur');
    }
  };

  if (!session || !snapshot) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  );

  const editable = ['draft', 'planned', 'lobby'].includes(session.status);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky top bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link to="/sessions" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-600 font-medium truncate max-w-xs">{name}</span>

          <div className="flex-1" />

          {/* Save state */}
          <div className={clsx(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all',
            saveState === 'saved' && 'text-emerald-700 bg-emerald-50',
            saveState === 'saving' && 'text-indigo-600 bg-indigo-50',
            saveState === 'unsaved' && 'text-amber-600 bg-amber-50',
          )}>
            {saveState === 'saving' && <Loader2 size={11} className="animate-spin" />}
            {saveState === 'saved' && <Check size={11} />}
            {saveState === 'saved' ? 'Sauvegardé' : saveState === 'saving' ? 'Sauvegarde…' : 'Modifications en attente'}
          </div>

          {editable && (
            <button
              onClick={openLobby}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Ouvrir le lobby →
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Cover image ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden relative bg-gray-900">
          <ImageEditZone
            url={snapshot.theme.coverImage}
            onUpdate={v => updateSnapshot(s => ({ ...s, theme: { ...s.theme, coverImage: v } }))}
            onClear={() => updateSnapshot(s => ({ ...s, theme: { ...s.theme, coverImage: null } }))}
            hint="Recommandé : 1600 × 400 px (format paysage large)"
            aspectClass="h-44"
            placeholder="Ajouter une image de couverture"
          />
          {/* Session name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
          {snapshot.theme.coverImage && (
            <div className="absolute bottom-3 left-5 right-5">
              <input
                value={name}
                onChange={e => updateName(e.target.value)}
                placeholder="Nom de la session"
                className="w-full bg-transparent text-white text-2xl font-bold outline-none placeholder-white/40 border-b border-transparent focus:border-white/50 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Session name (when no cover) */}
        {!snapshot.theme.coverImage && (
          <input
            value={name}
            onChange={e => updateName(e.target.value)}
            placeholder="Nom de la session"
            className="w-full text-3xl font-bold text-gray-900 outline-none bg-transparent border-b-2 border-transparent focus:border-indigo-300 transition-colors pb-1"
          />
        )}

        {/* ── Settings row ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Mode d'affichage</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
              {(['sections', 'onepage'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateSnapshot(s => ({ ...s, displayMode: mode }))}
                  className={clsx(
                    'px-3 py-1.5 transition-colors',
                    snapshot.displayMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50',
                    mode === 'onepage' && 'border-l border-gray-200',
                  )}
                >
                  {mode === 'sections' ? 'Section par section' : 'Page unique'}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {snapshot.sections.length} section{snapshot.sections.length > 1 ? 's' : ''} · {snapshot.initialVotes} votes initiaux
          </div>
        </div>

        {/* ── Sections ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {snapshot.sections.map((section, idx) => (
            <SectionBlock
              key={section._id}
              section={section}
              idx={idx}
              total={snapshot.sections.length}
              onMove={dir => moveSection(idx, dir)}
              onUpdateField={(field, value) => updateSection(section._id, field, value)}
              onUpdateOption={(optIdx, field, value) => updateOption(section._id, optIdx, field, value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────
function SectionBlock({
  section, idx, total, onMove, onUpdateField, onUpdateOption,
}: {
  section: Section;
  idx: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onUpdateField: (field: keyof Section, value: any) => void;
  onUpdateOption: (optIdx: number, field: keyof SectionOption, value: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
      {/* Section image */}
      {section.imageUrl !== undefined && (
        <div className={section.imageUrl ? '' : 'px-6 pt-5'}>
          <ImageEditZone
            url={section.imageUrl ?? null}
            onUpdate={v => onUpdateField('imageUrl', v)}
            onClear={() => onUpdateField('imageUrl', null)}
            hint="Recommandé : 800 × 300 px"
            aspectClass={section.imageUrl ? 'h-36' : 'h-14'}
            placeholder="Ajouter une image d'en-tête"
          />
        </div>
      )}

      <div className="px-6 py-5">
        {/* Row: reorder + type badge + title */}
        <div className="flex items-start gap-3 mb-2">
          {/* Reorder controls */}
          <div className="flex flex-col gap-0.5 pt-0.5 flex-shrink-0">
            <button
              onClick={() => onMove(-1)}
              disabled={idx === 0}
              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors text-gray-400"
            >
              <ChevronUp size={15} />
            </button>
            <button
              onClick={() => onMove(1)}
              disabled={idx === total - 1}
              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 transition-colors text-gray-400"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          {/* Type badge */}
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 mt-1 flex-shrink-0">
            {SECTION_TYPE_ICONS[section.type]}
            {SECTION_TYPE_LABELS[section.type] ?? section.type}
          </span>

          {/* Title — inline editable */}
          <input
            value={section.title}
            onChange={e => onUpdateField('title', e.target.value)}
            placeholder="Titre de la section"
            className="flex-1 text-lg font-bold text-gray-900 bg-transparent outline-none px-2 py-0.5 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors -ml-1"
          />
        </div>

        {/* Description */}
        <div className="ml-[3.25rem]">
          <AutoTextarea
            value={section.description ?? ''}
            onChange={v => onUpdateField('description', v)}
            placeholder="Description (optionnelle)…"
            className="w-full text-sm text-gray-500 bg-transparent outline-none px-2 py-0.5 rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors -ml-2 placeholder-gray-300"
          />
        </div>

        {/* Mood options */}
        {section.type === 'mood' && section.options.length > 0 && (
          <div className="ml-[3.25rem] mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Options de ressenti</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {section.options.map((opt, optIdx) => (
                <div key={optIdx} className="rounded-xl border border-gray-200 overflow-visible bg-gray-50">
                  <ImageEditZone
                    url={opt.imageUrl || null}
                    onUpdate={v => onUpdateOption(optIdx, 'imageUrl', v)}
                    onClear={() => onUpdateOption(optIdx, 'imageUrl', '')}
                    hint="Recommandé : 400 × 400 px (carré)"
                    aspectClass="h-24"
                    placeholder="Image"
                  />
                  <div className="px-2 py-1.5">
                    <input
                      value={opt.title}
                      onChange={e => onUpdateOption(optIdx, 'title', e.target.value)}
                      placeholder="Option"
                      className="w-full text-xs font-semibold text-gray-700 bg-transparent outline-none text-center hover:bg-white focus:bg-white rounded px-1 py-0.5 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
