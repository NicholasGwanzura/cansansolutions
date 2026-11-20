'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Icon, type IconName } from '@/components/icons';
import { WA_NUMBER } from '@/lib/site';

type HeroProductSliderProps = {
  /** In-stock product counts keyed by lower-cased category slug. */
  categoryCounts: Record<string, number>;
};

const AUTO_ADVANCE_MS = 7000;

const CATEGORY_SLIDES = [
  {
    key: 'laptops',
    noun: 'laptops',
    eyebrow: 'Work, Study, Create',
    title: 'Laptops that keep up with your day.',
    description: 'Business-ready, student-friendly and performance laptops, with local warranty support.',
    href: '/products/category/laptops',
    image: '/images/hero/laptops-hero.png',
    imageAlt: 'Laptops arranged on a bright modern workspace',
  },
  {
    key: 'printing',
    noun: 'printers',
    eyebrow: 'Print with Confidence',
    title: 'Printers for home, school and office.',
    description: 'Reliable inkjet and laser printers, plus honest advice on running costs before you buy.',
    href: '/products/category/printing',
    image: '/images/hero/printers-hero.png',
    imageAlt: 'Modern printers arranged in a contemporary office',
  },
  {
    key: 'desktops',
    noun: 'desktops',
    eyebrow: 'Build Your Workstation',
    title: 'Desktops made for serious work.',
    description: 'Dependable desktops and monitors for productive home and business setups.',
    href: '/products/category/desktops',
    image: '/images/hero/desktops-hero.png',
    imageAlt: 'Desktop computer and monitor in a modern office',
  },
  {
    key: 'accessories',
    noun: 'accessories',
    eyebrow: 'Complete Your Setup',
    title: 'Small upgrades. Big difference.',
    description: 'Keyboards, mice, hubs, stands, storage and the everyday essentials that make tech work better.',
    href: '/products/category/accessories',
    image: '/images/hero/accessories-hero.png',
    imageAlt: 'Computer accessories arranged on a clean desk',
  },
] as const;

const TRUST_POINTS: { icon: IconName; label: string }[] = [
  { icon: 'shieldCheck', label: 'Genuine, Warranty-Backed' },
  { icon: 'truck', label: 'Fast Harare Delivery' },
  { icon: 'chat', label: 'Order on WhatsApp' },
];

const WHATSAPP_HREF = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  "Hi Cansan, I'd like help choosing a product.",
)}`;

export function HeroProductSlider({ categoryCounts }: HeroProductSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pausedRef = useRef(false);
  const active = CATEGORY_SLIDES[activeIndex];
  const activeCount = categoryCounts[active.key] ?? 0;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      if (!pausedRef.current) setActiveIndex((current) => (current + 1) % CATEGORY_SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  const go = (delta: number) =>
    setActiveIndex((current) => (current + delta + CATEGORY_SLIDES.length) % CATEGORY_SLIDES.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured categories"
      className="bg-white px-4 pb-8 pt-5 sm:px-6 sm:pb-12 sm:pt-8"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
      onFocus={() => {
        pausedRef.current = true;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) pausedRef.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(1);
        if (event.key === 'ArrowLeft') go(-1);
      }}
    >
      <div className="mx-auto max-w-7xl">
        <article className="relative isolate min-h-[500px] overflow-hidden rounded-panel bg-zinc-950 text-white shadow-[0_24px_70px_rgba(24,24,27,0.18)] sm:min-h-[560px]">
          {/* All slides stay mounted so switching is a real cross-fade, not a pop-in. */}
          {CATEGORY_SLIDES.map((slide, index) => (
            <Image
              key={slide.key}
              src={slide.image}
              alt={index === activeIndex ? slide.imageAlt : ''}
              aria-hidden={index !== activeIndex}
              fill
              priority={index === 0}
              sizes="(max-width: 640px) 100vw, 1280px"
              className={`object-cover object-[70%_center] transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none sm:object-center ${
                index === activeIndex ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0'
              }`}
            />
          ))}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.92)_0%,rgba(9,9,11,0.72)_38%,rgba(9,9,11,0.15)_75%,rgba(9,9,11,0)_100%)]"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(9,9,11,0.8),transparent_50%)]" />
          {/* On phones the copy spans the full width, so darken the whole image. */}
          <div aria-hidden="true" className="absolute inset-0 bg-zinc-950/35 sm:hidden" />

          <div
            key={active.key}
            aria-live={reducedMotion ? 'polite' : 'off'}
            className="hero-slide-in relative z-10 flex min-h-[500px] max-w-xl flex-col justify-center px-6 pb-24 pt-12 sm:min-h-[560px] sm:px-12 sm:pb-24 sm:pt-16"
          >
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {active.eyebrow}
            </p>
            <h1 className="mt-5 max-w-lg font-heading text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-balance sm:text-[3.5rem] lg:text-6xl">
              {active.title}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/75 sm:text-base">{active.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={active.href}
                className="press inline-flex min-h-12 items-center gap-2 rounded-button bg-red-600 px-6 text-sm font-bold text-white shadow-[0_8px_24px_rgba(220,38,38,0.35)] hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-300"
              >
                {activeCount > 0 ? `Shop ${activeCount} ${active.noun}` : `Shop ${active.noun}`}
                <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2} />
              </Link>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="press inline-flex min-h-12 items-center gap-2 rounded-button border border-white/25 bg-white/5 px-5 text-sm font-semibold text-white backdrop-blur hover:border-white/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
              >
                <Icon name="chat" className="h-4 w-4" />
                Ask for advice
              </a>
            </div>

            <ul className="mt-8 hidden flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/70 sm:flex">
              {TRUST_POINTS.map((point) => (
                <li key={point.label} className="flex items-center gap-1.5">
                  <Icon name={point.icon} className="h-4 w-4 text-red-400" />
                  {point.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute bottom-4 left-6 right-6 z-10 flex items-center justify-between gap-4 sm:bottom-7 sm:left-12 sm:right-12">
            <div className="flex items-center gap-0.5">
              {CATEGORY_SLIDES.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show ${slide.noun}`}
                  aria-current={index === activeIndex}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                      index === activeIndex ? 'w-8 bg-red-500' : 'w-1.5 bg-white/45 hover:bg-white/80'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="mr-1 hidden text-xs font-semibold tabular-nums tracking-[0.14em] text-white/55 sm:block">
                {String(activeIndex + 1).padStart(2, '0')} / {String(CATEGORY_SLIDES.length).padStart(2, '0')}
              </span>
              {[
                { delta: -1, label: 'Previous Slide', flip: true },
                { delta: 1, label: 'Next Slide', flip: false },
              ].map(({ delta, label, flip }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => go(delta)}
                  aria-label={label}
                  className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur transition hover:border-white/50 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 sm:inline-flex"
                >
                  <Icon name="chevronRight" className={`h-4 w-4 ${flip ? 'rotate-180' : ''}`} strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
