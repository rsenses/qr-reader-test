import { renderInlineAlert } from "../components/inline-alert";

export function renderInlineError(message) {
  return renderInlineAlert(message, { className: "mt-4" });
}

export function renderInlineLastValidation(lastValidation, renderLastValidationCard) {
  return renderLastValidationCard?.(lastValidation) || "";
}

export function syncLastValidationNotification(
  lastValidation,
  renderLastValidationCard,
  syncLastValidationUI,
) {
  syncLastValidationUI?.(lastValidation, renderLastValidationCard);
}

export function showScannerOverlayNotification(pendingOverlay, showOverlay) {
  if (!pendingOverlay) return;
  showOverlay?.(pendingOverlay.type, pendingOverlay.title, pendingOverlay.subtitle);
}

export function showPendingScannerOverlayNotification(
  pendingOverlay,
  scannerState,
  { showOverlay, hideOverlay, setStatus, onResetPendingOverlay } = {},
) {
  if (!pendingOverlay) return;

  showOverlay?.(pendingOverlay.type, pendingOverlay.title, pendingOverlay.subtitle);

  if (scannerState?.overlayTimer) {
    clearTimeout(scannerState.overlayTimer);
  }

  if (!scannerState) return;

  scannerState.overlayTimer = setTimeout(() => {
    hideOverlay?.();
    onResetPendingOverlay?.();
    setStatus?.("escaneando");
  }, 2000);
}

export function renderUpdateNotification(updateAvailable, renderUpdateBanner) {
  return renderUpdateBanner?.(updateAvailable) || "";
}

export function renderPageLoadingNotification() {
  return `
    <section class="rounded-[32px] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] p-8 text-center text-[color:var(--text-base)] shadow-[var(--shadow-soft)] flex min-h-[50vh] items-center justify-center">
      <div>
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
        <p class="mt-4 text-sm font-medium text-slate-600">Cargando datos...</p>
      </div>
    </section>
  `;
}
