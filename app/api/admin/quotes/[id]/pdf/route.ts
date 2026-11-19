export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/check-admin-auth';
import { getCompanyProfile, getQuote } from '@/lib/db';
import { quoteToSalesData, renderSalesPdf } from '@/lib/render-sales-pdf';
import { pdfResponse } from '@/lib/pdf-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const [quote, company] = await Promise.all([getQuote(id), getCompanyProfile()]);
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const bytes = await renderSalesPdf(quoteToSalesData(quote, company), company);
    return pdfResponse(bytes, `${quote.number}.pdf`, req.nextUrl.searchParams.has('download'));
  } catch (error) {
    console.error('[Quote PDF] Render failed:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
