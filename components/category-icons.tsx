import type { ReactNode } from 'react';

/** Category artwork shared by the homepage grid and the footer. Keyed by `category.icon`. */
export const CATEGORY_ICONS: Record<string, ReactNode> = {
  laptop: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="5" width="18" height="11" rx="1.5" />
      <path d="M2 19h20" />
    </svg>
  ),
  printer: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M6.5 8V4h11v4M6.5 17.5H5A2 2 0 0 1 3 15.5v-4A2 2 0 0 1 5 9.5h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1.5" />
      <rect x="6.5" y="13" width="11" height="7" rx="0.75" />
    </svg>
  ),
  network: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M4 9c4.8-4.7 11.2-4.7 16 0M7.5 12.5c2.9-2.8 6.1-2.8 9 0M11.2 16.2a1.1 1.1 0 1 1 1.6 1.6 1.1 1.1 0 0 1-1.6-1.6Z" />
    </svg>
  ),
  desktop: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="4" y="4" width="16" height="11" rx="1.5" />
      <path d="M9 20h6M12 15v5" />
    </svg>
  ),
  monitor: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
      <path d="M9 20h6M12 16.5v3.5" />
    </svg>
  ),
  plug: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M8 4.5V7m8-2.5V7M12 7v4.5m0 0a3.5 3.5 0 1 0 3.5 3.5H12V11.5Zm0 0A3.5 3.5 0 1 1 8.5 15H12" />
    </svg>
  ),
  headphones: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4.5" height="6" rx="1.5" />
      <rect x="16.5" y="14" width="4.5" height="6" rx="1.5" />
    </svg>
  ),
  cpu: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="7" y="7" width="10" height="10" rx="1.2" />
      <path d="M9.5 7V4m5 3V4m0 20v-3m-5 3v-3M7 9.5H4m3 5H4m16-5h-3m3 5h-3" />
    </svg>
  ),
  storage: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <ellipse cx="12" cy="5" rx="8.5" ry="2.5" />
      <path d="M20.5 12c0 1.4-3.8 2.5-8.5 2.5S3.5 13.4 3.5 12M3.5 5v14c0 1.4 3.8 2.5 8.5 2.5s8.5-1.1 8.5-2.5V5" />
    </svg>
  ),
  truck: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M3.5 7.5h11v8h-11z" />
      <path d="M14.5 10.5h3.5l2.5 2.5V15.5H14.5z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  ),
  smartphone: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  ),
  'shield-camera': (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M2.5 12c1.2-3.6 4.6-6 8.8-6 4.1 0 7.5 2.4 8.7 6-1.2 3.6-4.6 6-8.7 6-4.2 0-7.6-2.4-8.8-6Z" />
      <circle cx="11.3" cy="12" r="2.7" />
    </svg>
  ),
  deals: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M11.5 3.5 4 11l8.5 9.5L20 13z" />
      <circle cx="9" cy="8" r="1.4" />
    </svg>
  ),
};
