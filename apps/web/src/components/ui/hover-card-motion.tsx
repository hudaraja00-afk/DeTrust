'use client';

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

export function HoverCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} className={className}>
      {children}
    </motion.div>
  );
}

export function HoverScale({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span whileHover={{ scale: 1.05 }} className={className}>
      {children}
    </motion.span>
  );
}
