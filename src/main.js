import "./style.css";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

document.querySelector("#app").innerHTML = `
  <div class="container">
    <h1>Prueba lector QR</h1>

    <div class="controls">
      <button id="startBtn">Iniciar cámara</button>
      <button id="stopBtn" disabled>Parar cámara</button>
      <button id="torchBtn" hidden>Linterna</button>
      <button id="zoomOutBtn" hidden>-</button>
      <button id="zoomInBtn" hidden>+</button>
    </div>

    <p id="status">Estado: esperando</p>
    <p id="result">Último resultado: ninguno</p>

    <div class="reader-shell">
      <div id="reader"></div>

      <div id="scanOverlay" class="scan-overlay hidden" aria-live="polite">
        <div class="scan-overlay-card">
          <div id="scanOverlayIcon" class="scan-overlay-icon">✓</div>
          <div id="scanOverlayTitle" class="scan-overlay-title">Verificado correctamente</div>
          <div id="scanOverlaySubtitle" class="scan-overlay-subtitle">QR leído y validado</div>
        </div>
      </div>
    </div>
  </div>
`;

const readerId = "reader";
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const torchBtn = document.getElementById("torchBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

const overlayEl = document.getElementById("scanOverlay");
const overlayIconEl = document.getElementById("scanOverlayIcon");
const overlayTitleEl = document.getElementById("scanOverlayTitle");
const overlaySubtitleEl = document.getElementById("scanOverlaySubtitle");

const html5QrCode = new Html5Qrcode(readerId);

let isRunning = false;
let track = null;
let torchOn = false;
let currentZoom = null;
let zoomCaps = null;

let lastText = null;
let lastTs = 0;
let processingResult = false;
let overlayTimer = null;

function setStatus(text) {
  statusEl.textContent = `Estado: ${text}`;
}

function setResult(text) {
  resultEl.textContent = `Último resultado: ${text}`;
}

function nowMs() {
  return performance.now();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showOverlay(type, title, subtitle) {
  overlayEl.classList.remove("hidden", "success", "error");
  overlayEl.classList.add(type);

  overlayIconEl.textContent = type === "success" ? "✓" : "✕";
  overlayTitleEl.textContent = title;
  overlaySubtitleEl.textContent = subtitle;
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
  overlayEl.classList.remove("success", "error");
}

async function fakeValidateQr(decodedText) {
  // Demo temporal:
  // éxito si contiene "ok" o "valid"
  // error en cualquier otro caso
  await sleep(250);

  const normalized = decodedText.trim().toLowerCase();
  const isNotValid =
    normalized.includes("error") || normalized.includes("invalid");

  if (isNotValid) {
    return {
      ok: false,
      title: "Error de verificación",
      subtitle: "El QR no es válido para esta demo",
    };
  }
  return {
    ok: true,
    title: "Verificado correctamente",
    subtitle: "QR leído y validado",
  };
}

async function handleScanResult(decodedText) {
  if (processingResult) return;
  processingResult = true;

  try {
    setResult(decodedText);
    setStatus("verificando...");

    const validation = await fakeValidateQr(decodedText);

    if (validation.ok) {
      showOverlay("success", validation.title, validation.subtitle);
      setStatus("verificación correcta");
    } else {
      showOverlay("error", validation.title, validation.subtitle);
      setStatus("verificación incorrecta");
    }

    if (overlayTimer) {
      clearTimeout(overlayTimer);
    }

    overlayTimer = setTimeout(() => {
      hideOverlay();
      setStatus("escaneando");
      processingResult = false;
      lastText = null;
      lastTs = 0;
    }, 2000);
  } catch (error) {
    console.error(error);
    showOverlay("error", "Error de verificación", "Ha fallado el proceso");
    setStatus("error verificando");

    if (overlayTimer) {
      clearTimeout(overlayTimer);
    }

    overlayTimer = setTimeout(() => {
      hideOverlay();
      setStatus("escaneando");
      processingResult = false;
      lastText = null;
      lastTs = 0;
    }, 2000);
  }
}

function onScanSuccess(decodedText) {
  if (processingResult) return;

  const now = nowMs();

  // Confirmar solo si el mismo QR aparece 2 veces seguidas en 500 ms
  if (decodedText === lastText && now - lastTs <= 500) {
    handleScanResult(decodedText);
    return;
  }

  lastText = decodedText;
  lastTs = now;
  setStatus("QR detectado, confirmando...");
}

function onScanFailure(_error) {
  // No hagas log frame a frame
}

async function setupTrackControls() {
  const video = document.querySelector(`#${readerId} video`);
  if (!video || !video.srcObject) return;

  const stream = video.srcObject;
  track = stream.getVideoTracks()[0];
  if (!track) return;

  const capabilities = track.getCapabilities ? track.getCapabilities() : {};

  if (capabilities && "torch" in capabilities) {
    torchBtn.hidden = false;
  }

  if (capabilities && capabilities.zoom) {
    zoomCaps = capabilities.zoom;
    currentZoom = track.getSettings?.().zoom ?? zoomCaps.min ?? 1;
    zoomInBtn.hidden = false;
    zoomOutBtn.hidden = false;
  }
}

async function setTorch(enabled) {
  if (!track) return;
  await track.applyConstraints({
    advanced: [{ torch: enabled }],
  });
  torchOn = enabled;
  torchBtn.textContent = torchOn ? "Linterna off" : "Linterna";
}

async function setZoom(nextZoom) {
  if (!track || !zoomCaps) return;

  const min = zoomCaps.min ?? 1;
  const max = zoomCaps.max ?? nextZoom;
  const step = zoomCaps.step ?? 0.1;

  const clamped = Math.max(min, Math.min(max, nextZoom));
  const snapped = Math.round(clamped / step) * step;

  await track.applyConstraints({
    advanced: [{ zoom: snapped }],
  });

  currentZoom = snapped;
}

async function startScanner() {
  if (isRunning) return;

  setStatus("pidiendo acceso a cámara...");

  const cameras = await Html5Qrcode.getCameras();
  if (!cameras || cameras.length === 0) {
    throw new Error("No se han encontrado cámaras");
  }

  const backCamera =
    cameras.find((c) => /back|rear|environment/gi.test(c.label)) ||
    cameras[cameras.length - 1];

  await html5QrCode.start(
    { deviceId: { exact: backCamera.id } },
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

  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  setStatus("escaneando");

  await setupTrackControls();
}

async function stopScanner() {
  if (!isRunning) return;

  if (overlayTimer) {
    clearTimeout(overlayTimer);
    overlayTimer = null;
  }

  hideOverlay();

  await html5QrCode.stop();
  await html5QrCode.clear();

  isRunning = false;
  track = null;
  torchOn = false;
  currentZoom = null;
  zoomCaps = null;
  processingResult = false;
  lastText = null;
  lastTs = 0;

  startBtn.disabled = false;
  stopBtn.disabled = true;
  torchBtn.hidden = true;
  zoomInBtn.hidden = true;
  zoomOutBtn.hidden = true;

  setStatus("cámara parada");
}

startBtn.addEventListener("click", async () => {
  try {
    await startScanner();
  } catch (err) {
    console.error(err);
    setStatus(`error: ${err.message}`);
  }
});

stopBtn.addEventListener("click", async () => {
  try {
    await stopScanner();
  } catch (err) {
    console.error(err);
    setStatus(`error al parar: ${err.message}`);
  }
});

torchBtn.addEventListener("click", async () => {
  try {
    await setTorch(!torchOn);
  } catch (err) {
    console.error(err);
    setStatus("linterna no soportada o no disponible");
  }
});

zoomInBtn.addEventListener("click", async () => {
  try {
    await setZoom((currentZoom ?? 1) + (zoomCaps?.step ?? 0.1));
  } catch (err) {
    console.error(err);
    setStatus("zoom no soportado");
  }
});

zoomOutBtn.addEventListener("click", async () => {
  try {
    await setZoom((currentZoom ?? 1) - (zoomCaps?.step ?? 0.1));
  } catch (err) {
    console.error(err);
    setStatus("zoom no soportado");
  }
});
