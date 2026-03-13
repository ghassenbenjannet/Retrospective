import { useState } from 'react';
import { AppShell, SectionContainer } from '@/components/ui';

export function CollaboratorsPage() {
  const [draft, setDraft] = useState('');
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl p-6">
        <SectionContainer title="Collaborator management" subtitle="Create managed collaborator accounts">
          <div className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="collaborator@retro.app" />
            <button className="rounded-lg bg-violet-600 px-4">Create</button>
          </div>
        </SectionContainer>
      </main>
    </AppShell>
  );
}
