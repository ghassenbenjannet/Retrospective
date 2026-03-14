import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'collaborator' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Tous les champs sont requis'); return; }
    setLoading(true);
    try {
      await api.post('/users', form);
      toast.success('Utilisateur créé');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'collaborator' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
        <Button onClick={() => setShowForm(true)}><Plus size={16} className="mr-2" />Ajouter</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Nouvel utilisateur</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <Input label="Mot de passe" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="collaborator">Collaborateur</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleCreate} loading={loading}>Créer</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {users.map(u => (
          <Card key={u.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{u.name}</p>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge label={u.role} color={u.role === 'admin' ? 'purple' : 'blue'} />
              <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                <Trash2 size={14} className="text-red-400" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
