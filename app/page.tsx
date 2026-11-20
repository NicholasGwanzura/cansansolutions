import Link from 'next/link';
import type { Metadata } from 'next';
import { formatInsightDate, getFeaturedInsights, getInsightHref } from '@/lib/articles';
import { readProducts } from '@/lib/admin-data';
import { CATALOG_CATEGORIES, getCategoryHref, isSaImportProduct } from '@/lib/catalog';
import { buildAbsoluteMetadata } from '@/lib/seo';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { HeroProductSlider } from '@/components/HeroProductSlider';
import { WA_NUMBER } from '@/lib/site';
import { CATEGORY_ICONS } from '@/components/category-icons';
import { Icon, type IconName } from '@/components/icons';

// Dynamic, not ISR: DATABASE_URL is only injected at container runtime (not
// available during the Docker build), so static prerendering at build time
// bakes in an empty product list until the ISR window happens to lapse.
// Homepage product data also depends on the current Harare calendar day
// (see getDailyHomepageProducts), so it should never be served stale anyway.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildAbsoluteMetadata({
  title: 'Buy SSDs, Laptops & CCTV in Zimbabwe',
  description:
    'Shop SSDs, laptops, networking gear, CCTV, and accessories in Zimbabwe with fast delivery, secure payment options, and local support.',
  path: '/',
});


const FEATURE_TILES: {
  title: string;
  description: string;
  action: string;
  href: string;
  icon: IconName;
  external?: boolean;
}[] = [
  {
    title: 'Genuine Products',
    description: 'Check live availability before you pay or travel.',
    action: 'Shop in-stock Items',
    href: '/products',
    icon: 'shieldCheck',
  },
  {
    title: 'Harare Delivery',
    description: 'Same-day dispatch in Harare, courier nationwide.',
    action: 'Delivery Options',
    href: '/delivery',
    icon: 'truck',
  },
  {
    title: 'Order on WhatsApp',
    description: 'Product advice, setup help and warranty questions.',
    action: 'Start a Chat',
    href: `https://wa.me/${WA_NUMBER}`,
    icon: 'chat',
    external: true,
  },
  {
    title: 'Bulk & School Orders',
    description: 'Quotes for offices, schools and institutions.',
    action: 'Request a Quote',
    href: '/bulk-orders',
    icon: 'building',
  },
];

const SERVICE_LINKS = [
  { label: 'Delivery Information', href: '/delivery' },
  { label: 'Payment Options', href: '/payments' },
  { label: 'Warranty Policy', href: '/warranty' },
  { label: 'Bulk Orders', href: '/bulk-orders' },
];

const HOMEPAGE_FEATURED_COUNT = 8;
const HOMEPAGE_LAPTOP_COUNT = 2;
const HOMEPAGE_SA_IMPORT_COUNT = 3;
const HARARE_TIME_ZONE = 'Africa/Harare';

function isLaptopProduct(product: Product) {
  return product.category.toLowerCase().includes('laptop');
}

function getHarareDayKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: HARARE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rankForDailyRotation(products: Product[], dayKey: string, salt: string) {
  return [...products].sort((left, right) => {
    const leftScore = hashString(`${dayKey}:${salt}:${left.id}:${left.slug}`);
    const rightScore = hashString(`${dayKey}:${salt}:${right.id}:${right.slug}`);
    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    const featuredDelta = Number(right.featured) - Number(left.featured);
    if (featuredDelta !== 0) {
      return featuredDelta;
    }

    return left.name.localeCompare(right.name);
  });
}

function takeFromPool({
  pool,
  count,
  usedIds,
  dayKey,
  salt,
}: {
  pool: Product[];
  count: number;
  usedIds: Set<string>;
  dayKey: string;
  salt: string;
}) {
  if (count <= 0 || pool.length === 0) {
    return [] as Product[];
  }

  const ranked = rankForDailyRotation(pool, dayKey, salt);
  const picked: Product[] = [];

  for (const product of ranked) {
    if (usedIds.has(product.id)) {
      continue;
    }
    usedIds.add(product.id);
    picked.push(product);

    if (picked.length >= count) {
      break;
    }
  }

  return picked;
}

