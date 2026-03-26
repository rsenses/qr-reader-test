import {
  escapeAttribute,
  escapeHtml,
  metadataText,
  normalizeSearch,
} from "../lib/domain-utils";
import {
  emptyState,
  renderBadge,
  renderInlineNote,
  renderIcon,
  renderProductSectionHeader,
  renderResultDetails,
  renderValidationCard,
} from "./page-helpers";

export function renderSearchResults({ searchQuery, searchResults, hasEnoughChars }) {
  if (!searchQuery) {
    return renderInlineNote("Todavia no has escrito nada.");
  }

  if (!hasEnoughChars) {
    return renderInlineNote("Introduce al menos 2 caracteres.");
  }

  if (!searchResults.length) {
    return renderInlineNote("No hay resultados.");
  }

  return searchResults
    .map(
      (attendee) => `
    <article class="ui-list-card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">${escapeHtml(attendee.name)}</h3>
          <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.email)}</p>
        </div>
        ${renderBadge(attendee.status, { tone: attendee.status === "paid" ? "neutral" : "accent" })}
      </div>
      <p class="mt-3 text-sm text-slate-600">${escapeHtml(attendee.phone)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.company)} · ${escapeHtml(attendee.position)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.registrationType)}</p>
      <p class="mt-2 text-xs text-slate-500">${escapeHtml(metadataText(attendee.metadata))}</p>
      <button type="button" data-action="validate-attendee" data-qrcode="${escapeAttribute(attendee.qrCode)}" class="ui-button ui-button--dark ui-button--block mt-4">Validar inscrito</button>
    </article>
  `,
    )
    .join("");
}

export function renderSearchValidationCard(searchValidation) {
  if (!searchValidation) return "";

  const { ok, message, attendee } = searchValidation;

  if (!ok) {
    return renderValidationCard({
      tone: "error",
      eyebrow: "Error de validacion",
      title: attendee?.name,
      registrationType: attendee?.registrationType,
      detailsHtml: attendee ? renderResultDetails(attendee) : "",
      message,
    });
  }

  if (!attendee) return "";

  return renderValidationCard({
    tone: "success",
    eyebrow: "Validado",
    title: attendee.name,
    statusLabel: message || "OK",
    statusTone: "success-soft",
    registrationType: attendee.registrationType,
    detailsHtml: renderResultDetails(attendee),
  });
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

        <div class="ui-input-shell mt-4 flex items-center gap-2 px-3 py-2">
          <input id="manualSearchInput" value="${escapeAttribute(searchQuery)}" placeholder="Nombre, email o empresa" class="ui-input ui-input--bare min-w-0 flex-1 px-1 py-2" />
          <button type="button" data-action="clear-search" aria-label="Limpiar busqueda" class="ui-icon-button ${searchQuery ? "" : "invisible"}">${renderIcon("close")}</button>
        </div>

        <div id="manualSearchResults" class="mt-4 space-y-3">
          ${renderSearchResults({ searchQuery, searchResults, hasEnoughChars })}
        </div>

        <div id="searchValidationRegion" class="mt-4">${renderSearchValidationCard(searchValidation)}</div>

      </article>
    </section>
  `;
}
