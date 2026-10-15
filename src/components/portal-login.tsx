'use client';

import { FormEvent, useState } from 'react';
import { Building2, LockKeyhole } from 'lucide-react';

type PortalLoginProps = {
  onAuthenticated: () => void;
};

export default function PortalLogin({ onAuthenticated }: PortalLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError('Access could not be verified. Check your email and password.');
        return;
      }
      onAuthenticated();
    } catch {
      setError('Unable to contact the secure portal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4ede3] px-5 py-10 flex items-center justify-center text-[#1c1a17]">
      <section className="w-full max-w-md rounded-3xl border border-[#42382c]/10 bg-white p-8 shadow-xl shadow-[#42382c]/10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9b6843] text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">ARC 11 ARCHITECT</h1>
            <p className="text-xs uppercase tracking-widest text-[#9b6843]">Secure WhatsApp Suite</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-[#f4ede3] p-4 text-sm text-[#6b645c]">
          <div className="mb-1 flex items-center gap-2 font-semibold text-[#1c1a17]"><LockKeyhole className="h-4 w-4" /> Restricted access</div>
          Sign in with your authorised team account.
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">Team email
            <input className="mt-1.5 w-full rounded-xl border border-[#42382c]/15 px-3 py-2.5 outline-none focus:border-[#9b6843]" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block text-sm font-medium">Password
            <input className="mt-1.5 w-full rounded-xl border border-[#42382c]/15 px-3 py-2.5 outline-none focus:border-[#9b6843]" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="w-full rounded-xl bg-[#9b6843] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#835534] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Verifying secure access…' : 'Open secure portal'}
          </button>
        </form>
      </section>
    </main>
  );
}
