'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { translateApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth-store';
import { LogIn, ArrowRight, ExternalLink } from 'lucide-react';

const schema = z.object({
  email: z.string().email('请输入正确的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [linuxDoEnabled, setLinuxDoEnabled] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    api.get('/auth/linuxdo/status').then(r => setLinuxDoEnabled(r.data?.enabled === true)).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      router.push('/');
    } catch (e: any) {
      const message = Array.isArray(e.response?.data?.message) ? e.response.data.message[0] : e.response?.data?.message;
      setError(translateApiErrorMessage(message, '登录失败，请稍后重试'));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-4">
      {/* Background Decorative Bloom */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-soft mb-4">
            <LogIn size={28} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">MockTrade</h1>
          <p className="mt-2 text-[var(--text-secondary)]">AI 驱动的模拟股市游戏</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl p-8 shadow-soft">
          <h2 className="text-xl font-semibold mb-2">欢迎回来</h2>
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">邮箱</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-accent-primary focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-accent-primary/10" />
              {errors.email && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">密码</label>
              <input {...register('password')} type="password" placeholder="••••••••" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-4 py-3 text-sm outline-none transition-all focus:border-accent-primary focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-accent-primary/10" />
              {errors.password && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isSubmitting} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-primary/90 focus:ring-4 focus:ring-accent-primary/30 disabled:opacity-50">
              {isSubmitting ? '登录中...' : '登录'}
              {!isSubmitting && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </div>

          {linuxDoEnabled && (
            <>
              <div className="relative flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-[var(--border-color)]" />
                <span className="text-xs text-[var(--text-muted)]">或</span>
                <div className="h-px flex-1 bg-[var(--border-color)]" />
              </div>
              <a
                href="/api/auth/linuxdo"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] hover:border-[var(--text-muted)]"
              >
                <ExternalLink size={16} />
                使用 Linux DO 登录
              </a>
            </>
          )}

          <p className="pt-2 text-center text-sm font-medium text-[var(--text-muted)]">
            还没有账号？
            {' '}
            <Link href="/register" className="text-accent-primary underline decoration-transparent underline-offset-4 transition-colors hover:decoration-accent-primary">立即注册</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
