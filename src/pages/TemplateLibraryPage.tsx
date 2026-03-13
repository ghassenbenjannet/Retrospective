import { Link } from 'react-router-dom';
import { AppShell, SectionContainer, ThemeBadge } from '@/components/ui';
import { useAppStore } from '@/app/store';

export function TemplateLibraryPage() {
  const templates = useAppStore((s) => s.templates);
  return <AppShell><main className="mx-auto max-w-5xl p-6"><SectionContainer title="Template library" subtitle="Built-in and custom templates"><div className="grid gap-3 md:grid-cols-2">{templates.map((t) => <div key={t.id} className="rounded-xl bg-slate-800 p-4"><div className="flex justify-between"><h3>{t.title}</h3><ThemeBadge name={t.themeId} /></div><p className="mt-1 text-xs text-slate-400">{t.sections.length} guided sections</p><Link className="mt-3 inline-block text-sm text-violet-300" to={`/templates/edit/${t.id}`}>Edit template</Link></div>)}</div></SectionContainer></main></AppShell>;
}
