import { useState } from 'react';
import { Template, User } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  templates: Template[];
  users: User[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateSessionModal({ templates, users, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?._id ?? '');
  const [participantIds, setParticipantIds] = useState<string[]>(users.map(u => u.id));
  const [maxActions, setMaxActions] = useState(3);
  const [loading, setLoading] = useState(false);

  const toggleParticipant = (id: string) =>
    setParticipantIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim() || !templateId) { toast.error('Nom et template requis'); return; }
    if (participantIds.length === 0) { toast.error('Au moins un participant requis'); return; }
    setLoading(true);
    try {
      await api.post('/sessions', { name, templateId, participantIds, maxActions });
      toast.success('Session créée');
      onCreated();
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Nouvelle session</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <Input label="Nom de la session" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sprint 42 Retro" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={participantIds.includes(u.id)}
                    onChange={() => toggleParticipant(u.id)} />
                  <span>{u.name}</span>
                  <span className="text-gray-400 text-xs">({u.role})</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre max d'actions</label>
            <input type="number" min={1} max={10} value={maxActions}
              onChange={e => setMaxActions(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleCreate} loading={loading}>Créer</Button>
        </div>
      </div>
    </div>
  );
}
