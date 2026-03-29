import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { resolveAssetUrl } from '@/lib/asset-url';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  className?: string;
  defaultImage?: string;
  avatarClassName?: string;
}

export function ImageUploader({ onUploadSuccess, className, defaultImage, avatarClassName }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(resolveAssetUrl(defaultImage || null));
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setPreviewURL(resolveAssetUrl(defaultImage || null));
  }, [defaultImage]);

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > 5 * 1024 * 1024) {
      setError('图片不可超过 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('只能上传图片文件');
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objUrl = URL.createObjectURL(file);
    objectUrlRef.current = objUrl;
    setPreviewURL(objUrl);

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data?.url) {
        setPreviewURL(resolveAssetUrl(data.url));
        onUploadSuccess(data.url);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '服务器拒绝了上传');
      setPreviewURL(resolveAssetUrl(defaultImage || null));
    } finally {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setIsUploading(false);
    }
  };

  return (
    <div className={cn('relative flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'relative group h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-transparent bg-[var(--bg-secondary)] shadow-soft transition-all hover:border-accent-primary focus-within:ring-4 focus-within:ring-accent-primary/20',
          avatarClassName,
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {previewURL ? (
          <img
            src={previewURL}
            alt="头像预览"
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-40"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors group-hover:text-accent-primary">
            <UserIconFallback />
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 group-hover:bg-black/30 group-hover:opacity-100">
          <Camera size={20} className="text-white drop-shadow-md" />
          <span className="mt-1 text-[10px] font-medium text-white drop-shadow-md">
            更换头像
          </span>
        </div>

        {isUploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {error && <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>}
      {!error && !previewURL && !isUploading && (
        <p className="mt-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <UploadCloud size={14} /> 点击上传头像
        </p>
      )}
    </div>
  );
}

function UserIconFallback() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 21C22 16.5817 17.5228 13 12 13C6.47715 13 2 16.5817 2 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
