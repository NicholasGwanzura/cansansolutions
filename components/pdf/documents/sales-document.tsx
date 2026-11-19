import { Document, Page } from '@formepdf/react';

import { KeyValue } from '@/components/pdf/key-value/key-value';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/pdf/table/table';
import { PdfcnThemeProvider } from '@/components/pdf/theme-provider';
import { Fixed, Image, Text, View } from '@/lib/pdf-primitives';
import { professionalTheme } from '@/lib/pdf-themes/professional';
import type { PdfcnTheme } from '@/types/pdf-themes';
import type { BankAccount, CompanyProfile, CustomerInfo, LineItem } from '@/lib/types';

/**
 * Real (vector, selectable-text) PDF for invoices and quotes, rendered on the
 * server with Forme. Built from pdfcn components (see components/pdf/*).
 */

export type SalesDocumentKind = 'invoice' | 'quote';

export type SalesDocumentData = {
  kind: SalesDocumentKind;
  number: string;
  status: string;
  customer: CustomerInfo;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  issueDate: string;
  /** Due date for invoices, "valid until" for quotes. */
  secondaryDate: string;
  bankAccounts: BankAccount[];
};

const BRAND_RED = '#dc2626';

export const cansanTheme: PdfcnTheme = {
  ...professionalTheme,
  name: 'cansan',
  colors: {
    ...professionalTheme.colors,
    primary: BRAND_RED,
    accent: BRAND_RED,
    border: '#e4e4e7',
    muted: '#f4f4f5',
  },
  typography: {
    ...professionalTheme.typography,
    body: { ...professionalTheme.typography.body, fontFamily: 'Helvetica', fontSize: 10 },
    heading: { ...professionalTheme.typography.heading, fontFamily: 'Helvetica' },
  },
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  paid: { bg: '#dcfce7', fg: '#15803d' },
  accepted: { bg: '#dcfce7', fg: '#15803d' },
  overdue: { bg: '#fee2e2', fg: '#b91c1c' },
  rejected: { bg: '#fee2e2', fg: '#b91c1c' },
  sent: { bg: '#dbeafe', fg: '#1d4ed8' },
  cancelled: { bg: '#f4f4f5', fg: '#71717a' },
  expired: { bg: '#f4f4f5', fg: '#71717a' },
  draft: { bg: '#fef3c7', fg: '#b45309' },
};

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
}

const label = {
  color: '#71717a',
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: 0.8,
  marginBottom: 5,
  textTransform: 'uppercase',
} as const;

const small = { color: '#52525b', fontSize: 8.5, lineHeight: 1.45 } as const;

