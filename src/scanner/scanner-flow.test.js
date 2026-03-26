import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createScannerFlow,
  resetScanProgress,
  shouldConfirmScan,
} from "./scanner-flow";

describe("scanner-flow helpers", () => {
  it("confirms repeated scans inside the confirmation window", () => {
    expect(
      shouldConfirmScan({
        decodedText: "qr-1",
        lastText: "qr-1",
        lastTs: 100,
        now: 600,
      }),
    ).toBe(true);

    expect(
      shouldConfirmScan({
        decodedText: "qr-1",
        lastText: "qr-2",
        lastTs: 100,
        now: 200,
      }),
    ).toBe(false);
  });

  it("resets scanner progress markers", () => {
    const scannerState = {
      processingResult: true,
      lastText: "qr-1",
      lastTs: 123,
    };

    resetScanProgress(scannerState);

    expect(scannerState).toEqual({
      processingResult: false,
      lastText: null,
      lastTs: 0,
    });
  });
});

describe("scanner-flow", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it("waits for a second matching read before validating", async () => {
    const scannerState = {
      processingResult: false,
      lastText: null,
      lastTs: 0,
      overlayTimer: null,
    };
    const showDetectedStatus = vi.fn();
    const validateQr = vi.fn();
    const flow = createScannerFlow({
      scannerState,
      nowMs: vi.fn().mockReturnValue(100),
      validateQr,
      refreshCurrentProduct: vi.fn(),
      onValidationSuccess: vi.fn(),
      onValidationError: vi.fn(),
      showVerifyingStatus: vi.fn(),
      showDetectedStatus,
      showSuccessStatus: vi.fn(),
      showErrorStatus: vi.fn(),
      hideOverlay: vi.fn(),
      showScanningStatus: vi.fn(),
    });

    flow.onScanSuccess("qr-1");

    expect(scannerState.lastText).toBe("qr-1");
    expect(scannerState.lastTs).toBe(100);
    expect(showDetectedStatus).toHaveBeenCalledTimes(1);
    expect(validateQr).not.toHaveBeenCalled();
  });

  it("runs validation and resumes scanning after success", async () => {
    vi.useFakeTimers();

    const scannerState = {
      processingResult: false,
      lastText: "qr-1",
      lastTs: 100,
      overlayTimer: null,
    };
    const refreshCurrentProduct = vi.fn().mockResolvedValue(undefined);
    const onValidationSuccess = vi.fn();
    const hideOverlay = vi.fn();
    const showScanningStatus = vi.fn();
    const flow = createScannerFlow({
      scannerState,
      nowMs: vi.fn().mockReturnValue(200),
      validateQr: vi.fn().mockResolvedValue({ ok: true, title: "OK" }),
      refreshCurrentProduct,
      onValidationSuccess,
      onValidationError: vi.fn(),
      showVerifyingStatus: vi.fn(),
      showDetectedStatus: vi.fn(),
      showSuccessStatus: vi.fn(),
      showErrorStatus: vi.fn(),
      hideOverlay,
      showScanningStatus,
    });

    flow.onScanSuccess("qr-1");
    await vi.runAllTimersAsync();

    expect(refreshCurrentProduct).toHaveBeenCalledTimes(1);
    expect(onValidationSuccess).toHaveBeenCalledWith({ ok: true, title: "OK" });
    expect(hideOverlay).toHaveBeenCalledTimes(1);
    expect(showScanningStatus).toHaveBeenCalledTimes(1);
    expect(scannerState.processingResult).toBe(false);
    expect(scannerState.lastText).toBeNull();
    expect(scannerState.lastTs).toBe(0);
  });

  it("handles validation errors and resumes scanning with the same timing", async () => {
    vi.useFakeTimers();

    const scannerState = {
      processingResult: false,
      lastText: "qr-1",
      lastTs: 100,
      overlayTimer: null,
    };
    const onValidationError = vi.fn();
    const hideOverlay = vi.fn();
    const showScanningStatus = vi.fn();
    const flow = createScannerFlow({
      scannerState,
      nowMs: vi.fn().mockReturnValue(200),
      validateQr: vi.fn().mockRejectedValue(new Error("Fallo")),
      refreshCurrentProduct: vi.fn(),
      onValidationSuccess: vi.fn(),
      onValidationError,
      showVerifyingStatus: vi.fn(),
      showDetectedStatus: vi.fn(),
      showSuccessStatus: vi.fn(),
      showErrorStatus: vi.fn(),
      hideOverlay,
      showScanningStatus,
    });

    flow.onScanSuccess("qr-1");
    await vi.runAllTimersAsync();

    expect(onValidationError).toHaveBeenCalledTimes(1);
    expect(onValidationError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(hideOverlay).toHaveBeenCalledTimes(1);
    expect(showScanningStatus).toHaveBeenCalledTimes(1);
    expect(scannerState.processingResult).toBe(false);
  });
});
