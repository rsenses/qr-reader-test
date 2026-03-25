export function shouldConfirmScan({
  decodedText,
  lastText,
  lastTs,
  now,
  confirmationWindowMs = 500,
}) {
  return decodedText === lastText && now - lastTs <= confirmationWindowMs;
}

export function resetScanProgress(scannerState) {
  scannerState.processingResult = false;
  scannerState.lastText = null;
  scannerState.lastTs = 0;
}

export function createScannerFlow({
  scannerState,
  nowMs,
  validateQr,
  refreshCurrentProduct,
  onValidationSuccess,
  onValidationError,
  showDecodedResult,
  showVerifyingStatus,
  showDetectedStatus,
  showSuccessStatus,
  showErrorStatus,
  hideOverlay,
  showScanningStatus,
}) {
  function scheduleScanReset() {
    if (scannerState.overlayTimer) {
      clearTimeout(scannerState.overlayTimer);
    }

    scannerState.overlayTimer = setTimeout(() => {
      hideOverlay();
      showScanningStatus();
      resetScanProgress(scannerState);
    }, 2000);
  }

  async function handleScanResult(decodedText) {
    if (scannerState.processingResult) return;
    scannerState.processingResult = true;

    try {
      showDecodedResult(decodedText);
      showVerifyingStatus();

      const validation = await validateQr(decodedText);

      if (validation.ok) {
        await refreshCurrentProduct();
        onValidationSuccess(validation);
        showSuccessStatus();
      }

      scheduleScanReset();
    } catch (error) {
      onValidationError(error);
      showErrorStatus();
      scheduleScanReset();
    }
  }

  function onScanSuccess(decodedText) {
    if (scannerState.processingResult) return;

    const now = nowMs();
    if (
      shouldConfirmScan({
        decodedText,
        lastText: scannerState.lastText,
        lastTs: scannerState.lastTs,
        now,
      })
    ) {
      handleScanResult(decodedText);
      return;
    }

    scannerState.lastText = decodedText;
    scannerState.lastTs = now;
    showDetectedStatus();
  }

  return {
    onScanSuccess,
    handleScanResult,
  };
}
