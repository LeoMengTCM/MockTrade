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
import { ImageUploader } from '@/components/shared/ImageUploader';
import { UserPlus, ArrowRight, ExternalLink } from 'lucide-react';

const schema = z.object({
  email: z.string().email('请输入正确的邮箱地址'),
  password: z.string().min(8, '密码至少需要 8 位'),
  confirmPassword: z.string(),
  username: z.string().min(2, '用户名至少 2 个字符').max(20, '用户名最多 20 个字符'),
  avatarUrl: z.string().min(1, '请上传你的专属头像'),
}).refine(d => d.password === d.confirmPassword, { message: '两次输入的密码不一致', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [linuxDoEnabled, setLinuxDoEnabled] = useState(false);
  const { register, handleSubmit, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      avatarUrl: ''
    }
  });

  useEffect(() => {
    api.get('/auth/linuxdo/status').then(r => setLinuxDoEnabled(r.data?.enabled === true)).catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        username: data.username,
        avatarUrl: data.avatarUrl,
      });
      setAuth(res.data.user, res.data.token);
      router.push('/');
    } catch (e: any) {
      const message = Array.isArray(e.response?.data?.message) ? e.response.data.message[0] : e.response?.data?.message;
      setError(translateApiErrorMessage(message, '注册失败，请稍后重试'));
    }
  };

  const handleAvatarUpload = (url: string) => {
    setValue('avatarUrl', url);
    trigger('avatarUrl'); // 主动消除 Zod 的错误提示
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-4">
      {/* Background Decorative Bloom */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-soft mb-4">
            <UserPlus size={28} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">注册账号</h1>
          <p className="mt-2 text-[var(--text-secondary)]">创建账号后就可以开始交易</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl p-8 shadow-soft"
        >
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 头像上传核心模块 */}
          <div className="flex flex-col items-center justify-center pt-2 pb-4">
            <ImageUploader onUploadSuccess={handleAvatarUpload} />
            {/* hidden field is needed for react-hook-form to register properly although we set value via setValue */}
            <input type="hidden" {...register('avatarUrl')} />
            {errors.avatarUrl && <p className="mt-2 text-xs font-semibold text-red-400">{errors.avatarUrl.message}</p>}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">邮箱</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-accent-primary focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-accent-primary/10"
              />
              {errors.email && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">昵称</label>
              <input
                {...register('username')}
                placeholder="例如：狂奔的韭菜"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-accent-primary focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-accent-primary/10"
              />
              {errors.username && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.username.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">密码</label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-4 py-3 text-sm outline-none transition-all focus:border-accent-primary focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-accent-primary/10"
                />
                {errors.password && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 ml-1">确认密码</label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]/50 px-4 py-3 text-sm outline-none transition-all focus:border-accent-primary focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-accent-primary/10"
                />
                {errors.confirmPassword && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-primary/90 focus:ring-4 focus:ring-accent-primary/30 disabled:opacity-50"
            >
              {isSubmitting ? '注册中...' : '注册并进入市场'}
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
            已经有账号？
            <Link href="/login" className="text-accent-primary underline decoration-transparent underline-offset-4 transition-colors hover:decoration-accent-primary">
              去登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
