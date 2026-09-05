export function createId() {
  return Math.random().toString(36).slice(2, 10);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMultilineText(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

export function normalizeDoctorName(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Dr.';
  return trimmed.startsWith('Dr.') ? trimmed : `Dr. ${trimmed}`;
}

export function formatSavedAt(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `₹${num.toFixed(2)}`;
}
