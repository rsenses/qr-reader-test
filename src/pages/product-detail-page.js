import {
  emptyState,
  renderIcon,
  renderProductSectionHeader,
  renderResultDetails,
  renderValidationCard,
} from "./page-helpers";

export function renderLastValidationCard(lastValidation) {
  if (!lastValidation?.attendee) return "";

  const { attendee, ok, message } = lastValidation;

  return renderValidationCard({
    tone: ok ? "success" : "neutral",
    eyebrow: ok ? "Validado" : "Ultimo intento",
    title: attendee.name,
    statusLabel: message || (ok ? "OK" : "Error"),
    statusTone: ok ? "success-soft" : "neutral-soft",
    registrationType: attendee.registrationType,
    detailsHtml: renderResultDetails(attendee),
  });
}

export function renderProductDetailPage({ product, productCampaign, lastValidation }) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[28px] p-3 sm:p-4">
          <div class="space-y-4">
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
