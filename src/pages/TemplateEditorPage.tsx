import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell, SectionContainer } from '@/components/ui';
import { useAppStore } from '@/app/store';
import { TemplateSection } from '@/types/domain';

export function TemplateEditorPage() {
  const { templateId } = useParams();
  const template = useAppStore((s) => s.templates.find((t) => t.id === templateId) ?? s.templates[0]);
  const [sections, setSections] = useState<TemplateSection[]>(template.sections);
  const preview = useMemo(() => sections.map((s) => s.title).join(' → '), [sections]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const clone = [...sections];
    [clone[index], clone[target]] = [clone[target], clone[index]];
    setSections(clone);
  };

  return <AppShell><main className="mx-auto max-w-5xl p-6"><SectionContainer title="Template editor" subtitle="Configure steps and ordering"><div className="space-y-2">{sections.map((section, idx) => <div key={section.id} className="flex items-center gap-2 rounded-lg bg-slate-800 p-3"><input value={section.title} onChange={(e) => setSections((old) => old.map((o) => o.id === section.id ? { ...o, title: e.target.value } : o))} className="flex-1 rounded bg-slate-700 px-2 py-1" /><button onClick={() => move(idx, -1)}>↑</button><button onClick={() => move(idx, 1)}>↓</button></div>)}</div><p className="mt-4 text-sm text-slate-400">Preview flow: {preview}</p><button className="mt-4 rounded-lg bg-violet-600 px-4 py-2">Save template</button></SectionContainer></main></AppShell>;
}
