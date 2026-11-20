'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 6;

/**
 * Fades `[data-reveal]` elements up as they scroll into view. Siblings that
 * share a parent are staggered. Renders nothing; mount once in the root layout.
 *
 * Safe by default: elements are only hidden after this runs (via the
 * `reveal-ready` class on <html>), elements already on screen are shown
 * immediately, and visitors who prefer reduced motion get no animation.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const root = document.documentElement;
    const seen = new WeakSet<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const register = (element: Element) => {
      if (seen.has(element)) return;
      seen.add(element);

      // Already visible on arrival: show without animating, so nothing flickers.
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0 && !root.classList.contains('reveal-ready')) {
        element.classList.add('is-revealed');
        return;
      }

      const siblings = element.parentElement
        ? Array.from(element.parentElement.children).filter((child) => child.hasAttribute('data-reveal'))
        : [];
      const index = Math.max(0, siblings.indexOf(element));
      (element as HTMLElement).style.setProperty(
        '--reveal-delay',
        `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms`,
      );
      observer.observe(element);
    };

    const scan = (scope: ParentNode) => {
      scope.querySelectorAll('[data-reveal]').forEach(register);
    };

    scan(document);
    root.classList.add('reveal-ready');

    // Cards rendered later (filters, pagination, client navigation).
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.hasAttribute('data-reveal')) register(node);
          scan(node);
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}
