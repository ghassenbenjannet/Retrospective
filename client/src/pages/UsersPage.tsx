import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, X, Pencil, Shield, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

type FormState = { name: string; email: string; password: string; role: string };
const emptyForm: FormState = { name: '', email: '', password: '', role: 'collaborator' };

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditUser(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nom et email requis'); return; }
    if (!editUser && !form.password) { toast.error('Mot de passe requis'); return; }
    setLoading(true);
    try {
      if (editUser) {
        await api.patch(`/users/${editUser.id}`, form);
        toast.success('Utilisateur mis à jour');
      } else {
        await api.post('/users', form);
        toast.success('Utilisateur créé');
      }
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Utilisateur supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-sm text-gray-500 mt-1">{users.length} membre{users.length > 1 ? 's' : ''} dans l'équipe</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />Ajouter
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-gray-900 text-lg">
                {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h3>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Nom complet" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont" />
              <Input label="Email" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jean@exemple.com" />
              <Input
                label={editUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder={editUser ? '••••••••' : 'Minimum 6 caractères'} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
                <div className="flex gap-3">
                  {[
                    { value: 'collaborator', label: 'Collaborateur', icon: <UserIcon size={14} /> },
                    { value: 'admin', label: 'Admin', icon: <Shield size={14} /> },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(p => ({ ...p, role: opt.value }))}
                      className={clsx(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                        form.role === opt.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <Button variant="secondary" onClick={closeForm}>Annuler</Button>
              <Button onClick={handleSave} loading={loading}>
                {editUser ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                u.role === 'admin' ? 'bg-purple-500' : 'bg-indigo-500'
              )}>
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={clsx(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                u.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-indigo-100 text-indigo-700'
              )}>
                {u.role === 'admin' ? <Shield size={11} /> : <UserIcon size={11} />}
                {u.role === 'admin' ? 'Admin' : 'Collaborateur'}
              </span>
              <button onClick={() => openEdit(u)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(u.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <UserIcon size={40} className="mx-auto mb-3 opacity-40" />
            <p>Aucun utilisateur.</p>
          </div>
        )}
      </div>
    </div>
  );
}
