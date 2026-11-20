'use client';

import type { BankAccount } from '@/lib/types';

type Props = {
  /** Per-document override. `null`/`undefined` means the company defaults are used. */
  value: BankAccount[] | null | undefined;
  /** Company profile bank accounts (Settings → Banking Details). */
  defaults: BankAccount[];
  onChange: (next: BankAccount[] | null) => void;
};

const emptyAccount = (): BankAccount => ({
  bankName: '',
  branch: '',
  currency: 'USD',
  accountNumber: '',
});

const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm';

export default function DocumentBankDetails({ value, defaults, onChange }: Props) {
  const customized = Array.isArray(value);
  const accounts = customized ? value : defaults;

  const update = (index: number, field: keyof BankAccount, fieldValue: string) => {
    onChange(accounts.map((item, i) => (i === index ? { ...item, [field]: fieldValue } : item)));
  };

  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Bank Details</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {customized
              ? 'Custom for this document only.'
              : 'Using company defaults from Settings.'}
          </p>
        </div>
        {customized ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded-button border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Reset to Defaults
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChange(defaults.map((account) => ({ ...account })))}
            className="shrink-0 rounded-button border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Edit for this document
          </button>
        )}
      </div>

      {!customized && (
        <div className="space-y-1 text-xs text-zinc-600">
          {defaults.length === 0 ? (
            <p className="text-zinc-400">No bank accounts set in Settings.</p>
          ) : (
            defaults.map((account, index) => (
              <p key={`${account.bankName}-${index}`}>
                <span className="font-semibold text-zinc-700">{account.bankName || 'Bank'}</span>
                {account.currency && ` · ${account.currency}`}
                {account.accountNumber && ` · ${account.accountNumber}`}
              </p>
            ))
          )}
        </div>
      )}

      {customized && (
        <div className="space-y-3">
          {accounts.length === 0 && (
            <p className="text-xs text-zinc-400">No bank details will be printed on this document.</p>
          )}
          {accounts.map((account, index) => (
            <div key={index} className="rounded-lg bg-zinc-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-600">Account {index + 1}</p>
                <button
                  type="button"
                  onClick={() => onChange(accounts.filter((_, i) => i !== index))}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-zinc-500">Bank Name</span>
                  <input
                    value={account.bankName}
                    onChange={(e) => update(index, 'bankName', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. CABS"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-zinc-500">Branch</span>
                  <input
                    value={account.branch}
                    onChange={(e) => update(index, 'branch', e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-zinc-500">Currency</span>
                  <input
                    value={account.currency}
                    onChange={(e) => update(index, 'currency', e.target.value.toUpperCase())}
                    className={inputClass}
                    placeholder="USD"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-zinc-500">Account Number</span>
                  <input
                    value={account.accountNumber}
                    onChange={(e) => update(index, 'accountNumber', e.target.value)}
                    className={inputClass}
                    placeholder="Account number"
                  />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...accounts, emptyAccount()])}
            className="rounded-button border border-dashed border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            + Add bank account
          </button>
        </div>
      )}
    </div>
  );
}
