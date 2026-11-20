'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { getCategoryLabel, isBundleProduct, isSaImportProduct } from '@/lib/catalog';
import { useToast } from './Toast';
import { ProductImage } from './ProductImage';
import { Icon } from './icons';

type ProductCardProps = {
  product: Product;
  onQuickView?: (p: Product) => void;
};

const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = {
  laptops: '/images/products/laptop-new.svg',
  desktops: '/images/products/desktop-new.svg',
  monitors: '/images/products/imac.svg',
  'sa-imports': '/images/products/laptop-used.svg',
};

const SPEC_PRIORITY_KEYS = [
  'capacity',
  'processor',
  'cpu',
  'read speed',
  'write speed',
  'memory',
  'ram',
  'storage',
  'connector',
  'interface',
  'resolution',
  'screen',
];

function normalizeLabel(label: string) {
  return label
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMicroSpecs(product: Product): string[] {
  const entries = Object.entries(product.specs ?? {});
  const preferred = entries
    .filter(([key]) => SPEC_PRIORITY_KEYS.some((priority) => key.toLowerCase().includes(priority)))
    .slice(0, 3)
    .map(([key, value]) => `${normalizeLabel(key)}: ${value}`);

  if (preferred.length >= 2) {
    return preferred;
  }

  const fallbackFromName = [
    /\b\d+\s?TB\b/i,
    /\bUSB[-\s]?C\b/i,
    /\b\d{2,4}\s?MB\/s\b/i,
    /\b\d+\s?GB\s?RAM\b/i,
    /\bCore\s+i[3579]\b/i,
  ]
    .map((pattern) => product.name.match(pattern)?.[0])
    .filter(Boolean)
    .slice(0, 3) as string[];

  // No generic filler ("Genuine product", "Local support"): if a product has no
  // real specs we show nothing rather than padding every card with the same lines.
  return [...preferred, ...fallbackFromName].slice(0, 3);
}

function getStockBadge(product: Product): { label: string; tone: string } | null {
  if (!product.inStock) {
    return { label: 'Out of Stock', tone: 'bg-zinc-900/80 text-white' };
  }
  if (typeof product.stockCount === 'number' && product.stockCount > 0 && product.stockCount <= 5) {
    return { label: `Only ${product.stockCount} left`, tone: 'bg-amber-100 text-amber-800' };
  }
  // "In stock" is the default state, so it doesn't earn a badge on every card.
  return null;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const isBundle = isBundleProduct(product);

  const microSpecs = useMemo(() => getMicroSpecs(product), [product]);
  const stockBadge = useMemo(() => getStockBadge(product), [product]);
  const saImport = useMemo(() => isSaImportProduct(product), [product]);

  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent =
    hasDiscount && product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const fallbackImage =
    FALLBACK_IMAGE_BY_CATEGORY[product.category] ?? '/images/products/placeholder.svg';
  const imageSrc = !imageFailed && product.image ? product.image : fallbackImage;

  const handleAdd = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!product.inStock) {
      return;
    }

    addToCart(product);
    setAdding(true);
    showToast(`${product.name} added to cart`);
    window.setTimeout(() => setAdding(false), 1000);
  };

  const badges = [
    hasDiscount ? { key: 'discount', label: `−${discountPercent}%`, tone: 'bg-red-600 text-white' } : null,
    product.dealLabel ? { key: 'deal', label: product.dealLabel, tone: 'bg-zinc-900 text-white' } : null,
    product.condition === 'pre-owned'
      ? { key: 'condition', label: 'Pre-owned', tone: 'bg-white text-zinc-700 ring-1 ring-zinc-200' }
      : null,
  ]
    .filter((badge): badge is { key: string; label: string; tone: string } => Boolean(badge))
    .slice(0, 2);

  return (
    <article data-reveal className="card-interactive group relative flex h-full flex-col overflow-hidden rounded-card border border-zinc-200/80 bg-white">
      <div className="relative aspect-square overflow-hidden bg-zinc-50 sm:aspect-[4/3]">
        <Link
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-0"
        />
        <ProductImage
          src={imageSrc}
          fallbackSrc={fallbackImage}
          alt={product.name}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onError={() => setImageFailed(true)}
          className={`pointer-events-none object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-smooth group-hover:scale-[1.04] motion-reduce:transition-none sm:p-6 ${product.inStock ? '' : 'opacity-60 grayscale'}`}
        />

        {badges.length > 0 || stockBadge ? (
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className={`max-w-full truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${badge.tone}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            {stockBadge ? (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${stockBadge.tone}`}>
                {stockBadge.label}
              </span>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setWishlisted((current) => !current);
          }}
          aria-label={
            wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          className={`absolute bottom-1.5 right-1.5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${wishlisted ? 'text-red-600' : 'text-zinc-400 hover:text-red-600'}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200/80">
            <Icon name="heart" className="h-4 w-4" fill={wishlisted ? 'currentColor' : 'none'} />
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[11px] font-medium text-zinc-500">
          {getCategoryLabel(product.category).replace(/\s*\(.*\)$/, '')}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-0.5 text-sm font-semibold leading-snug text-zinc-900 transition hover:text-red-700 sm:text-[15px]"
        >
          <h3 className="line-clamp-2">{product.name}</h3>
        </Link>

        {microSpecs.length > 0 ? (
          <p className="mt-1.5 line-clamp-1 text-xs text-zinc-500">
            {microSpecs.slice(0, 2).map((spec) => spec.replace(/^[^:]+:\s*/, '')).join(' · ')}
          </p>
        ) : null}

        {onQuickView ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onQuickView(product);
            }}
            className="mt-1 inline-flex min-h-8 w-fit items-center text-xs font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Quick view
          </button>
        ) : null}

        <div className="mt-auto pt-3">
          {saImport ? (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <Icon name="truck" className="h-3.5 w-3.5 shrink-0" />
              Ships from SA · ~5 days
            </p>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-base font-bold tabular-nums text-zinc-950 sm:text-lg">
              {formatCurrency(product.price, product.currency)}
            </p>
            {hasDiscount && product.originalPrice ? (
              <p className="text-xs tabular-nums text-zinc-400 line-through">
                {formatCurrency(product.originalPrice, product.currency)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock || adding}
            className="press mt-3 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-button bg-zinc-900 px-3 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 sm:min-h-11"
          >
            {adding ? <Icon name="check" className="h-4 w-4" strokeWidth={2} /> : null}
            {product.inStock
              ? adding
                ? 'Added'
                : isBundle
                  ? 'Add Bundle'
                  : 'Add to Cart'
              : 'Out of stock'}
          </button>
        </div>
      </div>
    </article>
  );
}
