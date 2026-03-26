import { escapeHtml, normalizeSearch } from "../lib/domain-utils";

const EMPTY_STATE_CLASS =
  "rounded-[32px] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] p-8 text-center text-[color:var(--text-base)] shadow-[var(--shadow-soft)]";

const INLINE_NOTE_CLASS =
  "rounded-[20px] bg-[color:var(--surface-soft)] px-4 py-4 text-sm text-[color:var(--text-muted)]";

const INLINE_ALERT_CLASS =
  "rounded-[20px] border border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] px-4 py-3 text-sm font-semibold text-[color:var(--accent-strong)]";

const BACK_LINK_CLASS =
  "inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-base)] transition-[color,transform] duration-150 active:-translate-x-px active:text-[color:var(--text-strong)] focus-visible:text-[color:var(--text-strong)] focus-visible:-translate-x-px";

const DETAIL_LIST_CLASS = "mt-4 grid gap-2 text-[0.93rem] text-[color:var(--text-base)]";

const VALIDATION_CARD_BASE_CLASS =
  "rounded-[22px] border p-4 shadow-[var(--shadow-soft)]";

const VALIDATION_CARD_TONE_CLASS = {
  neutral: "border-[color:var(--state-neutral-border)] bg-[color:var(--state-neutral-bg)] text-[color:var(--state-neutral-text)]",
  success: "border-[color:var(--state-success-border)] bg-[color:var(--state-success-bg)] text-[color:var(--state-success-text)]",
  error: "border-[color:var(--state-error-border)] bg-[color:var(--state-error-bg)] text-[color:var(--state-error-text)]",
};

const VALIDATION_EYEBROW_CLASS =
  "text-[0.72rem] font-bold uppercase tracking-[0.2em] opacity-90";

const VALIDATION_TITLE_CLASS =
  "mt-2 font-heading text-2xl leading-[1.15] text-slate-900";

const VALIDATION_MESSAGE_CLASS = "mt-4 text-[0.93rem] font-semibold";

const BADGE_BASE_CLASS =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-bold tracking-[0.01em] whitespace-nowrap";

