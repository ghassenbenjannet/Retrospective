import { useState } from 'react';
import { Template, Section, SectionType } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'mood', label: '😊 Ressenti / Mood' },
  { value: 'positive', label: '✅ Points positifs' },
  { value: 'negative', label: '❌ Points négatifs' },
  { value: 'brainstorming', label: '💡 Brainstorming' },
  { value: 'minigame', label: '🎮 Mini-jeu' },
  { value: 'vote', label: '🗳️ Vote' },
  { value: 'action_selection', label: '🎯 Sélection d\'actions' },
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
  const [sections, setSections] = useState<Partial<Section>[]>(template?.sections ?? []);
  const [loading, setLoading] = useState(false);

  const addSection = () => {
    setSections(prev => [...prev, {
      title: 'Nouvelle section',
      type: 'brainstorming',
      description: '',
      order: prev.length,
      allowMultipleCards: true,
      maxCardsPerUser: null,
      hasTimer: false,
      timerSeconds: null,
    }]);
  };

  const removeSection = (idx: number) => setSections(prev => prev.filter((_, i) => i !== idx));

  const updateSection = (idx: number, field: string, value: unknown) =>
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nom requis'); return; }
    if (sections.length === 0) { toast.error('Au moins une section requise'); return; }
    setLoading(true);
    try {
      const payload = { name, initialVotes, sections: sections.map((s, i) => ({ ...s, order: i })) };
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{template ? 'Modifier le template' : 'Nouveau template'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <Input label="Nom du template" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sprint Review" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votes initiaux par participant</label>
            <input type="number" min={1} max={20} value={initialVotes}
              onChange={e => setInitialVotes(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Sections</h4>
              <Button size="sm" variant="secondary" onClick={addSection}><Plus size={14} className="mr-1" />Ajouter</Button>
            </div>
            <div className="space-y-3">
              {sections.map((s, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
                    <Input
                      value={s.title ?? ''}
                      onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Titre de la section"
                    />
                    <button onClick={() => removeSection(idx)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <select
                    value={s.type}
                    onChange={e => updateSection(idx, 'type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={s.allowMultipleCards ?? true}
                        onChange={e => updateSection(idx, 'allowMultipleCards', e.target.checked)} />
                      Cartes multiples
                    </label>
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
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune section. Cliquez sur "Ajouter".</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} loading={loading}>Sauvegarder</Button>
        </div>
      </div>
    </div>
  );
}
