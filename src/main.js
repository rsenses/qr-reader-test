import "./style.css";
import { extractAuthToken, isAuthFailureStatus } from "./auth/auth-utils";
import { getStoredToken, persistToken } from "./auth/token-storage";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { renderCampaignProductsPage } from "./pages/campaign-products-page";
import { renderCampaignsPage } from "./pages/campaigns-page";
import { renderLoginPage } from "./pages/login-page";
import { renderAppNav, renderUpdateBanner } from "./components/app-shell";
import { renderSnackbar } from "./components/snackbar";
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
import { playErrorFeedback, playSuccessFeedback } from "./lib/ui-feedback";
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
  snackbar: null,
  updateAvailable: false,
};

let serviceWorkerRegistration = null;
let snackbarTimer = null;

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
    playSuccessFeedback();
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
    playErrorFeedback();
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

function renderPageLoading(route) {
  if (route.name === "campaigns" || route.name === "campaignProducts") {
    return `
      <section class="space-y-4">
        <div class="space-y-2">
          <div class="skeleton h-4 w-24 rounded-full"></div>
          <div class="skeleton h-8 w-52 rounded-full"></div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          ${Array.from({ length: 4 }, () => `
            <article class="overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-raised)] shadow-[var(--shadow-soft)]">
              <div class="skeleton h-48 w-full"></div>
              <div class="space-y-3 p-4">
                <div class="skeleton h-6 w-3/4 rounded-full"></div>
                <div class="skeleton h-10 w-36 rounded-2xl"></div>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  if (route.name === "product") {
    return `
      <section class="space-y-4">
        <div class="space-y-2">
          <div class="skeleton h-4 w-28 rounded-full"></div>
          <div class="skeleton h-8 w-44 rounded-full"></div>
        </div>
        <article class="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-raised)] p-3 shadow-[var(--shadow-soft)] sm:p-4">
          <div class="space-y-4">
            <div class="skeleton h-[26rem] w-full rounded-[1.75rem]"></div>
            <div class="space-y-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-3)] p-4">
              <div class="skeleton h-3 w-24 rounded-full"></div>
              <div class="skeleton h-7 w-40 rounded-full"></div>
              <div class="grid gap-2 sm:grid-cols-2">
                <div class="skeleton h-4 w-full rounded-full"></div>
                <div class="skeleton h-4 w-full rounded-full"></div>
              </div>
            </div>
          </div>
        </article>
      </section>
    `;
  }

  if (route.name === "register") {
    return `
      <section class="space-y-4">
        <div class="space-y-2">
          <div class="skeleton h-4 w-28 rounded-full"></div>
          <div class="skeleton h-8 w-40 rounded-full"></div>
        </div>
        <article class="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-raised)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div class="space-y-4">
            <div class="skeleton h-14 w-full rounded-[0.9rem]"></div>
            <div class="skeleton h-14 w-full rounded-[0.9rem]"></div>
            <div class="skeleton h-14 w-full rounded-[0.9rem]"></div>
            <div class="flex items-center gap-3 py-1">
              <div class="skeleton h-4 w-4 rounded-[0.35rem]"></div>
              <div class="skeleton h-4 w-52 rounded-full"></div>
            </div>
            <div class="skeleton h-12 w-full rounded-2xl"></div>
          </div>
        </article>
      </section>
    `;
  }

  return `
    <section class="space-y-4">
      <div class="space-y-2">
        <div class="skeleton h-4 w-28 rounded-full"></div>
        <div class="skeleton h-8 w-44 rounded-full"></div>
      </div>
      <article class="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-raised)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div class="space-y-4">
          <div class="skeleton h-14 w-full rounded-[0.9rem]"></div>
          <div class="skeleton h-14 w-full rounded-[0.9rem]"></div>
          <div class="skeleton h-40 w-full rounded-2xl"></div>
          <div class="skeleton h-4 w-3/4 rounded-full"></div>
          <div class="skeleton h-4 w-2/3 rounded-full"></div>
        </div>
      </article>
    </section>
  `;
}

function hideSnackbar({ shouldRender = true } = {}) {
  if (snackbarTimer) {
    clearTimeout(snackbarTimer);
    snackbarTimer = null;
  }

  state.snackbar = null;

  if (shouldRender) {
    render();
  }
}

function showSnackbar(message, { tone = "error", duration = 3600 } = {}) {
  if (!message) return;

  if (snackbarTimer) {
    clearTimeout(snackbarTimer);
  }

  state.snackbar = { message: String(message), tone };
  render();

  snackbarTimer = window.setTimeout(() => {
    hideSnackbar();
  }, duration);
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
    state.loginError = null;
    showSnackbar(
      getDisplayErrorMessage(error, "No se ha podido iniciar sesion. Intentalo de nuevo."),
    );
    state.loginEmail = String(formData.email || "");
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
    playSuccessFeedback();
    render();
    showCurrentPendingScannerOverlay();
    form.reset();
  } catch (error) {
    state.registerError = null;
    showSnackbar(
      getDisplayErrorMessage(error, "No se ha podido completar el alta. Intentalo de nuevo."),
    );
  }
}

async function handleValidateAttendeeAction(qrCode) {
  const attemptedAttendee = findAttemptedAttendee(state, qrCode);
  const inSearchRoute = () => getCurrentRoute().name === "productSearch";

  try {
    const validation = await validateQr(qrCode);
    await refreshCurrentProduct();

    if (inSearchRoute()) {
      playSuccessFeedback();
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
    playSuccessFeedback();

    syncLastValidation(state.lastValidation);
    showCurrentPendingScannerOverlay();
  } catch (error) {
    if (inSearchRoute()) {
      playErrorFeedback();
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
    playErrorFeedback();

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
    state.loginError = null;
    state.registerError = null;
    showSnackbar(getDisplayErrorMessage(error));
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
  const snackbar = renderSnackbar(state.snackbar);
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
      ${snackbar}
    </div>
  `;
}
function renderPage(route) {
  if (state.loading) {
    return renderPageLoading(route);
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
    return;
  }

  if (action === "dismiss-snackbar") {
    hideSnackbar();
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
