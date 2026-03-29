'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { resolveAssetUrl } from '@/lib/asset-url';

interface UserAvatarProps {
  username?: string | null;
  avatarUrl?: string | null;
  className?: string;
  textClassName?: string;
}

export function UserAvatar({
  username,
  avatarUrl,
  className,
  textClassName,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const resolvedAvatarUrl = useMemo(() => {
    if (imageFailed) return '';
    return resolveAssetUrl(avatarUrl);
  }, [avatarUrl, imageFailed]);

  const initial = (username?.trim()?.slice(0, 1) || '?').toUpperCase();

  return (
    <div className={cn(
      'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-primary/20 text-[var(--text-primary)]',
      className,
    )}>
      {resolvedAvatarUrl ? (
        <img
          src={resolvedAvatarUrl}
          alt={username ? `${username} 的头像` : '用户头像'}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={cn('font-medium', textClassName)}>{initial}</span>
      )}
    </div>
  );
}
