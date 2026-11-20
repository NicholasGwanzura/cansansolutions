import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductJsonLd } from '@/components/JsonLd';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductImage } from '@/components/ProductImage';
import { AddToCartButton } from './AddToCartButton';
import { getProductBySlug, readProducts } from '@/lib/admin-data';
import {
  getCategoryBySlug,
  getCategoryHref,
  isBundleProduct,
  isSaImportProduct,
} from '@/lib/catalog';
import { truncateText, stripHtml, buildAbsoluteMetadata } from '@/lib/seo';
import { formatCurrency } from '@/lib/utils';
import { getBrandForProduct, getBrandHref } from '@/lib/brands';
import type { Product } from '@/lib/types';
import { SITE_PHONE_E164 } from '@/lib/site';

export const revalidate = 300;

type RouteParams = Promise<{ slug: string }>;

function getProductImage(productImage: string) {
  return productImage || '/images/products/placeholder.svg';
}

// Categories whose products can mention "SSD" + "USB-C" in their specs without
// being an external SSD themselves (e.g. a laptop with a 512GB SSD and USB-C ports).
const NON_DRIVE_CATEGORIES = new Set([
  'laptops',
  'gaming laptops',
  'desktops',
  'networking',
  'mobile',
  'smartphones',
  'tablets',
  'gaming',
  'printers',
  'printing',
  'monitors',
  'cctv',
  'tv-audio-video',
  'audio',
  'bundles',
  'money counters',
]);

function isLikelyExternalSsd(product: Pick<Product, 'name' | 'tags' | 'category'>) {
  if (NON_DRIVE_CATEGORIES.has(product.category.toLowerCase())) return false;

  // Judge by the product's own name/tags, not its description: descriptions of
  // computers routinely mention SSD storage and USB-C ports.
  const label = `${product.name} ${product.tags.join(' ')}`.toLowerCase();
  const isSsd = /\bssd\b|solid[- ]state/.test(label);
  const isExternal =
    product.category.toLowerCase() === 'drives' ||
    /\b(external|portable|pocket)\b/.test(label);

  return isSsd && isExternal;
}

function getSpecValue(product: Pick<Product, 'specs'>, keywords: string[]) {
  const entries = Object.entries(product.specs ?? {});
  for (const [key, value] of entries) {
    const normalizedKey = key.toLowerCase();
    if (keywords.some((keyword) => normalizedKey.includes(keyword))) {
      return String(value);
    }
  }
  return undefined;
}

function formatSpecLabel(label: string) {
  return label
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({ params }: { params: RouteParams }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const category = getCategoryBySlug(product.category);
  const shortDescription = truncateText(stripHtml(product.description), 155);
  const isExternalSsd = isLikelyExternalSsd(product);
  const isVerbatimPocketSsd =
    isExternalSsd && /verbatim/i.test(product.name) && /1tb/i.test(product.name);

  const readSpeed = getSpecValue(product, ['read speed']);
  const connector = getSpecValue(product, ['connector', 'usb']);
  const transferRate = getSpecValue(product, ['data transfer rate', 'transfer rate']);
  const ssdHighlights = [
    readSpeed && `up to ${readSpeed} speed`,
    connector && `${connector} connectivity`,
    transferRate && `${transferRate} transfer rate`,
  ].filter(Boolean);

  const title = isVerbatimPocketSsd
    ? 'Verbatim 1TB Pocket SSD USB-C 10Gbps | Cansan Zimbabwe'
    : category?.slug === 'mobile'
      ? `${product.name} Price in Zimbabwe | Buy in Harare`
      : `${product.name} | ${category?.label ?? 'Tech'} | Cansan`;

  const ssdSummary = ssdHighlights.join(', ');
  const description =
    isExternalSsd && ssdSummary
      ? truncateText(
          `Buy ${product.name} in Zimbabwe. ${ssdSummary.charAt(0).toUpperCase()}${ssdSummary.slice(1)}, Harare delivery, and USD/EcoCash payment support.`,
          155,
        )
      : shortDescription;

  return buildAbsoluteMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image: getProductImage(product.image),
  });
}

