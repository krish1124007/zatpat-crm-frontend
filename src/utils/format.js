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
