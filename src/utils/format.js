// Money is stored as paisa (integer) on the server. UI shows rupees with Indian formatting.

export function paisaToRupees(paisa) {
  if (paisa == null || paisa === '') return '';
  return Math.round(Number(paisa)) / 100;
}

export function rupeesToPaisa(rupees) {
  if (rupees == null || rupees === '') return 0;
  return Math.round(Number(rupees) * 100);
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatINR(paisa) {
  if (paisa == null || paisa === '') return '';
  return inrFormatter.format(paisaToRupees(paisa));
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Indian number-to-words (for loan amounts) ──
const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ' ' + ONES[o] : '');
}

// Convert an integer rupee amount to Indian-system words (Crore/Lakh/Thousand).
export function rupeesToWords(rupees) {
  let n = Math.floor(Number(rupees) || 0);
  if (n === 0) return 'Zero Rupees';
  if (n < 0) return 'Minus ' + rupeesToWords(-n);

  const parts = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (crore) parts.push(twoDigitsToWords(crore) + ' Crore');
  if (lakh) parts.push(twoDigitsToWords(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigitsToWords(thousand) + ' Thousand');
  if (hundred) parts.push(ONES[hundred] + ' Hundred');
  if (rest) parts.push(twoDigitsToWords(rest));

  return parts.join(' ').trim() + ' Rupees';
}

// Convenience: take a paisa integer and return the amount in words.
export function paisaToWords(paisa) {
  if (paisa == null || paisa === '') return '';
  return rupeesToWords(paisaToRupees(paisa));
}

// Convert a Date to "YYYY-MM-DD" for <input type="date">.
export function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
