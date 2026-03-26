import { escapeHtml, normalizeSearch } from "../lib/domain-utils";

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
  return `<section class="ui-empty-state">${escapeHtml(message)}</section>`;
}

export function renderInlineNote(message) {
  return `<p class="ui-inline-note">${escapeHtml(message)}</p>`;
}

export function renderProductSectionHeader({ product, productCampaign }) {
  const backHref = productCampaign?.id ? `#/campaigns/${productCampaign.id}` : "#/campaigns";
  const productName = product?.name || "Producto";

  return `
    <div class="flex items-center justify-between gap-3 px-1">
      <a href="${backHref}" class="ui-back-link shrink-0 inline-flex items-center gap-2 text-sm font-semibold">← Productos</a>
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
  const sizeClass = size === "md" ? "ui-badge--md" : "ui-badge--sm";
  const classes = [`ui-badge`, `ui-badge--${tone}`, sizeClass, className].filter(Boolean).join(" ");
  return `<span class="${classes}">${escapeHtml(label)}</span>`;
}

export function registrationTypeBadgeClass(type) {
  const normalized = normalizeSearch(type);

  if (normalized === "ponente") return "ui-badge ui-badge--type-speaker ui-badge--md";
  if (normalized === "vip") return "ui-badge ui-badge--type-vip ui-badge--md";
  if (normalized === "invitado") return "ui-badge ui-badge--type-guest ui-badge--md";
  if (normalized === "asistente") return "ui-badge ui-badge--type-attendee ui-badge--md";

  return "ui-badge ui-badge--neutral ui-badge--md";
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
  return `
    <article class="ui-validation-card ui-validation-card--${tone}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          ${eyebrow ? `<p class="ui-validation-card__eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
          ${title ? `<h3 class="ui-validation-card__title">${escapeHtml(title)}</h3>` : ""}
        </div>
        ${statusLabel ? renderBadge(statusLabel, { tone: statusTone, className: "shrink-0" }) : ""}
      </div>

      ${registrationType ? `<div class="mt-3"><span class="${registrationTypeBadgeClass(registrationType)}">${escapeHtml(registrationType)}</span></div>` : ""}
      ${detailsHtml ? `<div class="ui-detail-list mt-4">${detailsHtml}</div>` : ""}
      ${message ? `<p class="ui-validation-card__message">${escapeHtml(message)}</p>` : ""}
    </article>
  `;
}
