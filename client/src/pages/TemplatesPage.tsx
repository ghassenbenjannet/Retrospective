import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Template } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Copy, Archive, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TemplateFormModal } from '@/components/templates/TemplateFormModal';

const statusColor: Record<string, 'gray' | 'green' | 'yellow'> = {
  draft: 'yellow', active: 'green', archived: 'gray',
};

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null | 'new'>(null);

  const load = () => api.get('/templates').then(r => setTemplates(r.data));
  useEffect(() => { load(); }, []);

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/templates/${id}/duplicate`);
      toast.success('Template dupliqué');
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce template ?')) return;
    try {
      await api.delete(`/templates/${id}`);
      toast.success('Supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/templates/${id}`, { status });
      toast.success('Statut mis à jour');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
        <Button onClick={() => setEditing('new')}><Plus size={16} className="mr-2" />Nouveau template</Button>
      </div>

      {templates.length === 0 ? (
        <Card><p className="text-gray-500 text-center py-8">Aucun template. Créez-en un pour commencer.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map(t => (
            <Card key={t._id} padding={false} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.sections.length} sections · {t.initialVotes} votes</p>
                </div>
                <Badge label={t.status} color={statusColor[t.status]} />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Edit2 size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDuplicate(t._id)}><Copy size={14} /></Button>
                {t.status === 'draft' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(t._id, 'active')}>
                    <span className="text-green-600 text-xs">Activer</span>
                  </Button>
                )}
                {t.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => handleStatusChange(t._id, 'archived')}>
                    <Archive size={14} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => handleDelete(t._id)}><Trash2 size={14} className="text-red-500" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

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
