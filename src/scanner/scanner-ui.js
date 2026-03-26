export function setScannerStatus(text) {
  const loadingTextEl = document.getElementById("scannerLoadingText");
  if (loadingTextEl && text === "pidiendo acceso a camara...") {
    loadingTextEl.textContent = "Abriendo camara...";
  }
}

export function showScannerOverlay(type, title, subtitle) {
  const overlayEl = document.getElementById("scanOverlay");
  const overlayIconEl = document.getElementById("scanOverlayIcon");
  const overlayTitleEl = document.getElementById("scanOverlayTitle");
  const overlaySubtitleEl = document.getElementById("scanOverlaySubtitle");
  if (!(overlayEl && overlayIconEl && overlayTitleEl && overlaySubtitleEl)) return;

  overlayEl.classList.remove("hidden", "success", "error");
  overlayEl.classList.add(type);
  overlayIconEl.textContent = type === "success" ? "✓" : "✕";
  overlayTitleEl.textContent = title;
  overlaySubtitleEl.textContent = subtitle;
}

export function hideScannerOverlay() {
  const overlayEl = document.getElementById("scanOverlay");
  if (!overlayEl) return;
  overlayEl.classList.add("hidden");
  overlayEl.classList.remove("success", "error");
}

export function showPendingScannerOverlay(
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

export function showScannerLoading(text = "Abriendo camara...") {
  const loadingEl = document.getElementById("scannerLoading");
  const loadingTextEl = document.getElementById("scannerLoadingText");
  if (!loadingEl) return;
  loadingEl.classList.remove("hidden");
  if (loadingTextEl) loadingTextEl.textContent = text;
}

export function hideScannerLoading() {
  const loadingEl = document.getElementById("scannerLoading");
  if (!loadingEl) return;
  loadingEl.classList.add("hidden");
}