function takeMixedByCategory({
  pool,
  count,
  usedIds,
  dayKey,
  salt,
}: {
  pool: Product[];
  count: number;
  usedIds: Set<string>;
  dayKey: string;
  salt: string;
}) {
  if (count <= 0 || pool.length === 0) {
    return [] as Product[];
  }

  const ranked = rankForDailyRotation(pool, dayKey, salt);
  const picks: Product[] = [];
  const categoryChosen = new Set<string>();

  for (const product of ranked) {
    if (usedIds.has(product.id) || categoryChosen.has(product.category)) {
      continue;
    }
    usedIds.add(product.id);
    categoryChosen.add(product.category);
    picks.push(product);

    if (picks.length >= count) {
      return picks;
    }
  }

  for (const product of ranked) {
    if (usedIds.has(product.id)) {
      continue;
    }
    usedIds.add(product.id);
    picks.push(product);

    if (picks.length >= count) {
      break;
    }
  }

  return picks;
}

function getDailyHomepageProducts(products: Product[]) {
  const stockAwarePool = products.filter((product) => product.inStock);
  const sourcePool = stockAwarePool.length > 0 ? stockAwarePool : products;
  const dayKey = getHarareDayKey();
  const usedIds = new Set<string>();
  const selected: Product[] = [];
  const allLaptops = sourcePool.filter((product) => isLaptopProduct(product));
  const allSaImports = sourcePool.filter((product) => isSaImportProduct(product));

  selected.push(
    ...takeFromPool({
      pool: sourcePool.filter((product) => isLaptopProduct(product)),
      count: HOMEPAGE_LAPTOP_COUNT,
      usedIds,
      dayKey,
      salt: 'laptops',
    }),
  );

  const laptopsSelected = selected.filter((product) => isLaptopProduct(product)).length;
  if (laptopsSelected < HOMEPAGE_LAPTOP_COUNT) {
    selected.push(
      ...takeFromPool({
        pool: allLaptops.filter((product) => !usedIds.has(product.id)),
        count: HOMEPAGE_LAPTOP_COUNT - laptopsSelected,
        usedIds,
        dayKey,
        salt: 'laptops-fallback',
      }),
    );
  }

  selected.push(
    ...takeFromPool({
      pool: sourcePool.filter((product) => isSaImportProduct(product)),
      count: HOMEPAGE_SA_IMPORT_COUNT,
      usedIds,
      dayKey,
      salt: 'sa-imports',
    }),
  );

  const saSelected = selected.filter((product) => isSaImportProduct(product)).length;
  if (saSelected < HOMEPAGE_SA_IMPORT_COUNT) {
    selected.push(
      ...takeFromPool({
        pool: allSaImports.filter((product) => !usedIds.has(product.id)),
        count: HOMEPAGE_SA_IMPORT_COUNT - saSelected,
        usedIds,
        dayKey,
        salt: 'sa-imports-fallback',
      }),
    );
  }

  const remainingCount = HOMEPAGE_FEATURED_COUNT - selected.length;
  if (remainingCount > 0) {
    selected.push(
      ...takeMixedByCategory({
        pool: sourcePool.filter(
          (product) =>
            !usedIds.has(product.id) && !isLaptopProduct(product) && !isSaImportProduct(product),
        ),
        count: remainingCount,
        usedIds,
        dayKey,
        salt: 'mixed-categories',
      }),
    );
  }

  if (selected.length < HOMEPAGE_FEATURED_COUNT) {
    selected.push(
      ...takeFromPool({
        pool: sourcePool.filter((product) => !usedIds.has(product.id)),
        count: HOMEPAGE_FEATURED_COUNT - selected.length,
        usedIds,
        dayKey,
        salt: 'fallback',
      }),
    );
  }

  return selected.slice(0, HOMEPAGE_FEATURED_COUNT);
}

