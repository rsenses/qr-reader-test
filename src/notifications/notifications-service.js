import { escapeHtml } from "../lib/domain-utils";
import { inlineAlertClass } from "../pages/page-helpers";

function renderInlineError(message) {
  if (!message) return "";

  return `<div class="${inlineAlertClass} mt-4">${escapeHtml(message)}</div>`;
}

export function showResultNotification(notification, deps = {}) {
  if (notification.channel === "inline-last-validation") {
    return deps.renderLastValidationCard?.(notification.lastValidation) || "";
  }

  if (notification.channel === "last-validation") {
    const { lastValidation } = notification;
    deps.syncLastValidationUI?.(lastValidation, deps.renderLastValidationCard);
    return "";
  }

  if (notification.channel === "search-validation") {
    const { searchValidation } = notification;
    deps.syncSearchValidationUI?.(
      searchValidation,
      deps.renderSearchValidationCard,
    );
    return "";
  }

  return "";
}

export function showScannerNotification(notification, deps = {}) {
  if (notification.channel === "status") {
    deps.setStatus?.(notification.text);
    return;
  }

  if (notification.channel === "result") {
    deps.setResult?.(notification.text);
    return;
  }

  if (notification.channel === "overlay") {
    const overlay = notification.pendingOverlay;
    if (!overlay) return;
    deps.showOverlay?.(overlay.type, overlay.title, overlay.subtitle);
    return;
  }

  if (notification.channel === "pending-overlay") {
    const overlay = notification.pendingOverlay;
    if (!overlay) return;

    deps.showOverlay?.(overlay.type, overlay.title, overlay.subtitle);

    if (notification.scannerState?.overlayTimer) {
      clearTimeout(notification.scannerState.overlayTimer);
    }

    notification.scannerState.overlayTimer = setTimeout(() => {
      deps.hideOverlay?.();
      deps.onResetPendingOverlay?.();
      deps.setStatus?.("escaneando");
    }, 2000);
    return;
  }

  if (notification.channel === "overlay-hide") {
    deps.hideOverlay?.();
  }
}

export function showInfoNotification(notification, deps = {}) {
  if (notification.channel === "update-banner") {
    return deps.renderUpdateBanner?.(notification.updateAvailable) || "";
  }

  if (notification.channel === "page-loading") {
    return `
      <section class="rounded-[32px] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] p-8 text-center text-[color:var(--text-base)] shadow-[var(--shadow-soft)] flex min-h-[50vh] items-center justify-center">
        <div>
          <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
          <p class="mt-4 text-sm font-medium text-slate-600">Cargando datos...</p>
        </div>
      </section>
    `;
  }

  if (notification.channel === "login-error-inline") {
    return renderInlineError(notification.message);
  }

  if (notification.channel === "register-error-inline") {
    return renderInlineError(notification.message);
  }

  if (notification.channel === "scanner-loading-show") {
    deps.showScannerLoading?.(notification.text);
    return "";
  }

  if (notification.channel === "scanner-loading-hide") {
    deps.hideScannerLoading?.();
    return "";
  }

  return "";
}
