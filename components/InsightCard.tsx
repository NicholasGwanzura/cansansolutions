import Link from 'next/link';
import type { InsightArticle } from '@/lib/articles';
import { formatInsightDate, getInsightHref } from '@/lib/articles';

interface InsightCardProps {
  article: InsightArticle;
}

export function InsightCard({ article }: InsightCardProps) {
  return (
    <Link
      href={getInsightHref(article.slug)}
      data-reveal
      className="card-interactive group flex h-full flex-col rounded-card border border-zinc-200/80 bg-white p-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500">
        <span>{article.categoryLabel}</span>
        <span className="h-1 w-1 rounded-full bg-zinc-300" />
        <span>{article.readTimeMinutes} min read</span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em] text-zinc-900 transition-colors group-hover:text-red-700 sm:text-xl">
        {article.title}
      </h3>
      <p className="mb-6 mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">{article.excerpt}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-sm">
        <span className="text-zinc-500">{formatInsightDate(article.publishedAt)}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-red-600">
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
        </span>
      </div>
    </Link>
  );
}
