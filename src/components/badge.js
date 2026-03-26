import { escapeHtml } from "../lib/html-utils";
import { normalizeSearch } from "../lib/search-utils";

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

export function renderBadge(label, { tone = "neutral", size = "sm", className = "" } = {}) {
  const sizeClass = BADGE_SIZE_CLASS[size] || BADGE_SIZE_CLASS.sm;
  const toneClass = BADGE_TONE_CLASS[tone] || BADGE_TONE_CLASS.neutral;
  const classes = [BADGE_BASE_CLASS, sizeClass, toneClass, className].filter(Boolean).join(" ");

  return `<span class="${classes}"><span class="min-w-0 truncate">${escapeHtml(label)}</span></span>`;
}

export function getRegistrationTypeBadgeClass(type) {
  const normalized = normalizeSearch(type);

  if (normalized === "ponente") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.speaker}`;
  if (normalized === "vip") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.vip}`;
  if (normalized === "invitado") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.guest}`;
  if (normalized === "asistente") return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.attendee}`;

  return `${BADGE_BASE_CLASS} ${BADGE_SIZE_CLASS.md} ${BADGE_TONE_CLASS.neutral}`;
}
