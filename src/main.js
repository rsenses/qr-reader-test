import "./style.css";
import { extractAuthToken, isAuthFailureStatus } from "./auth/auth-utils";
import { getStoredToken, persistToken } from "./auth/token-storage";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { renderCampaignProductsPage } from "./pages/campaign-products-page";
import { renderCampaignsPage } from "./pages/campaigns-page";
import { renderLoginPage } from "./pages/login-page";
import { renderAppNav, renderUpdateBanner } from "./components/app-shell";
import {
  renderLastValidationCard,
  renderProductDetailPage,
} from "./pages/product-detail-page";
import {
  applySearchInput,
  applySearchValidationError,
  applySearchValidationSuccess,
  clearSearch,
  findAttemptedAttendee,
  renderProductSearchPage,
  refreshSearchResults,
} from "./pages/product-search-page";
import { renderProductStatsPage } from "./pages/product-stats-page";
import { renderRegisterPage } from "./pages/register-page";
import { renderIcon } from "./pages/page-helpers";
import { registerAppServiceWorker } from "./lib/service-worker-updates";
import { getDisplayErrorMessage } from "./lib/ui-error";
import { resolveRouteData } from "./router/route-resolver";
import {
  applyResolvedRouteState,
  applyRouteError,
  getRoute,
  getRouteRedirect,
  isScannerRoute,
  prepareRouteUiState,
  resetSessionState,
  setRouteLoading,
} from "./router/router";
import { createScannerController } from "./scanner/scanner-controller";
import { createScannerFlow } from "./scanner/scanner-flow";
import {
  hideScannerLoading,
  hideScannerOverlay,
  setScannerStatus,
  showPendingScannerOverlay,
  showScannerLoading,
  showScannerOverlay,
} from "./scanner/scanner-ui";
import { createApiClient } from "./services/api-client";
import { refreshProductData } from "./services/products-service";
import { submitRegisterFlow } from "./services/registration-service";
import { validateRegistrationCode } from "./services/validation-service";

const API_BASE_URL = "https://inscripciones.expansion.com/api/v1";
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

const app = document.querySelector("#app");

const state = {
  token: getStoredToken(),
  campaigns: [],
  products: [],
  campaign: null,
  product: null,
  productCampaign: null,
  loading: false,
  searchQuery: "",
  searchResults: [],
  lastValidation: null,
  pendingOverlay: null,
  searchValidation: null,
  loginError: null,
  loginEmail: "",
  registerError: null,
  updateAvailable: false,
};

let serviceWorkerRegistration = null;

let scannerFlow = null;

const { apiFetch, buildSiteStorageUrl } = createApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => state.token,
  isAuthFailureStatus,
  onAuthFailure: clearAuthAndRedirect,
});

const scannerController = createScannerController({
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  renderIcon,
  onScanSuccess: (decodedText) => scannerFlow?.onScanSuccess(decodedText),
  onScanFailure,
  showStatus: showScannerStatus,
  showLoading: showScannerLoading,
  hideLoading: hideScannerLoading,
  hideOverlay: hideScannerOverlay,
  onAutoStartError: () =>
    showScannerStatus("pulsa iniciar camara si el navegador no la abre automaticamente"),
});
const scannerState = scannerController.state;
const { setupScanner, destroyScanner } = scannerController;

scannerFlow = createScannerFlow({
  scannerState,
  nowMs,
  validateQr,
  refreshCurrentProduct,
  onValidationSuccess: (validation) => {
    state.lastValidation = {
      ok: true,
      message: validation.title,
      attendee: validation.attendee,
    };
    state.pendingOverlay = {
      type: "success",
      title: validation.title,
      subtitle: validation.subtitle,
    };
    syncLastValidation(state.lastValidation);
    showCurrentPendingScannerOverlay();
  },
  onValidationError: (error) => {
    const subtitle = getDisplayErrorMessage(error, "Ha fallado el proceso");
    state.lastValidation = null;
    syncLastValidation(state.lastValidation);
    showScannerOverlay("error", "Error de verificacion", subtitle);
  },
  showVerifyingStatus: () => showScannerStatus("verificando..."),
  showDetectedStatus: () => showScannerStatus("QR detectado, confirmando..."),
  showSuccessStatus: () => showScannerStatus("verificacion correcta"),
  showErrorStatus: () => showScannerStatus("verificacion incorrecta"),
  hideOverlay: hideScannerOverlay,
  showScanningStatus: () => showScannerStatus("escaneando"),
});

window.addEventListener("hashchange", handleRouteChange);
document.addEventListener("submit", handleSubmit);
document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);

bootstrap();
registerServiceWorker();

themeMedia.addEventListener("change", applyTheme);

function applyTheme() {
  const theme = themeMedia.matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute("content", theme === "dark" ? "#111827" : "#E44F3A");
  }
}

