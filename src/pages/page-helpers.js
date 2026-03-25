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
  return `<section class="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-600">${escapeHtml(message)}</section>`;
}

export function renderProductSectionHeader({ product, productCampaign }) {
  const backHref = productCampaign?.id ? `#/campaigns/${productCampaign.id}` : "#/campaigns";
  const productName = product?.name || "Producto";

  return `
    <div class="flex items-center justify-between gap-3 px-1">
      <a href="${backHref}" class="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">← Productos</a>
      <span class="w-[75%] max-w-[75%] truncate rounded-full bg-slate-100 px-3 py-1 text-right text-xs font-semibold text-slate-500">${escapeHtml(productName)}</span>
    </div>
  `;
}

export function renderField(name, label, type = "text", required = true) {
  const fieldId = `field-${name}`;
  return `
    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-700">${label}</span>
      <input id="${fieldId}" name="${name}" type="${type}" autocomplete="off" ${required ? "required" : ""} class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
    </label>
  `;
}

export function registrationTypeBadgeClass(type) {
  const normalized = normalizeSearch(type);

  if (normalized === "ponente") return "bg-sky-100 text-sky-800";
  if (normalized === "vip") return "bg-amber-100 text-amber-900";
  if (normalized === "invitado") return "bg-violet-100 text-violet-800";
  if (normalized === "asistente") return "bg-emerald-100 text-emerald-800";

  return "bg-slate-200 text-slate-700";
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
