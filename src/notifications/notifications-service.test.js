import { describe, expect, it, vi } from "vitest";

import {
  renderInlineError,
  renderInlineLastValidation,
  renderPageLoadingNotification,
  renderUpdateNotification,
  showPendingScannerOverlayNotification,
  showScannerOverlayNotification,
  syncLastValidationNotification,
} from "./notifications-service";

describe("notifications-service", () => {
  it("renders and syncs validation notifications directly", () => {
    const syncLastValidationUI = vi.fn();
    const renderLastValidationCard = vi.fn().mockReturnValue("<article>ok</article>");

    syncLastValidationNotification(
      { ok: true },
      renderLastValidationCard,
      syncLastValidationUI,
    );

    expect(syncLastValidationUI).toHaveBeenCalledWith(
      { ok: true },
      renderLastValidationCard,
    );
    expect(renderInlineLastValidation({ ok: true }, renderLastValidationCard)).toBe(
      "<article>ok</article>",
    );
  });

  it("delegates scanner notifications with explicit helpers", () => {
    vi.useFakeTimers();

    const showOverlay = vi.fn();
    const hideOverlay = vi.fn();
    const onResetPendingOverlay = vi.fn();
    const setStatus = vi.fn();
    const scannerState = { overlayTimer: null };

    showScannerOverlayNotification(
      { type: "success", title: "OK", subtitle: "QR" },
      showOverlay,
    );
    showPendingScannerOverlayNotification(
      { type: "success", title: "OK", subtitle: "QR" },
      scannerState,
      { showOverlay, hideOverlay, setStatus, onResetPendingOverlay },
    );
    vi.runAllTimers();

    expect(showOverlay).toHaveBeenCalledWith("success", "OK", "QR");
    expect(hideOverlay).toHaveBeenCalled();
    expect(onResetPendingOverlay).toHaveBeenCalled();
    expect(setStatus).toHaveBeenCalledWith("escaneando");

    vi.useRealTimers();
  });

  it("renders and delegates info notifications directly", () => {
    const renderUpdateBanner = vi.fn().mockReturnValue("<section>banner</section>");

    expect(renderUpdateNotification(true, renderUpdateBanner)).toBe(
      "<section>banner</section>",
    );
    expect(renderInlineError("Error")).toContain("Error");
    expect(renderPageLoadingNotification()).toContain("Cargando datos...");
  });
});
