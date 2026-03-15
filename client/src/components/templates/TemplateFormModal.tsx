import { useState } from 'react';
import { Template, Section, SectionType, SectionOption } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { X, Plus, Trash2, GripVertical, LayoutList, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'mood', label: '😊 Ressenti / Mood' },
  { value: 'positive', label: '✅ Points positifs' },
  { value: 'negative', label: '❌ Points négatifs' },
  { value: 'brainstorming', label: '💡 Brainstorming' },
  { value: 'minigame', label: '🎮 Jeu de cartes' },
  { value: 'vote', label: '🗳️ Vote' },
  { value: 'action_selection', label: "🎯 Sélection d'actions" },
  { value: 'action_review', label: '📋 Revue des actions' },
];

interface Props {
  template: Template | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateFormModal({ template, onClose, onSaved }: Props) {
  const [name, setName] = useState(template?.name ?? '');
  const [initialVotes, setInitialVotes] = useState(template?.initialVotes ?? 5);
  const [coverImage, setCoverImage] = useState(template?.theme.coverImage ?? '');
  const [displayMode, setDisplayMode] = useState<'sections' | 'onepage'>(template?.displayMode ?? 'sections');
  const [sections, setSections] = useState<Partial<Section>[]>(template?.sections ?? []);
  const [loading, setLoading] = useState(false);

  const addSection = () => {
    setSections(prev => [...prev, {
      title: 'Nouvelle section',
      type: 'brainstorming',
      description: '',
      order: prev.length,
      imageUrl: null,
      allowMultipleCards: true,
      maxCardsPerUser: null,
      hasTimer: false,
      timerSeconds: null,
      options: [],
    }]);
  };

  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx));
  const updateSection = (idx: number, field: string, value: unknown) =>
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const addOption = (idx: number) =>
    setSections(prev => prev.map((s, i) => i === idx
      ? { ...s, options: [...(s.options ?? []), { title: '', imageUrl: '', answer: '' }] }
      : s));

  const updateOption = (sIdx: number, oIdx: number, field: keyof SectionOption, value: string) =>
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, options: (s.options ?? []).map((o, j) => j === oIdx ? { ...o, [field]: value } : o) }
      : s));

  const removeOption = (sIdx: number, oIdx: number) =>
    setSections(prev => prev.map((s, i) => i === sIdx
      ? { ...s, options: (s.options ?? []).filter((_, j) => j !== oIdx) }
      : s));

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nom requis'); return; }
    if (sections.length === 0) { toast.error('Au moins une section requise'); return; }
    setLoading(true);
    try {
      const payload = {
        name, initialVotes, displayMode,
        theme: { primaryColor: '#6366f1', coverImage: coverImage || null },
        sections: sections.map((s, i) => ({ ...s, order: i })),
      };
      if (template) {
        await api.put(`/templates/${template._id}`, payload);
      } else {
        await api.post('/templates', payload);
      }
      toast.success(template ? 'Template mis à jour' : 'Template créé');
      onSaved();
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setLoading(false); }
  };

  const isMood = (type?: SectionType) => type === 'mood';
  const isGame = (type?: SectionType) => type === 'minigame';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold">{template ? 'Modifier le template' : 'Nouveau template'}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-6">
          <Input label="Nom du template" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sprint Review" />

          {/* Cover image */}
          <ImageUploader
            label="Image de couverture"
            value={coverImage}
            onChange={setCoverImage}
            onClear={() => setCoverImage('')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votes initiaux par participant</label>
            <input type="number" min={1} max={20} value={initialVotes}
              onChange={e => setInitialVotes(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Display Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode d'affichage</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDisplayMode('sections')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  displayMode === 'sections'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <LayoutList size={18} />
                <div className="text-left">
                  <div className="font-semibold">Section par section</div>
                  <div className="text-xs text-gray-400 font-normal">Navigation étape par étape</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('onepage')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  displayMode === 'onepage'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Layout size={18} />
                <div className="text-left">
                  <div className="font-semibold">Page unique</div>
                  <div className="text-xs text-gray-400 font-normal">Toutes sections visibles</div>
                </div>
              </button>
            </div>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Sections</h4>
              <Button size="sm" variant="secondary" onClick={addSection}><Plus size={14} className="mr-1" />Ajouter</Button>
            </div>
            <div className="space-y-4">
              {sections.map((s, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
                    <Input value={s.title ?? ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Titre de la section" />
                    <button onClick={() => removeSection(idx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <select value={s.type} onChange={e => updateSection(idx, 'type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>

                  {/* Section header image */}
                  {!isGame(s.type as SectionType) && (
                    <ImageUploader
                      label="Image d'en-tête de section"
                      value={s.imageUrl ?? ''}
                      onChange={v => updateSection(idx, 'imageUrl', v)}
                      onClear={() => updateSection(idx, 'imageUrl', null)}
                      maxWidthPx={900}
                    />
                  )}

                  {/* Mood image options */}
                  {isMood(s.type as SectionType) && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700">Options image (les collab choisissent)</p>
                        <Button size="sm" variant="ghost" onClick={() => addOption(idx)}>
                          <Plus size={12} className="mr-1" />Option
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(s.options ?? []).map((opt, oIdx) => (
                          <div key={oIdx} className="bg-gray-50 rounded-lg p-2 space-y-1.5 relative">
                            <button onClick={() => removeOption(idx, oIdx)}
                              className="absolute top-1 right-1 text-red-400 hover:text-red-600 z-10">
                              <X size={12} />
                            </button>
                            <input type="text" value={opt.title}
                              onChange={e => updateOption(idx, oIdx, 'title', e.target.value)}
                              placeholder="Titre (ex: Très bien 😊)"
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs pr-6" />
                            <ImageUploader
                              value={opt.imageUrl}
                              onChange={v => updateOption(idx, oIdx, 'imageUrl', v)}
                              onClear={() => updateOption(idx, oIdx, 'imageUrl', '')}
                              maxWidthPx={600}
                              quality={0.78}
                            />
                          </div>
                        ))}
                      </div>
                      {(s.options ?? []).length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          Ajoutez des images parmi lesquelles les collaborateurs pourront choisir
                        </p>
                      )}
                    </div>
                  )}

                  {/* Game cards */}
                  {isGame(s.type as SectionType) && (
                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      {/* Questions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-700">Cartes du jeu (max 6 recommandé)</p>
                          <Button size="sm" variant="ghost" onClick={() => addOption(idx)}
                            disabled={(s.options ?? []).length >= 6}>
                            <Plus size={12} className="mr-1" />Carte
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(s.options ?? []).map((opt, oIdx) => (
                            <div key={oIdx} className="bg-gray-50 rounded-lg p-3 space-y-2 relative">
                              <button onClick={() => removeOption(idx, oIdx)}
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                                <X size={12} />
                              </button>
                              <div className="flex items-center gap-2 pr-6">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                  {oIdx + 1}
                                </span>
                                <input type="text" value={opt.title}
                                  onChange={e => updateOption(idx, oIdx, 'title', e.target.value)}
                                  placeholder="Question..."
                                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" />
                              </div>
                              <div className="flex items-center gap-2 pl-7">
                                <span className="text-xs text-gray-500">Réponse:</span>
                                <input type="text" value={opt.answer ?? ''}
                                  onChange={e => updateOption(idx, oIdx, 'answer', e.target.value)}
                                  placeholder="Réponse..."
                                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" />
                              </div>
                            </div>
                          ))}
                        </div>
                        {(s.options ?? []).length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">
                            Ajoutez jusqu'à 6 cartes question/réponse
                          </p>
                        )}
                      </div>
                      {/* Win/Lose config */}
                      <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-indigo-700">Conséquences Gagné / Perdu</p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-16">Gagné :</span>
                          <span className="text-xs text-green-700 font-medium">+</span>
                          <input type="number" min={0} max={5}
                            value={(s as any).gameWinVotes ?? 1}
                            onChange={e => updateSection(idx, 'gameWinVotes', Number(e.target.value))}
                            className="w-14 border border-gray-200 rounded px-2 py-1 text-xs" />
                          <span className="text-xs text-gray-500">vote(s)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-16">Perdu :</span>
                          <select
                            value={(s as any).gameLoseEffect ?? 'vote'}
                            onChange={e => updateSection(idx, 'gameLoseEffect', e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-xs">
                            <option value="vote">Perdre des votes</option>
                            <option value="gage">Gage</option>
                          </select>
                          {((s as any).gameLoseEffect ?? 'vote') === 'vote' ? (
                            <>
                              <span className="text-xs text-red-600 font-medium">−</span>
                              <input type="number" min={0} max={5}
                                value={(s as any).gameLoseVotes ?? 1}
                                onChange={e => updateSection(idx, 'gameLoseVotes', Number(e.target.value))}
                                className="w-14 border border-gray-200 rounded px-2 py-1 text-xs" />
                              <span className="text-xs text-gray-500">vote(s)</span>
                            </>
                          ) : (
                            <input type="text"
                              value={(s as any).gameLoseGage ?? ''}
                              onChange={e => updateSection(idx, 'gameLoseGage', e.target.value)}
                              placeholder="Ex: Faire 10 pompes..."
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {!isMood(s.type as SectionType) && !isGame(s.type as SectionType) && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={s.allowMultipleCards ?? true}
                          onChange={e => updateSection(idx, 'allowMultipleCards', e.target.checked)} />
                        Cartes multiples
                      </label>
                    )}
                    {!isGame(s.type as SectionType) && (
                      <>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={s.hasTimer ?? false}
                            onChange={e => updateSection(idx, 'hasTimer', e.target.checked)} />
                          Timer
                        </label>
                        {s.hasTimer && (
                          <input type="number" min={30} max={600} value={s.timerSeconds ?? 120}
                            onChange={e => updateSection(idx, 'timerSeconds', Number(e.target.value))}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune section. Cliquez sur "Ajouter".</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} loading={loading}>Sauvegarder</Button>
        </div>
      </div>
    </div>
  );
}
