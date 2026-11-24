import { useState } from 'react';
import { api } from '../api.js';

export function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@tworld.local');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('tworld_token', result.token);
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-black/10 bg-white p-14 text-ink lg:flex lg:flex-col lg:justify-between">
        <img src="/tongston-logo.webp" alt="Tongston" className="relative h-auto w-56" />
        <div className="relative max-w-xl">
          <p className="eyebrow">Module service</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05]">Content that creates value, rewards that stay transparent.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-black/55">Manage content, run AI summaries and follow every token movement from one operational view.</p>
        </div>
        <p className="text-sm text-black/40">Internal administration console</p>
      </section>
      <section className="flex min-h-screen items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <img src="/tongston-logo.webp" alt="Tongston" className="mb-12 h-auto w-48 lg:hidden" />
          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Sign in to the console</h2>
          <p className="mt-3 text-sm leading-6 text-black/55">The seeded admin account is filled in for local evaluation.</p>
          <label className="mt-8 block text-sm font-semibold">Email</label>
          <input className="field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label className="mt-5 block text-sm font-semibold">Password</label>
          <input className="field mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="mt-4 rounded-md border border-brandYellow bg-brandYellow/25 p-3 text-sm text-ink">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}
