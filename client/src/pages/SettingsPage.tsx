import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Mail, UserIcon, Layers, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const SECTION_TYPE_LABELS: Record<string, string> = {
  brainstorming: 'Brainstorming',
  positive:      'Points positifs',
  negative:      'Points négatifs / à améliorer',
  mood:          'Humeur de l\'équipe',
  vote:          'Votes',
  action_selection: 'Sélection des actions',
};

const ALL_SECTION_TYPES = Object.keys(SECTION_TYPE_LABELS);

interface EmailSettings {
  defaultSenderUserId: string | null;
  sectionTypesToInclude: string[];
}

export function SettingsPage() {
  const { user: me } = useAuthStore();
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<EmailSettings>({
    defaultSenderUserId: null,
    sectionTypesToInclude: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data));
    api.get('/users').then(r => setWorkspaceUsers(r.data));
  }, []);

  const toggleSection = (type: string) => {
    setSettings(prev => ({
      ...prev,
      sectionTypesToInclude: prev.sectionTypesToInclude.includes(type)
        ? prev.sectionTypesToInclude.filter(t => t !== type)
        : [...prev.sectionTypesToInclude, type],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings', settings);
      toast.success('Paramètres sauvegardés');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (me?.role !== 'admin') {
    return (
      <div className="p-8 text-gray-500">
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres</h1>
      <p className="text-gray-500 text-sm mb-8">Configuration des envois de récapitulatif par email</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-8">

        {/* ── Expéditeur par défaut ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <UserIcon size={15} className="text-indigo-500" />
            Expéditeur par défaut
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Utilisé lors de l'envoi du récap depuis la page de session. Peut être remplacé lors de chaque envoi.
          </p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {/* None option */}
            <label
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-all text-sm',
                settings.defaultSenderUserId === null
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-500',
              )}
            >
              <input
                type="radio"
                name="defaultSender"
                checked={settings.defaultSenderUserId === null}
                onChange={() => setSettings(p => ({ ...p, defaultSenderUserId: null }))}
                className="accent-indigo-600"
              />
              <span className="italic">Aucun (admin courant)</span>
            </label>
            {workspaceUsers.map(u => (
              <label
                key={u.id}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-all text-sm',
                  settings.defaultSenderUserId === u.id
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700',
                )}
              >
                <input
                  type="radio"
                  name="defaultSender"
                  value={u.id}
                  checked={settings.defaultSenderUserId === u.id}
                  onChange={() => setSettings(p => ({ ...p, defaultSenderUserId: u.id }))}
                  className="accent-indigo-600"
                />
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  {u.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{u.name}</span>
                  <span className="text-[10px] text-gray-400 truncate block">{u.email}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* ── Sections à inclure ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Layers size={15} className="text-indigo-500" />
            Sections à inclure dans le mail de récap
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Les contributions (cartes) de ces types de sections seront ajoutées dans le corps de l'email.
            Les destinataires sont les invités de la session.
          </p>
          <div className="space-y-2">
            {ALL_SECTION_TYPES.map(type => (
              <label
                key={type}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-all text-sm select-none',
                  settings.sectionTypesToInclude.includes(type)
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700',
                )}
              >
                <input
                  type="checkbox"
                  checked={settings.sectionTypesToInclude.includes(type)}
                  onChange={() => toggleSection(type)}
                  className="accent-indigo-600 w-4 h-4 flex-shrink-0"
                />
                <span className="font-medium">{SECTION_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
            <Mail size={11} />
            {settings.sectionTypesToInclude.length === 0
              ? 'Seul le tableau des actions sera inclus dans le mail.'
              : `${settings.sectionTypesToInclude.length} type(s) de section inclus dans le mail.`}
          </p>
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving
            ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Sauvegarde…</>
            : <><Save size={14} /> Sauvegarder</>
          }
        </button>
      </div>
    </div>
  );
}
