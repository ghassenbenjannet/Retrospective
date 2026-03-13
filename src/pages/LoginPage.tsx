import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/ui';

export function LoginPage() {
  const [email, setEmail] = useState('admin@retro.app');
  const [password, setPassword] = useState('password');
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email && password) navigate('/dashboard');
  };

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <form onSubmit={onSubmit} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 p-8">
          <h1 className="text-2xl font-bold">Retrospective Live</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in with your workspace account.</p>
          <div className="mt-6 space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg bg-slate-800 px-3 py-2" placeholder="Password" />
          </div>
          <button className="mt-4 w-full rounded-lg bg-violet-600 py-2 font-semibold">Login</button>
        </form>
      </div>
    </AppShell>
  );
}
