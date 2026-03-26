import { escapeHtml } from "../lib/html-utils";

export const inlineAlertClass =
  "rounded-[20px] border border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)]";

export function renderInlineAlert(message, { className = "" } = {}) {
  if (!message) return "";
  const classes = [inlineAlertClass, className].filter(Boolean).join(" ");
  return `<div class="${classes}">${escapeHtml(message)}</div>`;
}