export default async function HomePage() {
  const products = await readProducts();
  const featuredInsights = getFeaturedInsights(3);

  const homepageProducts = getDailyHomepageProducts(products);
  const homepageDisplayProducts = homepageProducts.filter((product) => product.image.trim().length > 0);

  // Real per-category counts for the hero ("48 laptops in stock"). Older
  // records may store the category id, slug, or display label, so resolve all
  // three to the slug used by the hero slides before counting.
  const categorySlugs = new Map(
    CATALOG_CATEGORIES.flatMap((category) =>
      [category.id, category.slug, category.label].map((value) => [value.trim().toLowerCase(), category.slug] as const),
    ),
  );
  const heroCategoryCounts = products.reduce<Record<string, number>>((counts, product) => {
    if (!product.inStock) return counts;
    const normalizedCategory = product.category.trim().toLowerCase();
    const key = categorySlugs.get(normalizedCategory) ?? normalizedCategory;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  const categoryShowcase = CATALOG_CATEGORIES.slice(0, 7);

  return (
    <div className="overflow-x-hidden bg-[#f7f7f7] text-zinc-900">
      <HeroProductSlider categoryCounts={heroCategoryCounts} />

      <section id="shop-categories" className="bg-white px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Shop by Category</h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-red-700 hover:text-red-800"
            >
              All Categories
            </Link>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0 lg:pb-0">
            {categoryShowcase.map((category) => (
              <Link
                key={category.id}
                href={getCategoryHref(category.slug)}
                data-reveal
                className="card-interactive group min-w-32 flex-1 rounded-button border border-zinc-200/80 bg-white px-3 py-4 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:min-w-36"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition duration-300 ease-smooth group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white"
                >
                  {CATEGORY_ICONS[category.icon] ?? CATEGORY_ICONS.deals}
                </span>
                <p className="mt-2.5 text-sm font-medium leading-tight text-zinc-800">
                  {category.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURE_TILES.map((tile) => {
            const content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-red-50 group-hover:text-red-600">
                  <Icon name={tile.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-zinc-900">{tile.title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-zinc-500">{tile.description}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-red-700">
                    {tile.action}
                    <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </span>
              </>
            );

            return (
              <Link
                key={tile.title}
                href={tile.href}
                target={tile.external ? '_blank' : undefined}
                rel={tile.external ? 'noreferrer' : undefined}
                data-reveal
                className="group flex items-start gap-3.5 rounded-xl p-3 transition duration-200 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:p-4"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <section id="featured-products" className="bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">New Arrivals</h2>
              <p className="mt-2 text-sm text-zinc-600">
                The latest stock across laptops, storage, networking and printing.
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm font-semibold text-red-700 hover:text-red-800"
            >
              Browse Full Catalog →
            </Link>
          </div>

          {homepageDisplayProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {homepageDisplayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
              Latest products with images will appear here as soon as inventory is loaded.
            </div>
          )}
        </div>
      </section>

      <section className="bg-zinc-50 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
                Buying Guides
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
                Guides for Smarter Buying
              </h2>
            </div>
            <Link
              href="/insights"
              className="text-sm font-semibold text-red-700 hover:text-red-800"
            >
              Read All Guides
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featuredInsights.map((article) => (
              <article
                key={article.slug}
                className="group relative flex h-full flex-col overflow-hidden rounded-panel border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgba(24,24,27,0.05)] transition duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-[0_16px_38px_rgba(220,38,38,0.10)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-red-600 sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-400 to-transparent"
                />
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  {article.categoryLabel}
                </p>
                <h3 className="mt-2 line-clamp-2 text-lg font-bold text-zinc-900">
                  {article.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                  {article.excerpt}
                </p>
                <p className="mt-5 inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                  {formatInsightDate(article.publishedAt)}
                </p>
                <Link
                  href={getInsightHref(article.slug)}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800"
                >
                  Read guide
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-16 items-center justify-between rounded-button border border-white/15 bg-white/[0.06] px-5 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-red-500/60 hover:bg-red-600/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-400"
            >
              <span>{item.label}</span>
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-red-400 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
