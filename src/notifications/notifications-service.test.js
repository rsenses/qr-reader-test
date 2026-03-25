import { describe, expect, it, vi } from "vitest";

import {
  showInfoNotification,
  showResultNotification,
  showScannerNotification,
} from "./notifications-service";

describe("notifications-service", () => {
  it("delegates result notifications to sync helpers", () => {
    const syncLastValidationUI = vi.fn();
    const renderLastValidationCard = vi.fn();

    showResultNotification(
      { channel: "last-validation", lastValidation: { ok: true } },
      { syncLastValidationUI, renderLastValidationCard },
    );

    expect(syncLastValidationUI).toHaveBeenCalledWith(
      { ok: true },
      renderLastValidationCard,
    );

    renderLastValidationCard.mockReturnValue("<article>ok</article>");
    expect(
      showResultNotification(
        { channel: "inline-last-validation", lastValidation: { ok: true } },
        { renderLastValidationCard },
      ),
    ).toBe("<article>ok</article>");
  });

  it("delegates scanner notifications to the right helper", () => {
    const setStatus = vi.fn();
    const showOverlay = vi.fn();

    showScannerNotification({ channel: "status", text: "escaneando" }, { setStatus });
    showScannerNotification(
      {
        channel: "overlay",
        pendingOverlay: { type: "success", title: "OK", subtitle: "QR" },
      },
      { showOverlay },
    );

    expect(setStatus).toHaveBeenCalledWith("escaneando");
    expect(showOverlay).toHaveBeenCalledWith("success", "OK", "QR");
  });

  it("renders and delegates info notifications", () => {
    const renderUpdateBanner = vi.fn().mockReturnValue("<section>banner</section>");
    const showScannerLoading = vi.fn();

    expect(
      showInfoNotification(
        { channel: "update-banner", updateAvailable: true },
        { renderUpdateBanner },
      ),
    ).toBe("<section>banner</section>");

    expect(
      showInfoNotification({ channel: "login-error-inline", message: "Error" }),
    ).toContain("Error");

    showInfoNotification(
      { channel: "scanner-loading-show", text: "Abriendo camara..." },
      { showScannerLoading },
    );

    expect(showScannerLoading).toHaveBeenCalledWith("Abriendo camara...");
  });
});