function SalesDocumentContent({
  data,
  company,
  logoSrc,
}: {
  data: SalesDocumentData;
  company: CompanyProfile;
  logoSrc?: string;
}) {
  const isInvoice = data.kind === 'invoice';
  const title = isInvoice ? 'Invoice' : 'Quotation';
  const status = STATUS_COLORS[data.status] ?? STATUS_COLORS.draft;
  const money = (value: number) => formatMoney(value, data.currency);
  const companyAddress = [company.addressLine1, company.addressLine2, [company.city, company.country].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join('\n');
  const registration = [
    company.tinNumber && `TIN ${company.tinNumber}`,
    company.vatNumber && `VAT ${company.vatNumber}`,
    company.vendorNumber && `Vendor ${company.vendorNumber}`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const totals = [
    { key: 'Subtotal', value: money(data.subtotal) },
    ...(data.taxRate > 0
      ? [{ key: `VAT (${data.taxRate}%)`, value: money(data.taxAmount) }]
      : []),
    ...(data.discount > 0
      ? [{ key: 'Discount', value: `-${money(data.discount)}`, valueColor: '#15803d' }]
      : []),
  ];

  return (
    <Document
      title={`${title} ${data.number}`}
      author={company.name}
      creator={company.name}
      lang="en"
    >
      <Page size="A4" margin={{ top: 40, right: 44, bottom: 56, left: 44 }}>
        <Fixed position="footer">
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#e4e4e7',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 8,
            }}
          >
            <Text style={{ color: '#a1a1aa', fontSize: 7.5 }}>
              {[company.name, company.phone, company.email, company.website].filter(Boolean).join('  ·  ')}
            </Text>
            <Text style={{ color: '#a1a1aa', fontSize: 7.5 }}>
              {`${data.number}  ·  Page {{pageNumber}} of {{totalPages}}`}
            </Text>
          </View>
        </Fixed>

        {/* Brand bar */}
        <View style={{ backgroundColor: BRAND_RED, height: 4, marginBottom: 22 }} />

        {/* Header: logo + company, document title + number */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ width: 260 }}>
            {logoSrc ? (
              <Image src={logoSrc} alt={company.name} height={40} style={{ marginBottom: 8 }} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{company.name}</Text>
            )}
            <Text style={{ ...small, fontWeight: 700, color: '#18181b' }}>{company.name}</Text>
            {companyAddress ? <Text style={small}>{companyAddress}</Text> : null}
            {registration ? (
              <Text style={{ ...small, color: '#71717a', marginTop: 3 }}>{registration}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ ...label, marginBottom: 2 }}>{title}</Text>
            <Text style={{ color: '#18181b', fontSize: 22, fontWeight: 700 }}>{data.number}</Text>
            <View
              style={{
                backgroundColor: status.bg,
                borderRadius: 3,
                marginTop: 6,
                paddingHorizontal: 7,
                paddingVertical: 2.5,
              }}
            >
              <Text
                style={{
                  color: status.fg,
                  fontSize: 7.5,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                }}
              >
                {data.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill to + document details */}
        <View
          style={{
            borderBottomColor: '#e4e4e7',
            borderBottomWidth: 1,
            borderTopColor: '#e4e4e7',
            borderTopWidth: 1,
            flexDirection: 'row',
            gap: 24,
            marginBottom: 20,
            paddingVertical: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={label}>{isInvoice ? 'Bill to' : 'Prepared for'}</Text>
            <Text style={{ color: '#18181b', fontSize: 10.5, fontWeight: 700, marginBottom: 2 }}>
              {data.customer.name}
            </Text>
            {data.customer.company ? <Text style={small}>{data.customer.company}</Text> : null}
            {data.customer.address ? <Text style={small}>{data.customer.address}</Text> : null}
            {[data.customer.phone, data.customer.email].filter(Boolean).length > 0 ? (
              <Text style={small}>{[data.customer.phone, data.customer.email].filter(Boolean).join('  ·  ')}</Text>
            ) : null}
          </View>
          <View style={{ width: 210 }}>
            <Text style={label}>Details</Text>
            <KeyValue
              size="sm"
              items={[
                { key: 'Issue date', value: formatDate(data.issueDate) },
                { key: isInvoice ? 'Due date' : 'Valid until', value: formatDate(data.secondaryDate) },
                { key: 'Currency', value: data.currency },
              ]}
              boldValue
            />
          </View>
        </View>

        {/* Line items */}
        <Table variant="primary-header" zebraStripe>
          <TableHeader>
            <TableRow header>
              <TableCell header width="52%">Description</TableCell>
              <TableCell header width="10%" align="center">Qty</TableCell>
              <TableCell header width="19%" align="right">Unit price</TableCell>
              <TableCell header width="19%" align="right">Amount</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lineItems.map((item, index) => (
              <TableRow key={item.id || index} stripe={index % 2 === 1}>
                <TableCell width="52%">{item.description}</TableCell>
                <TableCell width="10%" align="center">{String(item.quantity)}</TableCell>
                <TableCell width="19%" align="right">{money(item.unitPrice)}</TableCell>
                <TableCell width="19%" align="right">{money(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <View wrap={false} style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
          <View style={{ width: 230 }}>
            <KeyValue size="sm" items={totals} divided dividerColor="border" dividerThickness={0.5} />
            <View
              style={{
                alignItems: 'center',
                backgroundColor: '#18181b',
                borderRadius: 4,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 6,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {isInvoice ? (data.status === 'paid' ? 'Total paid' : 'Total due') : 'Quote total'}
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>{money(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment + notes */}
        <View wrap={false} style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
          {data.bankAccounts.length > 0 ? (
            <View style={{ backgroundColor: '#f4f4f5', borderRadius: 4, flex: 1, padding: 12 }}>
              <Text style={label}>{isInvoice ? 'Pay by bank transfer' : 'Bank details'}</Text>
              <Text style={{ ...small, color: '#18181b', fontWeight: 700, marginBottom: 6 }}>
                Account name: {company.name}
              </Text>
              {data.bankAccounts.map((account, index) => (
                <View key={`${account.bankName}-${index}`} style={{ marginBottom: index === data.bankAccounts.length - 1 ? 0 : 6 }}>
                  <Text style={{ ...small, color: '#18181b', fontWeight: 700 }}>
                    {[account.bankName, account.currency].filter(Boolean).join(' · ')}
                  </Text>
                  {account.accountNumber ? <Text style={small}>{`Account no. ${account.accountNumber}`}</Text> : null}
                  {account.branch ? <Text style={small}>{`Branch: ${account.branch}`}</Text> : null}
                </View>
              ))}
              {isInvoice ? (
                <Text style={{ ...small, color: '#71717a', marginTop: 6 }}>
                  {`Use ${data.number} as your payment reference.`}
                </Text>
              ) : null}
            </View>
          ) : null}
          {data.notes ? (
            <View style={{ borderColor: '#e4e4e7', borderRadius: 4, borderWidth: 1, flex: 1, padding: 12 }}>
              <Text style={label}>{isInvoice ? 'Notes' : 'Notes & terms'}</Text>
              <Text style={small}>{data.notes}</Text>
            </View>
          ) : null}
        </View>

      </Page>
    </Document>
  );
}

export function SalesDocument(props: {
  data: SalesDocumentData;
  company: CompanyProfile;
  logoSrc?: string;
}) {
  return (
    <PdfcnThemeProvider theme={cansanTheme}>
      <SalesDocumentContent {...props} />
    </PdfcnThemeProvider>
  );
}
