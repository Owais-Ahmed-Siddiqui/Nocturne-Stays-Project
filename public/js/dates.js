// Default date pickers (check-in tomorrow, check-out +3 days)
import { $ } from './utils.js';

export function ensureDates() {
  const today = new Date();
  const in1 = new Date(today); in1.setDate(in1.getDate() + 1);
  const out2 = new Date(today); out2.setDate(out2.getDate() + 3);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const checkin = fmt(in1);
  const checkout = fmt(out2);
  for (const id of ['quickCheckin', 'bookCheckin']) {
    const el = $('#' + id);
    if (el && !el.value) el.value = checkin;
  }
  for (const id of ['quickCheckout', 'bookCheckout']) {
    const el = $('#' + id);
    if (el && !el.value) el.value = checkout;
  }
}
