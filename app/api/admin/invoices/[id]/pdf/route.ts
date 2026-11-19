export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/check-admin-auth';
import { getCompanyProfile, getInvoice } from '@/lib/db';
import { invoiceToSalesData, renderSalesPdf } from '@/lib/render-sales-pdf';
import { pdfResponse } from '@/lib/pdf-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const [invoice, company] = await Promise.all([getInvoice(id), getCompanyProfile()]);
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const bytes = await renderSalesPdf(invoiceToSalesData(invoice, company), company);
    return pdfResponse(bytes, `${invoice.number}.pdf`, req.nextUrl.searchParams.has('download'));
  } catch (error) {
    console.error('[Invoice PDF] Render failed:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
