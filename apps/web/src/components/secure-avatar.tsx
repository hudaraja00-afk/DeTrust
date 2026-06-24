import Image from 'next/image';
import type { ReactNode } from 'react';

import { useSecureObjectUrl } from '@/hooks/use-secure-object-url';
import { cn } from '@/lib/utils';

const SECURE_UPLOAD_PATTERN = /\/api\/uploads\//i;

export interface SecureAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  fallbackInitial?: string;
  className?: string;
  containerClassName?: string;
  overlay?: ReactNode;
}

export function SecureAvatar({
  src,
  alt,
  size = 64,
  fallbackInitial,
  className,
  containerClassName,
  overlay,
}: SecureAvatarProps) {
  const isSecureSource = Boolean(src && SECURE_UPLOAD_PATTERN.test(src));
  const { objectUrl, isLoading } = useSecureObjectUrl(isSecureSource ? src : undefined);
  const resolvedSrc = (isSecureSource ? objectUrl : src) ?? undefined;
  const initials = fallbackInitial?.trim().charAt(0).toUpperCase();

  if (!resolvedSrc) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 text-xl font-semibold uppercase text-white shadow-inner',
          containerClassName
        )}
        style={{ width: size, height: size }}
      >
        {initials || '•'}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full border border-slate-200/40 bg-slate-900/5 shadow-[0_8px_30px_rgba(15,23,42,0.12)]',
        containerClassName
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={resolvedSrc}
        alt={alt}
        width={size}
        height={size}
        className={cn('h-full w-full object-cover', className)}
        unoptimized={isSecureSource || resolvedSrc.startsWith('blob:')}
      />
      {(isLoading || overlay) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 text-white">
          {overlay || (
            <span className="h-4 w-4 animate-spin rounded-full border border-white/70 border-t-transparent" />
          )}
        </div>
      )}
    </div>
  );
}

export default SecureAvatar;
