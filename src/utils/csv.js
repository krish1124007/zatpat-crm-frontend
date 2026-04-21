// Tiny CSV exporter — escapes quotes/newlines, triggers a browser download.

import { paisaToRupees, formatDate } from './format.js';

function escape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCSV(filename, columns, rows) {
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = typeof c.get === 'function' ? c.get(row) : row[c.key];
          return escape(raw);
        })
        .join(',')
    )
    .join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convenience preset for cases.
export function exportCasesCSV(rows) {
  const columns = [
    { key: 'srNo', label: 'Sr No' },
    { key: 'customerName', label: 'Customer' },
    { key: 'phone', label: 'Phone' },
    { key: 'product', label: 'Product' },
    { key: 'bankName', label: 'Bank' },
    { key: 'channelName', label: 'Channel' },
    { key: 'fileNumber', label: 'File No' },
    { label: 'Handled By', get: (r) => r.handledBy?.name || '' },
    { key: 'referenceName', label: 'Reference' },
    { key: 'propertyType', label: 'Property Type' },
    { key: 'disbursementType', label: 'Disb. Type' },
    { key: 'currentStatus', label: 'Status' },
    { label: 'Loan Amount (₹)', get: (r) => paisaToRupees(r.loanAmount) },
    { label: 'Sanctioned (₹)', get: (r) => paisaToRupees(r.sanctionedAmount) },
    { label: 'Disbursed (₹)', get: (r) => paisaToRupees(r.disbursedAmount) },
    { label: 'Pending Payment (₹)', get: (r) => paisaToRupees(r.pendingPaymentAmount) },
    { label: 'Login Date', get: (r) => formatDate(r.loginDate) },
    { label: 'Sanction Date', get: (r) => formatDate(r.sanctionDate) },
    { label: 'Disbursement Date', get: (r) => formatDate(r.disbursementDate) },
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  downloadCSV(`zatpat-cases-${stamp}.csv`, columns, rows);
}
