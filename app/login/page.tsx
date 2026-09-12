'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, KeyRound, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('from') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Authentication Failed</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="username" className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
          Username
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="username"
            type="text"
            required
            placeholder="Enter admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm outline-none transition"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
          Password
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm outline-none transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Sign In to Dashboard</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
          <p className="text-xs text-slate-400">
            Please enter your administrator credentials to access the support dashboard.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <Suspense fallback={<div className="text-center py-6 text-xs text-slate-400">Loading login form...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
