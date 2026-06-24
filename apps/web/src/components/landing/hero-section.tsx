'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroSection() {
  return (
    <section className="relative flex h-[80vh] min-h-[600px] items-center justify-center overflow-hidden rounded-3xl">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        poster="/images/hero-poster.jpg"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.span
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          Decentralized Freelance Marketplace
        </motion.span>

        <motion.h1
          className="mt-4 font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          Freelancing, Rebuilt
          <br />
          on <span className="text-brand">Trust</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Smart contract escrow. AI-verified skills. On-chain reputation.
          <br className="hidden sm:block" />
          1–3% fees — not 20%.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <Link href="/register?role=client" className="btn-primary text-base">
            Start Hiring <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register?role=freelancer"
            className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
          >
            Find Work
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <a
          href="#stats"
          aria-label="Scroll to next section"
          className="flex flex-col items-center gap-1 text-white/50 transition-colors hover:text-white/80"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
