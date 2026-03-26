import { escapeHtml } from "../lib/html-utils";

export const simpleCardClass =
  "rounded-[22px] border border-[color:var(--control-border)] bg-[color:var(--control-bg)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[border-color,transform,box-shadow,background-color] duration-150";

export const interactiveCardClass = `${simpleCardClass} active:border-[color:var(--border-strong)] active:shadow-[var(--shadow-soft)] focus-visible:border-[color:var(--border-strong)] focus-visible:shadow-[var(--shadow-soft)]`;

export const imagePlaceholderClass =
  "flex h-48 items-center justify-center bg-[color:var(--surface-soft)] text-sm font-medium text-[color:var(--text-muted)]";

export const optionRowClass =
  "flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--control-border)] bg-[color:var(--control-bg)] px-4 py-3 text-[color:var(--text-base)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]";

export const progressTrackClass = "mt-3 h-3 overflow-hidden rounded-full bg-[color:var(--progress-track)]";

export const progressBarClass =
  "h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_15%,var(--progress-fill)),var(--progress-fill))]";

export function renderIcon(name) {
  const icons = {
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M7 12h10"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>',
    stats:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16v-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    flash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v6c0 4.4 2.9 8.4 7 9 4.1-.6 7-4.6 7-9V6l-7-3Z"/><path d="m9.5 12 1.7 1.7 3.3-3.7"/></svg>',
  };

  return icons[name] || "";
}

export function renderMetadataLines(metadata = []) {
  return metadata.length
    ? metadata
        .map(
          (item) =>
            `<p><strong>${escapeHtml(item.key)}:</strong> ${escapeHtml(item.value)}</p>`,
        )
        .join("")
    : "";
}

export function renderResultDetails(attendee) {
  const detailLines = [
    attendee.company ? `<p><strong>Empresa:</strong> ${escapeHtml(attendee.company)}</p>` : "",
    attendee.position ? `<p><strong>Cargo:</strong> ${escapeHtml(attendee.position)}</p>` : "",
  ].filter(Boolean);

  return `${detailLines.join("")}${renderMetadataLines(attendee.metadata)}`;
}
