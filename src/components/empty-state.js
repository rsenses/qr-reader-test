import { escapeHtml } from "../lib/html-utils";

const EMPTY_STATE_CLASS =
  "rounded-[32px] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] p-8 text-center text-[color:var(--text-base)] shadow-[var(--shadow-soft)]";

export function renderEmptyState(message) {
  return `<section class="${EMPTY_STATE_CLASS}">${escapeHtml(message)}</section>`;
}
