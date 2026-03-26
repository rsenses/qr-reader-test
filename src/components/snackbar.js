import { escapeHtml } from "../lib/html-utils";

export function renderSnackbar(snackbar) {
  if (!snackbar?.message) return "";

  const toneClass =
    snackbar.tone === "success"
      ? "snackbar--success"
      : snackbar.tone === "neutral"
        ? "snackbar--neutral"
        : "snackbar--error";

  return `
    <div class="snackbar-wrap" aria-live="polite" aria-atomic="true">
      <div class="snackbar ${toneClass}" role="status">
        <span class="snackbar__message">${escapeHtml(snackbar.message)}</span>
        <button type="button" class="snackbar__close" aria-label="Cerrar mensaje" data-action="dismiss-snackbar">✕</button>
      </div>
    </div>
  `;
}
