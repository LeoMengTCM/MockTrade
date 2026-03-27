'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const PRESET_AVATARS = [
  '/avatars/1.svg', '/avatars/2.svg', '/avatars/3.svg', '/avatars/4.svg',
  '/avatars/5.svg', '/avatars/6.svg', '/avatars/7.svg', '/avatars/8.svg',
];

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(2, 'At least 2 characters').max(20, 'Max 20 characters'),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await api.post('/auth/register', { email: data.email, password: data.password, username: data.username, avatarUrl });
      setAuth(res.data.user, res.data.token);
      router.push('/');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">MockTrade</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Join the Market</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
          <h2 className="text-xl font-semibold">Create Account</h2>
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
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Confirm Password</label>
            <input {...register('confirmPassword')} type="password" className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-accent-primary" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Username</label>
            <input {...register('username')} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-accent-primary" />
            {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AVATARS.map((url, i) => (
                <button key={i} type="button" onClick={() => setAvatarUrl(url)}
                  className={`h-10 w-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-sm font-bold border-2 ${avatarUrl === url ? 'border-accent-primary' : 'border-transparent'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-accent-primary py-2.5 text-sm font-medium text-white hover:bg-accent-primary/80 disabled:opacity-50">
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-[var(--text-muted)]">
            Already have an account? <Link href="/login" className="text-accent-primary hover:underline">Log In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