const BADGE_SIZE_CLASS = {
  sm: "px-3 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

const BADGE_TONE_CLASS = {
  neutral: "bg-[color:var(--badge-neutral-bg)] text-[color:var(--badge-neutral-text)]",
  "neutral-soft": "bg-[color:var(--badge-neutral-bg)] text-[color:var(--badge-neutral-text)]",
  accent: "bg-[color:var(--accent-faint)] text-[color:var(--accent-strong)]",
  chip: "bg-[color:var(--badge-chip-bg)] text-[color:var(--badge-chip-text)]",
  success: "bg-[color:var(--badge-success-soft-bg)] text-[color:var(--badge-success-soft-text)]",
  "success-soft": "bg-[color:var(--badge-success-soft-bg)] text-[color:var(--badge-success-soft-text)]",
  error: "bg-[color:var(--badge-error-bg)] text-[color:var(--badge-error-text)]",
  speaker: "bg-[color:var(--type-speaker-bg)] text-[color:var(--type-speaker-text)]",
  vip: "bg-[color:var(--type-vip-bg)] text-[color:var(--type-vip-text)]",
  guest: "bg-[color:var(--type-guest-bg)] text-[color:var(--type-guest-text)]",
  attendee: "bg-[color:var(--type-attendee-bg)] text-[color:var(--type-attendee-text)]",
};

export const simpleCardClass =
  "rounded-[22px] border border-[color:var(--control-border)] bg-[color:var(--control-bg)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[border-color,transform,box-shadow,background-color] duration-150";

export const interactiveCardClass = `${simpleCardClass} active:border-[color:var(--border-strong)] active:shadow-[var(--shadow-soft)] focus-visible:border-[color:var(--border-strong)] focus-visible:shadow-[var(--shadow-soft)]`;

export const metricCardBaseClass = "rounded-[22px] p-4 shadow-[var(--shadow-soft)]";

export const metricCardLabelClass = "text-[0.72rem] font-bold uppercase tracking-[0.2em]";

export const imagePlaceholderClass =
  "flex h-48 items-center justify-center bg-[color:var(--surface-soft)] text-sm font-medium text-[color:var(--text-muted)]";

export const optionRowClass =
  "flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--control-border)] bg-[color:var(--control-bg)] px-4 py-3 text-[color:var(--text-base)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]";

export const inlineAlertClass = INLINE_ALERT_CLASS;

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

export function emptyState(message) {
  return `<section class="${EMPTY_STATE_CLASS}">${escapeHtml(message)}</section>`;
}

export function renderInlineNote(message) {
  return `<p class="${INLINE_NOTE_CLASS}">${escapeHtml(message)}</p>`;
}

export function renderProductSectionHeader({ product, productCampaign }) {
  const backHref = productCampaign?.id ? `#/campaigns/${productCampaign.id}` : "#/campaigns";
  const productName = product?.name || "Producto";

  return `
    <div class="flex items-center justify-between gap-3 px-1">
      <a href="${backHref}" class="${BACK_LINK_CLASS} shrink-0">← Productos</a>
      ${renderBadge(productName, {
        tone: "chip",
        className: "w-[75%] max-w-[75%] justify-end truncate text-right",
      })}
    </div>
  `;
}

export function renderField(name, label, type = "text", required = true) {
  const fieldId = `field-${name}`;
  return `
    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-700">${label}</span>
      <input id="${fieldId}" name="${name}" type="${type}" autocomplete="off" ${required ? "required" : ""} class="ui-input w-full" />
    </label>
  `;
}

export function renderBadge(label, { tone = "neutral", size = "sm", className = "" } = {}) {
  const sizeClass = BADGE_SIZE_CLASS[size] || BADGE_SIZE_CLASS.sm;
  const toneClass = BADGE_TONE_CLASS[tone] || BADGE_TONE_CLASS.neutral;
  const classes = [BADGE_BASE_CLASS, sizeClass, toneClass, className].filter(Boolean).join(" ");
  return `<span class="${classes}"><span class="min-w-0 truncate">${escapeHtml(label)}</span></span>`;
}

export function registrationTypeBadgeClass(type) {
  const normalized = normalizeSearch(type);

  if (normalized === "ponente") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.speaker}`;
  if (normalized === "vip") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.vip}`;
  if (normalized === "invitado") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.guest}`;
  if (normalized === "asistente") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.attendee}`;

  return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.neutral}`;
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
    attendee.phone ? `<p><strong>Telefono:</strong> ${escapeHtml(attendee.phone)}</p>` : "",
    attendee.taxId ? `<p><strong>DNI / NIF:</strong> ${escapeHtml(attendee.taxId)}</p>` : "",
  ].filter(Boolean);

  return `${detailLines.join("")}${renderMetadataLines(attendee.metadata)}`;
}

export function renderValidationCard({
  tone = "neutral",
  eyebrow,
  title,
  statusLabel,
  statusTone = tone,
  registrationType,
  detailsHtml = "",
  message,
}) {
  const toneClass = VALIDATION_CARD_TONE_CLASS[tone] || VALIDATION_CARD_TONE_CLASS.neutral;

  return `
    <article class="${VALIDATION_CARD_BASE_CLASS} ${toneClass}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          ${eyebrow ? `<p class="${VALIDATION_EYEBROW_CLASS}">${escapeHtml(eyebrow)}</p>` : ""}
          ${title ? `<h3 class="${VALIDATION_TITLE_CLASS}">${escapeHtml(title)}</h3>` : ""}
        </div>
        ${statusLabel ? renderBadge(statusLabel, { tone: statusTone, className: "shrink-0" }) : ""}
      </div>

      ${registrationType ? `<div class="mt-3"><span class="${registrationTypeBadgeClass(registrationType)}">${escapeHtml(registrationType)}</span></div>` : ""}
      ${detailsHtml ? `<div class="${DETAIL_LIST_CLASS}">${detailsHtml}</div>` : ""}
      ${message ? `<p class="${VALIDATION_MESSAGE_CLASS}">${escapeHtml(message)}</p>` : ""}
    </article>
  `;
}
