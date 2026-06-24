"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface BrandMarkProps {
  href?: string;
  showWordmark?: boolean;
  className?: string;
  contentClassName?: string;
}

export function BrandMark({ href = '/', showWordmark = true, className, contentClassName }: BrandMarkProps) {
  const content = (
    <motion.span
      className={cn('flex items-center gap-3', contentClassName)}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-dt-surface shadow-lg ring-1 ring-dt-border">
        <Image
          src="/images/detrust-mark.svg"
          alt="DeTrust mark"
          width={48}
          height={48}
          className="h-10 w-10 object-contain"
          priority
        />
      </span>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-dt-text">De</span>
          <span className="text-brand">Trust</span>
        </span>
      )}
    </motion.span>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className} aria-label="DeTrust home">
      {content}
    </Link>
  );
}