function registerServiceWorker() {
  registerAppServiceWorker({
    onUpdateAvailable: (registration) => {
      serviceWorkerRegistration = registration;
      state.updateAvailable = true;
      render();
    },
    onReload: () => {
      window.location.reload();
    },
  });
}

function syncLastValidation(lastValidation) {
  const region = document.getElementById("lastValidationRegion");
  if (!region) return;

  region.innerHTML = renderLastValidationCard(lastValidation);

  const card = region.firstElementChild;
  if (card && typeof card.scrollIntoView === "function") {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function showScannerStatus(text) {
  setScannerStatus(text);
}

function nowMs() {
  return performance.now();
}

async function clearAuthAndRedirect() {
  await destroyScanner();
  state.token = persistToken("");
  resetSessionState(state);

  if (window.location.hash !== "#/login") {
    window.location.hash = "#/login";
  }
}

async function bootstrap() {
  applyTheme();

  if (!window.location.hash) {
    window.location.hash = state.token ? "#/campaigns" : "#/login";
    return;
  }

  await handleRouteChange();
}

function getCurrentRoute() {
  return getRoute(window.location.hash, { hasToken: Boolean(state.token) });
}

function getScannerOverlayDeps() {
  return {
    showOverlay: showScannerOverlay,
    hideOverlay: hideScannerOverlay,
    setStatus: setScannerStatus,
    onResetPendingOverlay: () => {
      state.pendingOverlay = null;
    },
  };
}

function showCurrentPendingScannerOverlay() {
  showPendingScannerOverlay(
    state.pendingOverlay,
    scannerState,
    getScannerOverlayDeps(),
  );
}

function renderPageLoading() {
  return `
    <section class="rounded-[32px] border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] p-8 text-center text-[color:var(--text-base)] shadow-[var(--shadow-soft)] flex min-h-[50vh] items-center justify-center">
      <div>
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
        <p class="mt-4 text-sm font-medium text-slate-600">Cargando datos...</p>
      </div>
    </section>
  `;
}

async function handleLoginFormSubmit(form) {
  const formData = Object.fromEntries(new FormData(form).entries());

  try {
    const response = await apiFetch("/api/v1/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(formData),
    });
    const token = extractAuthToken(response);

    if (!token) {
      throw new Error("No se ha podido iniciar sesion. Intentalo de nuevo.");
    }

    state.loginError = null;
    state.loginEmail = "";
    resetSessionState(state);
    state.token = persistToken(token);
    window.location.hash = "#/campaigns";
  } catch (error) {
    state.loginError = getDisplayErrorMessage(
      error,
      "No se ha podido iniciar sesion. Intentalo de nuevo.",
    );
    state.loginEmail = String(formData.email || "");
    render();
  }
}

async function handleRegisterFormSubmit(form) {
  const formData = Object.fromEntries(new FormData(form).entries());

  try {
    const { validation } = await submitRegisterFlow(
      {
        apiFetch,
        formData,
        productId: state.product?.id,
        productIds: state.product?.mode === "campaign" ? state.product.productIds : undefined,
      },
      {
        validateQr,
        refreshCurrentProduct,
      },
    );

    state.registerError = null;
    state.lastValidation = {
      ok: true,
      message: validation.title,
      attendee: validation.attendee,
    };
    state.pendingOverlay = {
      type: "success",
      title: validation.title,
      subtitle: validation.subtitle,
    };
    render();
    showCurrentPendingScannerOverlay();
    form.reset();
  } catch (error) {
    state.registerError = getDisplayErrorMessage(
      error,
      "No se ha podido completar el alta. Intentalo de nuevo.",
    );
    render();
  }
}

async function handleValidateAttendeeAction(qrCode) {
  const attemptedAttendee = findAttemptedAttendee(state, qrCode);
  const inSearchRoute = () => getCurrentRoute().name === "productSearch";

  try {
    const validation = await validateQr(qrCode);
    await refreshCurrentProduct();

    if (inSearchRoute()) {
      applySearchValidationSuccess(state, validation);
      return;
    }

    state.lastValidation = {
      ok: true,
      message: validation.title,
      attendee: validation.attendee,
    };
    state.pendingOverlay = {
      type: "success",
      title: validation.title,
      subtitle: validation.subtitle,
    };

    syncLastValidation(state.lastValidation);
    showCurrentPendingScannerOverlay();
  } catch (error) {
    if (inSearchRoute()) {
      applySearchValidationError(
        state,
        getDisplayErrorMessage(error, "No se ha podido validar el QR."),
        attemptedAttendee,
      );
      return;
    }

    state.lastValidation = null;
    state.pendingOverlay = {
      type: "error",
      title: "Error de verificacion",
      subtitle: getDisplayErrorMessage(error, "No se ha podido validar el QR."),
    };

    showCurrentPendingScannerOverlay();
  }
}

function handleUpdateAppAction(event) {
  event.preventDefault();

  if (serviceWorkerRegistration?.waiting) {
    serviceWorkerRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    return;
  }

  window.location.reload();
}

async function applyRouteGuards(route) {
  const redirect = getRouteRedirect(route, { hasToken: Boolean(state.token) });

  if (!redirect) return false;

  if (redirect.name === "login") {
    await destroyScanner();
  }

  window.location.hash = redirect.hash;
  return true;
}

async function prepareRouteChange(route) {
  if (!isScannerRoute(route)) {
    await destroyScanner();
  }

  prepareRouteUiState(state);
}

async function finalizeRouteChange(route) {
  if (
    state.token &&
    isScannerRoute(getCurrentRoute()) &&
    isScannerRoute(route) &&
    String(state.product?.id) === String(route.productId)
  ) {
    await setupScanner({ product: state.product, autoStart: true });
    showCurrentPendingScannerOverlay();
  }
}

async function handleRouteChange() {
  const route = getCurrentRoute();

  if (await applyRouteGuards(route)) {
    return;
  }

  await prepareRouteChange(route);

  if (route.name === "login") {
    setRouteLoading(state, false);
    render();
    return;
  }

  setRouteLoading(state, true);
  render();

  try {
    const resolvedRouteState = await resolveRouteData(route, state, apiFetch);
    applyResolvedRouteState(state, route, resolvedRouteState);
  } catch (error) {
    applyRouteError(state, route, error);
  } finally {
    setRouteLoading(state, false);
    render();
    await finalizeRouteChange(route);
  }
}

function render() {
  const route = getCurrentRoute();
  const page = renderPage(route);
  const appNav = renderAppNav(route, state.product, renderIcon);
  const updateBanner = renderUpdateBanner(state.updateAvailable);

  app.innerHTML = `
    <div class="app-shell min-h-screen text-slate-900">
      <div class="app-shell__backdrop" aria-hidden="true">
        <span class="app-shell__orb app-shell__orb--accent"></span>
        <span class="app-shell__orb app-shell__orb--ink"></span>
        <span class="app-shell__grid"></span>
      </div>
      <div class="app-shell__inner mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-4 sm:px-6">
        ${updateBanner}
        <main class="app-main flex-1">${page}</main>

        ${appNav}
      </div>
    </div>
  `;
}
function renderPage(route) {
  if (state.loading) {
    return renderPageLoading();
  }

  if (route.name === "login") {
    return renderLoginPage({ loginError: state.loginError, email: state.loginEmail });
  }

  if (route.name === "register") {
    return renderRegisterPage({
      product: state.product,
      productCampaign: state.productCampaign,
      registerError: state.registerError,
      lastValidation: state.lastValidation,
    });
  }

  if (route.name === "campaigns") {
    return renderCampaignsPage({
      campaigns: state.campaigns,
      buildSiteStorageUrl,
    });
  }

  if (route.name === "campaignProducts") {
    return renderCampaignProductsPage({
      campaign: state.campaign,
      products: state.products,
    });
  }

  if (route.name === "product") {
    return renderProductDetailPage({
      product: state.product,
      productCampaign: state.productCampaign,
      lastValidation: state.lastValidation,
    });
  }

  if (route.name === "productSearch") {
    return renderProductSearchPage({
      product: state.product,
      productCampaign: state.productCampaign,
      searchQuery: state.searchQuery,
      searchResults: state.searchResults,
      searchValidation: state.searchValidation,
    });
  }

  if (route.name === "productStats") {
    return renderProductStatsPage({
      product: state.product,
      productCampaign: state.productCampaign,
    });
  }

  return renderCampaignsPage({
    campaigns: state.campaigns,
    buildSiteStorageUrl,
  });
}

async function handleSubmit(event) {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "loginForm") {
    event.preventDefault();
    await handleLoginFormSubmit(form);
    return;
  }

  if (form.id === "registerForm") {
    event.preventDefault();
    await handleRegisterFormSubmit(form);
  }
}

async function handleClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const actionEl = target.closest("[data-action]");
  if (!(actionEl instanceof HTMLElement)) return;

  const action = actionEl.dataset.action;
  if (!action) return;

  if (action === "validate-attendee") {
    await handleValidateAttendeeAction(actionEl.dataset.qrcode);
    return;
  }

  if (action === "update-app") {
    handleUpdateAppAction(event);
    return;
  }

  if (action === "clear-search") {
    clearSearch(state);
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.id === "manualSearchInput") {
    applySearchInput(state, target.value);
  }
}

async function validateQr(decodedText) {
  return validateRegistrationCode(apiFetch, decodedText, {
    mode: state.product?.mode === "campaign" ? "campaign" : "product",
    productId: state.product?.mode === "campaign" ? undefined : state.product?.id,
    campaignId: state.product?.mode === "campaign" ? state.product.campaign_id : undefined,
  });
}

async function refreshCurrentProduct() {
  if (!state.product?.id) return;

  state.product = await refreshProductData(apiFetch, state.product);

  if (getCurrentRoute().name === "productSearch") {
    refreshSearchResults(state);
  }
}

function onScanFailure() {}
