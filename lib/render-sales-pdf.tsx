import { promises as fs } from 'fs';
import path from 'path';

import { renderSerializedDoc } from '@formepdf/core';
import { serialize } from '@formepdf/react';
import type { ReactElement } from 'react';

import {
  SalesDocument,
  type SalesDocumentData,
} from '@/components/pdf/documents/sales-document';
import type { CompanyProfile, Invoice, Quote } from '@/lib/types';

const LOGO_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/**
 * Resolve the company logo to something Forme can embed. Local `/public` paths
 * are inlined as data URIs; https URLs are fetched by Forme. Anything else
 * (SVG, odd schemes) is skipped and the company name is printed instead.
 */
async function resolveLogo(logoUrl: string | undefined): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  if (logoUrl.startsWith('https://')) return logoUrl;
  if (!logoUrl.startsWith('/')) return undefined;

  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.normalize(path.join(publicDir, logoUrl));
  const mime = LOGO_MIME[path.extname(filePath).toLowerCase()];
  if (!mime || !filePath.startsWith(publicDir + path.sep)) return undefined;

  try {
    const bytes = await fs.readFile(filePath);
    return `data:${mime};base64,${bytes.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export function invoiceToSalesData(invoice: Invoice, company: CompanyProfile): SalesDocumentData {
  return {
    kind: 'invoice',
    number: invoice.number,
    status: invoice.status,
    customer: invoice.customer,
    lineItems: invoice.lineItems,
    subtotal: invoice.subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    discount: invoice.discount,
    total: invoice.total,
    currency: invoice.currency,
    notes: invoice.notes,
    issueDate: invoice.issueDate,
    secondaryDate: invoice.dueDate,
    bankAccounts: invoice.bankAccounts ?? company.bankAccounts ?? [],
  };
}

export function quoteToSalesData(quote: Quote, company: CompanyProfile): SalesDocumentData {
  return {
    kind: 'quote',
    number: quote.number,
    status: quote.status,
    customer: quote.customer,
    lineItems: quote.lineItems,
    subtotal: quote.subtotal,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    discount: quote.discount,
    total: quote.total,
    currency: quote.currency,
    notes: quote.notes,
    issueDate: quote.issueDate,
    secondaryDate: quote.validUntil,
    bankAccounts: quote.bankAccounts ?? company.bankAccounts ?? [],
  };
}

/**
 * Serialize with the same `@formepdf/react` instance the templates import, then
 * hand plain JSON to the engine. `renderDocument()` from core imports its own
 * copy of `@formepdf/react`; when that copy differs from ours (bundlers, CJS/ESM
 * interop) `<Page>` identity checks fail and the PDF silently has zero pages.
 */
async function renderElement(element: ReactElement): Promise<Uint8Array> {
  return renderSerializedDoc(serialize(element) as unknown as Record<string, unknown>);
}

export async function renderSalesPdf(
  data: SalesDocumentData,
  company: CompanyProfile,
): Promise<Uint8Array> {
  const logoSrc = await resolveLogo(company.logoUrl);
  try {
    return await renderElement(<SalesDocument data={data} company={company} logoSrc={logoSrc} />);
  } catch (error) {
    // A remote logo that fails to download shouldn't block the document.
    if (!logoSrc) throw error;
    console.warn('[PDF] Rendering with logo failed, retrying without it:', error);
    return renderElement(<SalesDocument data={data} company={company} />);
  }
}
