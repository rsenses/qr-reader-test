import { renderBadge } from "../components/badge";
import { renderButton } from "../components/button";
import { renderCard } from "../components/card";
import { renderEmptyState } from "../components/empty-state";
import { renderInlineNote } from "../components/inline-note";
import { renderProductSectionHeader } from "../components/section-header";
import { renderValidationCard } from "../components/validation-card";
import {
  escapeAttribute,
  escapeHtml,
} from "../lib/html-utils";
import { metadataText } from "../lib/registration-utils";
import { normalizeSearch } from "../lib/search-utils";
import {
  simpleCardClass,
  renderIcon,
  renderResultDetails,
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
    <article class="${simpleCardClass}">
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
      ${renderButton("Validar inscrito", { type: "button", variant: "dark", block: true, className: "mt-4", attributes: `data-action="validate-attendee" data-qrcode="${escapeAttribute(attendee.qrCode)}"` })}
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
    return renderEmptyState("No encontramos el producto solicitado.");
  }

  const hasEnoughChars = normalizeSearch(searchQuery).length >= 2;
  const content = `
    <h2 class="font-heading text-2xl leading-[1.1] text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">Buscar inscritos</h2>

    <div class="mt-5 flex items-center gap-2 rounded-[1.45rem] border border-[color:var(--control-border)] bg-[color-mix(in_srgb,var(--control-bg)_86%,var(--surface-raised))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(15,23,42,0.02)] transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-[color:var(--control-border-strong)] focus-within:bg-[color-mix(in_srgb,var(--control-bg)_70%,var(--surface-raised))] focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_14%,transparent)]">
      <input id="manualSearchInput" value="${escapeAttribute(searchQuery)}" placeholder="Nombre, email o empresa" class="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-[color:var(--text-strong)] outline-none placeholder:text-[color:var(--text-faint)]" />
      <button type="button" data-action="clear-search" aria-label="Limpiar busqueda" class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-[color:var(--text-muted)] transition-[background-color,color,transform] duration-150 active:scale-[0.94] active:bg-[color:var(--control-bg-hover)] active:text-[color:var(--text-strong)] focus-visible:bg-[color:var(--control-bg-hover)] focus-visible:text-[color:var(--text-strong)] [-webkit-tap-highlight-color:transparent] ${searchQuery ? "" : "invisible"}">${renderIcon("close")}</button>
    </div>

    <div id="manualSearchResults" class="mt-5 space-y-3.5">
      ${renderSearchResults({ searchQuery, searchResults, hasEnoughChars })}
    </div>

    <div id="searchValidationRegion" class="mt-5">${renderSearchValidationCard(searchValidation)}</div>
  `;

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}
      ${renderCard(content, { className: "p-4 sm:p-5" })}
    </section>
  `;
}
