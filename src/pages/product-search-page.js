import {
  escapeAttribute,
  escapeHtml,
  metadataText,
  normalizeSearch,
} from "../lib/domain-utils";
import {
  emptyState,
  registrationTypeBadgeClass,
  renderIcon,
  renderProductSectionHeader,
  renderResultDetails,
} from "./page-helpers";

export function renderSearchResults({ searchQuery, searchResults, hasEnoughChars }) {
  if (!searchQuery) {
    return `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">Todavia no has escrito nada.</p>`;
  }

  if (!hasEnoughChars) {
    return `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">Introduce al menos 2 caracteres.</p>`;
  }

  if (!searchResults.length) {
    return `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No hay resultados.</p>`;
  }

  return searchResults
    .map(
      (attendee) => `
    <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">${escapeHtml(attendee.name)}</h3>
          <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.email)}</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${attendee.status === "paid" ? "bg-slate-200 text-slate-700" : "bg-[color:var(--accent-faint)] text-[color:var(--accent-strong)]"}">${escapeHtml(attendee.status)}</span>
      </div>
      <p class="mt-3 text-sm text-slate-600">${escapeHtml(attendee.phone)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.company)} · ${escapeHtml(attendee.position)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.registrationType)}</p>
      <p class="mt-2 text-xs text-slate-500">${escapeHtml(metadataText(attendee.metadata))}</p>
      <button type="button" data-action="validate-attendee" data-qrcode="${escapeAttribute(attendee.qrCode)}" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Validar inscrito</button>
    </article>
  `,
    )
    .join("");
}

export function renderSearchValidationCard(searchValidation) {
  if (!searchValidation) return "";

  const { ok, message, attendee } = searchValidation;

  if (!ok) {
    return `
      <article class="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Error de validacion</p>
        ${attendee ? `<h3 class="mt-2 font-heading text-2xl text-slate-900">${escapeHtml(attendee.name)}</h3><div class="mt-3"><span class="inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${registrationTypeBadgeClass(attendee.registrationType)}">${escapeHtml(attendee.registrationType)}</span></div><div class="mt-4 grid gap-2 text-sm text-slate-700">${renderResultDetails(attendee)}</div>` : ""}
        <p class="mt-4 text-sm font-medium text-rose-800">${escapeHtml(message)}</p>
      </article>
    `;
  }

  if (!attendee) return "";

  return `
    <article class="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Validado</p>
          <h3 class="mt-2 font-heading text-2xl text-slate-900">${escapeHtml(attendee.name)}</h3>
        </div>
        <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">${escapeHtml(message || "OK")}</span>
      </div>

      <div class="mt-3">
        <span class="inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${registrationTypeBadgeClass(attendee.registrationType)}">${escapeHtml(attendee.registrationType)}</span>
      </div>

      <div class="mt-4 grid gap-2 text-sm text-slate-700">
        ${renderResultDetails(attendee)}
      </div>
    </article>
  `;
}

export function renderProductSearchPage({
  product,
  productCampaign,
  searchQuery,
  searchResults,
  searchValidation,
}) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  const hasEnoughChars = normalizeSearch(searchQuery).length >= 2;

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 class="section-title font-heading text-2xl text-slate-900">Buscar inscritos</h2>

        <div class="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input id="manualSearchInput" value="${escapeAttribute(searchQuery)}" placeholder="Nombre, email o empresa" class="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none" />
          <button type="button" data-action="clear-search" aria-label="Limpiar busqueda" class="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 ${searchQuery ? "" : "invisible"}">${renderIcon("close")}</button>
        </div>

        <div id="manualSearchResults" class="mt-4 space-y-3">
          ${renderSearchResults({ searchQuery, searchResults, hasEnoughChars })}
        </div>

        <div id="searchValidationRegion" class="mt-4">${renderSearchValidationCard(searchValidation)}</div>

      </article>
    </section>
  `;
}
