export function selectPreferredCamera(cameras = []) {
  return (
    cameras.find((camera) => /back|rear|environment/gi.test(camera.label)) ||
    cameras[cameras.length - 1] ||
    null
  );
}

export function getClampedZoomValue(nextZoom, zoomCaps = {}) {
  const min = zoomCaps.min ?? 1;
  const max = zoomCaps.max ?? nextZoom;
  const step = zoomCaps.step ?? 0.1;
  const clamped = Math.max(min, Math.min(max, nextZoom));
  const precision = String(step).split(".")[1]?.length ?? 0;

  return Number((Math.round(clamped / step) * step).toFixed(precision));
}

export function createScannerController({
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  renderIcon,
  onScanSuccess,
  onScanFailure,
  showStatus,
  showLoading,
  hideLoading,
  hideOverlay,
  onAutoStartError,
}) {
  const state = {
    html5QrCode: null,
    isRunning: false,
    track: null,
    torchOn: false,
    currentZoom: null,
    zoomCaps: null,
    lastText: null,
    lastTs: 0,
    processingResult: false,
    overlayTimer: null,
    boundProductId: null,
  };

  function bindScannerControls() {
    const torchBtn = document.getElementById("torchBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");

    if (!(torchBtn && zoomInBtn && zoomOutBtn)) return;

    torchBtn.onclick = async () => {
      try {
        await setTorch(!state.torchOn);
      } catch (error) {
        console.error(error);
        showStatus("linterna no soportada o no disponible");
      }
    };

    zoomInBtn.onclick = async () => {
      try {
        await setZoom((state.currentZoom ?? 1) + (state.zoomCaps?.step ?? 0.1));
      } catch (error) {
        console.error(error);
        showStatus("zoom no soportado");
      }
    };

    zoomOutBtn.onclick = async () => {
      try {
        await setZoom((state.currentZoom ?? 1) - (state.zoomCaps?.step ?? 0.1));
      } catch (error) {
        console.error(error);
        showStatus("zoom no soportado");
      }
    };
  }

  async function setupTrackControls() {
    const video = document.querySelector("#reader video");
    if (!video || !video.srcObject) return;

    const stream = video.srcObject;
    state.track = stream.getVideoTracks()[0];
    if (!state.track) return;

    const capabilities = state.track.getCapabilities
      ? state.track.getCapabilities()
      : {};
    const torchBtn = document.getElementById("torchBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");

    if (capabilities && "torch" in capabilities && torchBtn) {
      torchBtn.hidden = false;
      torchBtn.innerHTML = renderIcon("flash");
      torchBtn.classList.toggle("is-active", state.torchOn);
    }

    if (capabilities && capabilities.zoom && zoomInBtn && zoomOutBtn) {
      state.zoomCaps = capabilities.zoom;
      state.currentZoom =
        state.track.getSettings?.().zoom ?? state.zoomCaps.min ?? 1;
      zoomInBtn.hidden = false;
      zoomOutBtn.hidden = false;
    }
  }

  async function setTorch(enabled) {
    if (!state.track) return;
    await state.track.applyConstraints({ advanced: [{ torch: enabled }] });
    state.torchOn = enabled;
    const torchBtn = document.getElementById("torchBtn");
    if (torchBtn) {
      torchBtn.innerHTML = renderIcon("flash");
      torchBtn.classList.toggle("is-active", state.torchOn);
    }
  }

  async function setZoom(nextZoom) {
    if (!state.track || !state.zoomCaps) return;

    const snapped = getClampedZoomValue(nextZoom, state.zoomCaps);

    await state.track.applyConstraints({ advanced: [{ zoom: snapped }] });
    state.currentZoom = snapped;
  }

  async function startScanner() {
    if (state.isRunning || !state.html5QrCode) return;

    const html5QrCode = state.html5QrCode;

    showStatus("pidiendo acceso a camara...");
    const cameras = await Html5Qrcode.getCameras();
    if (!html5QrCode || state.html5QrCode !== html5QrCode) return;

    if (!cameras || cameras.length === 0) {
      throw new Error("No se han encontrado camaras");
    }

    const selectedCamera = selectPreferredCamera(cameras);

    await html5QrCode.start(
      { deviceId: { exact: selectedCamera.id } },
      {
        fps: 12,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.floor(
            Math.min(viewfinderWidth, viewfinderHeight) * 0.72,
          );
          return { width: edge, height: edge };
        },
        aspectRatio: 1.3333333,
        disableFlip: true,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      onScanSuccess,
      onScanFailure,
    );

    if (state.html5QrCode !== html5QrCode) return;

    state.isRunning = true;
    hideLoading();
    showStatus("escaneando");
    await setupTrackControls();
  }

  async function autoStartScanner() {
    if (state.isRunning || !state.html5QrCode) return;

    showLoading("Abriendo camara...");
    try {
      await startScanner();
    } catch (error) {
      console.error(error);
      hideLoading();
      onAutoStartError();
    }
  }

  async function stopScanner() {
    if (!state.isRunning || !state.html5QrCode) return;

    if (state.overlayTimer) {
      clearTimeout(state.overlayTimer);
      state.overlayTimer = null;
    }

    hideOverlay();
    await state.html5QrCode.stop();
    await state.html5QrCode.clear();

    state.isRunning = false;
    state.track = null;
    state.torchOn = false;
    state.currentZoom = null;
    state.zoomCaps = null;
    state.processingResult = false;
    state.lastText = null;
    state.lastTs = 0;

    const torchBtn = document.getElementById("torchBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const zoomOutBtn = document.getElementById("zoomOutBtn");

    if (torchBtn) torchBtn.hidden = true;
    if (zoomInBtn) zoomInBtn.hidden = true;
    if (zoomOutBtn) zoomOutBtn.hidden = true;
    showStatus("camara parada");
  }

  async function destroyScanner() {
    if (state.isRunning) {
      try {
        await stopScanner();
      } catch (error) {
        console.error(error);
      }
    }

    if (state.html5QrCode) {
      try {
        await state.html5QrCode.clear();
      } catch (error) {
        void error;
      }
    }

    state.html5QrCode = null;
    state.boundProductId = null;
  }

  async function setupScanner({ product, autoStart = false } = {}) {
    if (!product || state.boundProductId === product.id) {
      bindScannerControls();
      if (autoStart) {
        await autoStartScanner();
      }
      return;
    }

    state.html5QrCode = new Html5Qrcode("reader");
    state.boundProductId = product.id;
    bindScannerControls();

    if (autoStart) {
      await autoStartScanner();
    }
  }

  return {
    state,
    setupScanner,
    autoStartScanner,
    startScanner,
    stopScanner,
    destroyScanner,
  };
}
