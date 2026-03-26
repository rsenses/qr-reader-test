import { escapeHtml } from "../lib/html-utils";

const INLINE_NOTE_CLASS =
  "rounded-[20px] bg-[color:var(--surface-soft)] px-4 py-4 text-sm text-[color:var(--text-muted)]";

export function renderInlineNote(message) {
  return `<p class="${INLINE_NOTE_CLASS}">${escapeHtml(message)}</p>`;
}
