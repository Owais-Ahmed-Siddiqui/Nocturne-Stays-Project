// Pure helpers + tiny DOM utilities (no app logic)

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function moneyPKR(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('en-PK');
}

export function nightsBetween(checkin, checkout) {
  const a = new Date(checkin);
  const b = new Date(checkout);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function statusPill(status) {
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-amber-400/15 border-amber-300/25 text-amber-200' },
    approved: { label: 'Approved', cls: 'bg-emerald-400/15 border-emerald-300/25 text-emerald-200' },
    declined: { label: 'Declined', cls: 'bg-rose-400/15 border-rose-300/25 text-rose-200' },
    cancelled:{ label: 'Cancelled', cls: 'bg-white/10 border-white/20 text-white/70' }
  };
  const m = map[status] || map.pending;
  return `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${m.cls}"><span class="w-1.5 h-1.5 rounded-full" style="background: currentColor; opacity:.9"></span>${m.label}</span>`;
}
