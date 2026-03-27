'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      router.push('/');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">MockTrade</h1>
          <p className="mt-2 text-[var(--text-secondary)]">The AI Stock Market Game</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
          <h2 className="text-xl font-semibold">Welcome Back</h2>
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-accent-primary" />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Password</label>
            <input {...register('password')} type="password" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-accent-primary" />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-accent-primary py-2.5 text-sm font-medium text-white hover:bg-accent-primary/80 disabled:opacity-50">
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
          <p className="text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account? <Link href="/register" className="text-accent-primary hover:underline">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
