import { escapeHtml } from "../lib/html-utils";
import { getRegistrationTypeBadgeClass, renderBadge } from "./badge";

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

export function renderValidationCard({
  tone = "neutral",
  eyebrow,
  title,
  statusLabel,
  statusTone = tone,
  registrationType,
  detailsHtml = "",
  message,
} = {}) {
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

      ${registrationType ? `<div class="mt-3"><span class="${getRegistrationTypeBadgeClass(registrationType)}">${escapeHtml(registrationType)}</span></div>` : ""}
      ${detailsHtml ? `<div class="${DETAIL_LIST_CLASS}">${detailsHtml}</div>` : ""}
      ${message ? `<p class="${VALIDATION_MESSAGE_CLASS}">${escapeHtml(message)}</p>` : ""}
    </article>
  `;
}
