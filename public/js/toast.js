// Toast notifications
import { $, escapeHTML } from './utils.js';

export function toast(type, title, msg) {
  const el = document.createElement('div');
  const color = type === 'good' ? 'rgba(52,211,153,.18)' : type === 'bad' ? 'rgba(251,113,133,.18)' : 'rgba(251,191,36,.16)';
  const dot = type === 'good' ? 'bg-emerald-300/80' : type === 'bad' ? 'bg-rose-300/80' : 'bg-amber-300/80';
  el.className = 'card rounded-2xl p-4 border border-white/10';
  el.innerHTML = `
    <div class="flex gap-3">
      <div class="mt-1 w-2.5 h-2.5 rounded-full ${dot}"></div>
      <div class="min-w-0">
        <div class="text-sm font-semibold" style="color: rgba(255,255,255,.88)">${escapeHTML(title)}</div>
        <div class="text-xs mt-1" style="color: rgba(255,255,255,.60)">${escapeHTML(msg)}</div>
      </div>
      <button class="ml-auto text-white/50 hover:text-white/80 text-xs" aria-label="Dismiss">✕</button>
    </div>
  `;
  el.style.background = `linear-gradient(180deg, ${color}, rgba(255,255,255,.03))`;
  const close = el.querySelector('button');
  close.addEventListener('click', () => el.remove());
  $('#toasts').appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
  }, 4200);
  setTimeout(() => el.remove(), 4900);
}
