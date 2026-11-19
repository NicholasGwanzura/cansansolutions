import { NextResponse } from 'next/server';

/** Build a PDF HTTP response. `?download=1` forces a file download. */
export function pdfResponse(bytes: Uint8Array, filename: string, download: boolean) {
  const safeName = filename.replace(/[^A-Za-z0-9._-]/g, '_');
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
