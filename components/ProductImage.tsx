'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const FALLBACK = '/images/products/placeholder.svg';

type ProductImageProps = Omit<ImageProps, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function ProductImage({
  src,
  fallbackSrc = FALLBACK,
  alt,
  onError,
  ...props
}: ProductImageProps) {
  const sourceKey = `${src ?? ''}\0${fallbackSrc}`;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === sourceKey;
  const value = !failed && src ? src : fallbackSrc;

  return (
    <Image
      {...props}
      src={value}
      alt={alt}
      onError={(event) => {
        setFailedSource(sourceKey);
        onError?.(event);
      }}
    />
  );
}