export default async function ProductPage({ params }: { params: RouteParams }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = getCategoryBySlug(product.category);
  const related = (await readProducts())
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);
  const isBundle = isBundleProduct(product);
  const isExternalSsd = isLikelyExternalSsd(product);
  const imageSrc = getProductImage(product.image);
  const galleryImages = Array.from(new Set([...(product.images ?? []), imageSrc].filter(Boolean)));
  const brand = getBrandForProduct(product);
  const specEntries = Object.entries(product.specs ?? {});

  const readSpeed =
    getSpecValue(product, ['read speed']);
  const writeSpeed =
    getSpecValue(product, ['write speed']);
  const transferRate =
    getSpecValue(product, ['data transfer rate', 'transfer rate']);
  const connector =
    getSpecValue(product, ['connector', 'usb connector']);
  const interfaceVersion =
    getSpecValue(product, ['usb version', 'interface']);
  const capacity =
    getSpecValue(product, ['capacity']) ?? (/\b1tb\b/i.test(product.name) ? '1TB' : undefined);
  const formFactor = getSpecValue(product, ['form factor']);
  const weight = getSpecValue(product, ['weight']);
  const speedSummary =
    readSpeed && writeSpeed
      ? `up to ${readSpeed} read and ${writeSpeed} write`
      : readSpeed
        ? `up to ${readSpeed} read`
        : undefined;

  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const savingAmount =
    hasDiscount && product.originalPrice ? product.originalPrice - product.price : 0;
  const savingPercent =
    hasDiscount && product.originalPrice
      ? Math.round((savingAmount / product.originalPrice) * 100)
      : 0;

  const stockCount = typeof product.stockCount === 'number' ? product.stockCount : undefined;
  const lowStock = product.inStock && stockCount !== undefined && stockCount <= 5;
  const criticallyLowStock = product.inStock && stockCount !== undefined && stockCount <= 2;
  const isSaImport = isSaImportProduct(product);

  const seoHeadline = product.name;

  const heroSummary =
    isExternalSsd && speedSummary
      ? `Transfer large files faster with ${speedSummary} speeds${weight ? ` in a compact ${weight} design` : ''}. Built for creators, gamers, and business backups in Zimbabwe.`
      : stripHtml(product.description);

  // Only list SSD claims backed by the product's own specs.
  const ssdBullets = [
    speedSummary && `${speedSummary.charAt(0).toUpperCase()}${speedSummary.slice(1)} performance`,
    interfaceVersion &&
      `${interfaceVersion}${connector ? ` with ${connector}` : ''} for modern laptops and desktops`,
    formFactor && `${formFactor} SSD architecture with no moving parts for better reliability`,
    weight && `${weight} compact design for daily carry and off-site backups`,
  ].filter((bullet): bullet is string => Boolean(bullet));


  const processor = getSpecValue(product, ['processor', 'cpu', 'chipset']);
  const memory = getSpecValue(product, ['ram', 'memory']);
  const storage = getSpecValue(product, ['storage', 'ssd', 'hdd', 'capacity']);
  const display = getSpecValue(product, ['display', 'screen', 'resolution']);
  // Lead with the product's own specs; only fall back to delivery facts. No
  // generic "genuine product / warranty" filler that repeats on every page.
  const specBullets = [processor, memory, storage, display].filter(
    (value): value is string => Boolean(value),
  );
  const benefitBullets =
    isExternalSsd && ssdBullets.length >= 2
      ? ssdBullets
      : specBullets.length >= 2
        ? specBullets.slice(0, 4)
        : [
            ...specBullets,
            isSaImport
              ? 'Ships from South Africa, about 5 days after order confirmation'
              : 'Stock confirmed on WhatsApp before you pay',
          ];

  const quickSpecChips = [
    capacity,
    readSpeed ? `Read ${readSpeed}` : null,
    writeSpeed ? `Write ${writeSpeed}` : null,
    interfaceVersion,
    connector,
    transferRate ? `Up to ${transferRate}` : null,
  ].filter(Boolean) as string[];

  const waNumber = SITE_PHONE_E164.replace('+', '');
  const waText = encodeURIComponent(
    `Hi Cansan Solutions, I'd like to order: ${product.name}${isBundle ? ' bundle' : ''} (${formatCurrency(product.price, product.currency)}). Please confirm live stock, delivery options, and payment methods.`,
  );

  return (
    <>
      <ProductJsonLd product={product} categoryName={category?.label} />
      <nav
        aria-label="Breadcrumb"
        className="border-b border-zinc-200/80 bg-white"
      >
        <ol className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto whitespace-nowrap px-4 py-3 text-sm text-zinc-500 sm:px-6">
          <li>
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-zinc-300">/</li>
          <li>
            <Link href="/products" className="hover:text-zinc-900">
              Products
            </Link>
          </li>
          {category ? (
            <>
              <li aria-hidden className="text-zinc-300">/</li>
              <li>
                <Link href={getCategoryHref(category.slug)} className="hover:text-zinc-900">
                  {category.label}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden className="text-zinc-300">/</li>
          <li aria-current="page" className="truncate font-medium text-zinc-900">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-32 sm:px-6 sm:pb-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-card border border-zinc-200/80 bg-white p-4 sm:p-6">
              <ProductGallery name={product.name} images={galleryImages} />
            </div>
            {quickSpecChips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {quickSpecChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 rounded-card border border-zinc-200/80 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {category ? (
                <Link
                  href={getCategoryHref(category.slug)}
                  className="w-fit rounded-button bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  {category.label}
                </Link>
              ) : null}
              {brand ? (
                <Link
                  href={getBrandHref(brand.slug)}
                  className="inline-flex min-h-10 items-center rounded-button border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  {brand.name}
                </Link>
              ) : null}
              {isBundle ? (
                <span className="w-fit rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                  Bundle Deal
                </span>
              ) : null}
              {hasDiscount ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Save {formatCurrency(savingAmount, product.currency)} ({savingPercent}% Off)
                </span>
              ) : null}
              {lowStock && stockCount !== undefined ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Only {stockCount} left
                </span>
              ) : null}
              {isSaImport ? (
                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                  5-Day Delivery from SA
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
              {seoHeadline}
            </h1>

            <p className="text-sm leading-relaxed text-zinc-600">{heroSummary}</p>

            {isBundle && product.bundleItems.length > 0 ? (
              <div className="rounded-card border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  What&apos;s Included
                </p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                  {product.bundleItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-zinc-900">
                {formatCurrency(product.price, product.currency)}
              </span>
              {hasDiscount && product.originalPrice ? (
                <span className="text-lg text-zinc-400 line-through">
                  {formatCurrency(product.originalPrice, product.currency)}
                </span>
              ) : null}
            </div>

            <div
              className={`rounded-card border px-4 py-3 ${
                product.inStock
                  ? criticallyLowStock
                    ? 'border-red-200 bg-red-50'
                    : lowStock
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-emerald-200 bg-emerald-50'
                  : 'border-zinc-200 bg-zinc-50'
              }`}
            >
              {product.inStock ? (
                <p
                  className={`text-sm font-semibold ${
                    criticallyLowStock
                      ? 'text-red-700'
                      : lowStock
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}
                >
                  {stockCount !== undefined
                    ? criticallyLowStock
                      ? `Only ${stockCount} left. Reserve now before restock delays.`
                      : lowStock
                        ? `Only ${stockCount} left in Harare stock.`
                        : `${stockCount} units currently available.`
                    : 'In stock and available for fast order confirmation.'}
                </p>
              ) : (
                <p className="text-sm font-semibold text-zinc-700">
                  Currently out of stock. Send a WhatsApp enquiry for next shipment ETA.
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-600">
                Price indicative. Confirm final stock, delivery, and quote on WhatsApp before
                checkout.
              </p>
              {isSaImport ? (
                <p className="mt-1 text-xs font-semibold text-red-700">
                  This item is sourced from South Africa and usually arrives within 5 days after
                  confirmation.
                </p>
              ) : null}
            </div>

            <ul className="space-y-1">
              {benefitBullets.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton product={product} label="Buy Now" />
              <a
                href={`https://wa.me/${waNumber}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-button border border-green-600 px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Order on WhatsApp
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex min-h-9 items-center rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {specEntries.length > 0 ? (
          <section className="mt-16">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Specifications</h2>
            <div className="mt-5 overflow-x-auto rounded-card border border-zinc-200 bg-white">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <tbody className="divide-y divide-zinc-100">
                  {specEntries.map(([key, value]) => (
                    <tr key={key}>
                      <th className="w-1/3 bg-zinc-50 px-4 py-3 text-left font-semibold text-zinc-700">
                        {formatSpecLabel(key)}
                      </th>
                      <td className="px-4 py-3 text-zinc-600">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="mt-16">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
            Delivery, Payment &amp; Warranty
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                title: isSaImport ? 'Delivery from South Africa' : 'Delivery',
                body: isSaImport
                  ? 'Ships from South Africa, about 5 days after order confirmation.'
                  : 'Same-day options in Harare and nationwide courier for stocked items.',
                href: '/delivery',
              },
              {
                title: 'Payment',
                body: 'USD cash, bank transfer or EcoCash, confirmed before you pay.',
                href: '/payments',
              },
              {
                title: 'Warranty',
                body: 'We help you with warranty claims after purchase.',
                href: '/warranty',
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                data-reveal
                className="card-interactive group rounded-card border border-zinc-200/80 bg-white p-5"
              >
                <h3 className="flex items-center justify-between text-base font-semibold text-zinc-900">
                  {item.title}
                  <span aria-hidden className="text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-red-600">
                    →
                  </span>
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 ? (
          <section className="mt-16">
            <h2 className="mb-5 text-lg font-bold text-zinc-900">
              {isExternalSsd
                ? 'Related Products & Upsells'
                : `More in ${category?.label ?? 'this category'}`}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.slug}`}
                  className="group flex flex-col rounded-card border border-zinc-200 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-zinc-50 p-3">
                    <ProductImage
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      width={220}
                      height={220}
                      className="max-h-full object-contain"
                    />
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-zinc-800 group-hover:underline">
                    {relatedProduct.name}
                  </p>
                  {isBundleProduct(relatedProduct) ? (
                    <p className="mt-1 text-sm font-medium text-zinc-500">
                      {relatedProduct.bundleItems.length} item bundle
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-bold text-zinc-900">
                    {formatCurrency(relatedProduct.price, relatedProduct.currency)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <AddToCartButton
            product={product}
            label="Buy Now"
            className="min-h-12 rounded-xl px-4 py-3 text-sm"
          />
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-button border border-green-600 px-4 py-3 text-sm font-semibold text-green-700"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
