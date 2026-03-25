import { escapeHtml } from "../lib/domain-utils";
import {
  emptyState,
  registrationTypeBadgeClass,
  renderIcon,
  renderProductSectionHeader,
  renderResultDetails,
} from "./page-helpers";

export function renderLastValidationCard(lastValidation) {
  if (!lastValidation?.attendee) return "";

  const { attendee, ok, message } = lastValidation;

  return `
    <article class="rounded-[24px] border ${ok ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"} p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] ${ok ? "text-emerald-700" : "text-slate-500"}">${ok ? "Validado" : "Ultimo intento"}</p>
          <h3 class="mt-2 font-heading text-2xl text-slate-900">${escapeHtml(attendee.name)}</h3>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-white text-emerald-700" : "bg-white text-slate-700"}">${escapeHtml(message || (ok ? "OK" : "Error"))}</span>
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

export function renderProductDetailPage({ product, productCampaign, lastValidation }) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[28px] border border-white/70 bg-white/90 p-3 shadow-sm sm:p-4">
          <div class="space-y-3">
             <div class="reader-shell relative overflow-hidden rounded-[28px] bg-black shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
              <div class="scanner-controls" aria-label="Controles de camara">
                <button id="torchBtn" type="button" hidden class="scanner-control scanner-control--primary" aria-label="Linterna">${renderIcon("flash")}</button>
                <div class="scanner-zoom-controls">
                  <button id="zoomOutBtn" type="button" hidden class="scanner-control" aria-label="Alejar zoom">-</button>
                  <button id="zoomInBtn" type="button" hidden class="scanner-control" aria-label="Acercar zoom">+</button>
                </div>
              </div>
                <div id="scannerLoading" class="scanner-loading" aria-live="polite">
                  <div class="scanner-loading__spinner"></div>
                  <p id="scannerLoadingText" class="scanner-loading__text">Abriendo camara...</p>
                </div>
                <div id="reader" class="reader-frame min-h-[420px] w-full bg-black"></div>
                <div id="scanOverlay" class="scan-overlay hidden" aria-live="polite">
                 <div class="scan-overlay-card">
                   <div id="scanOverlayIcon" class="scan-overlay-icon">✓</div>
                   <div id="scanOverlayTitle" class="scan-overlay-title">Verificado correctamente</div>
                  <div id="scanOverlaySubtitle" class="scan-overlay-subtitle">QR leido y validado</div>
                </div>
              </div>
            </div>

            <div id="lastValidationRegion">${renderLastValidationCard(lastValidation)}</div>
          </div>
      </article>
    </section>
  `;
}
