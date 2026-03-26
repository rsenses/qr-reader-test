import { describe, expect, it, vi } from "vitest";

import { showPendingScannerOverlay } from "./scanner-ui";

describe("scanner-ui", () => {
  it("shows and clears pending scanner overlay with current timing", () => {
    vi.useFakeTimers();

    const showOverlay = vi.fn();
    const hideOverlay = vi.fn();
    const onResetPendingOverlay = vi.fn();
    const setStatus = vi.fn();
    const scannerState = { overlayTimer: null };

    showPendingScannerOverlay(
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
});
