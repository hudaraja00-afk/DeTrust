'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

export function AnimatedSection({
  children,
  ...props
}: HTMLMotionProps<'div'> & { children: ReactNode }) {
  return <motion.div {...props}>{children}</motion.div>;
}

export function AnimatedH1({
  children,
  ...props
}: HTMLMotionProps<'h1'> & { children: ReactNode }) {
  return <motion.h1 {...props}>{children}</motion.h1>;
}

export function AnimatedP({
  children,
  ...props
}: HTMLMotionProps<'p'> & { children: ReactNode }) {
  return <motion.p {...props}>{children}</motion.p>;
}

export function AnimatedSpan({
  children,
  ...props
}: HTMLMotionProps<'span'> & { children: ReactNode }) {
  return <motion.span {...props}>{children}</motion.span>;
}
