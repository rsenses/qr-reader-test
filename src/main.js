import "./style.css";
import { extractAuthToken, isAuthFailureStatus } from "./auth/auth-utils";
import { getStoredToken, persistToken } from "./auth/token-storage";
import {
  clearSearchFlow,
  applySearchValidationError,
  applySearchValidationSuccess,
  findAttemptedAttendee,
} from "./flows/search-flow";
import {
  applyLoginError,
  applyLoginSuccess,
  submitLogin,
} from "./flows/login-flow";
import { applySearchInputFlow } from "./flows/search-input-flow";
import {
  applyRegisterError,
  applyRegisterSuccess,
  submitRegisterFlow,
} from "./flows/register-flow";
import {
  applyProductValidationError,
  applyProductValidationSuccess,
} from "./flows/validation-flow";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { renderCampaignProductsPage } from "./pages/campaign-products-page";
import { renderCampaignsPage } from "./pages/campaigns-page";
import { renderLoginPage } from "./pages/login-page";
import {
  renderLastValidationCard,
  renderProductDetailPage,
} from "./pages/product-detail-page";
import {
  renderProductSearchPage,
  renderSearchResults,
  renderSearchValidationCard,
} from "./pages/product-search-page";
import { renderProductStatsPage } from "./pages/product-stats-page";
import { renderRegisterPage } from "./pages/register-page";
import { renderIcon } from "./pages/page-helpers";
import {
  showInfoNotification,
  showResultNotification,
  showScannerNotification,
} from "./notifications/notifications-service";
import { renderAppNav, renderUpdateBanner } from "./ui/app-shell";
import { getRouteRedirect } from "./router/route-guards";
import { resolveRouteData } from "./router/route-resolver";
import {
  applyResolvedRouteState,
  applyRouteError,
  prepareRouteUiState,
  resetSessionState,
  setRouteLoading,
} from "./router/route-state";
import { createScannerController } from "./scanner/scanner-controller";
import { createScannerFlow } from "./scanner/scanner-flow";
import {
  hideScannerLoading,
  hideScannerOverlay,
  setScannerResult,
  setScannerStatus,
  showScannerLoading,
  showScannerOverlay,
} from "./scanner/scanner-ui";
import { getRoute, isScannerRoute } from "./router/router";
import { refreshProductData } from "./services/products-service";
import { registerAttendeeForProduct } from "./services/registration-service";
import { getSearchResults } from "./services/search-service";
import {
  syncLastValidationUI,
  syncSearchClearButton,
  syncSearchValidationUI,
} from "./ui/validation-ui";
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
  registerError: null,
  updateAvailable: false,
};

let serviceWorkerRegistration = null;
let refreshingForUpdate = false;

let scannerFlow = null;

const scannerController = createScannerController({
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  renderIcon,
  onScanSuccess: (decodedText) => scannerFlow?.onScanSuccess(decodedText),
  onScanFailure,
  showStatus: (text) =>
    showScannerNotification({ channel: "status", text }, { setStatus: setScannerStatus }),
  showLoading: (text) =>
    showInfoNotification(
      { channel: "scanner-loading-show", text },
      { showScannerLoading },
    ),
  hideLoading: () =>
    showInfoNotification({ channel: "scanner-loading-hide" }, { hideScannerLoading }),
  hideOverlay: () =>
    showScannerNotification({ channel: "overlay-hide" }, { hideOverlay: hideScannerOverlay }),
  onAutoStartError: () =>
    showScannerNotification(
      {
        channel: "status",
        text: "pulsa iniciar camara si el navegador no la abre automaticamente",
      },
      { setStatus: setScannerStatus },
    ),
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
    showResultNotification(
      { channel: "last-validation", lastValidation: state.lastValidation },
      { syncLastValidationUI, renderLastValidationCard },
    );
    showPendingScannerOverlay();
  },
  onValidationError: (error) => {
    const subtitle = error.message || "Ha fallado el proceso";
    state.lastValidation = null;
    showResultNotification(
      { channel: "last-validation", lastValidation: state.lastValidation },
      { syncLastValidationUI, renderLastValidationCard },
    );
    showScannerNotification(
      {
        channel: "overlay",
        pendingOverlay: {
          type: "error",
          title: "Error de verificacion",
          subtitle,
        },
      },
      { showOverlay: showScannerOverlay },
    );
  },
  showDecodedResult: (decodedText) =>
    showScannerNotification({ channel: "result", text: decodedText }, { setResult: setScannerResult }),
  showVerifyingStatus: () =>
    showScannerNotification({ channel: "status", text: "verificando..." }, { setStatus: setScannerStatus }),
  showDetectedStatus: () =>
    showScannerNotification(
      { channel: "status", text: "QR detectado, confirmando..." },
      { setStatus: setScannerStatus },
    ),
  showSuccessStatus: () =>
    showScannerNotification(
      { channel: "status", text: "verificacion correcta" },
      { setStatus: setScannerStatus },
    ),
  showErrorStatus: () =>
    showScannerNotification(
      { channel: "status", text: "verificacion incorrecta" },
      { setStatus: setScannerStatus },
    ),
  hideOverlay: () =>
    showScannerNotification({ channel: "overlay-hide" }, { hideOverlay: hideScannerOverlay }),
  showScanningStatus: () =>
    showScannerNotification({ channel: "status", text: "escaneando" }, { setStatus: setScannerStatus }),
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
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      serviceWorkerRegistration =
        await navigator.serviceWorker.register("/sw.js");
      observeServiceWorker(serviceWorkerRegistration);
      await serviceWorkerRegistration.update();

      window.addEventListener("focus", () => {
        serviceWorkerRegistration?.update().catch(() => {});
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshingForUpdate) return;
        refreshingForUpdate = true;
        window.location.reload();
      });
    } catch (error) {
      console.error("No se pudo registrar el service worker", error);
    }
  });
}

function observeServiceWorker(registration) {
  if (!registration) return;

  if (registration.waiting) {
    state.updateAvailable = true;
    render();
  }

  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener("statechange", () => {
      if (
        installingWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        state.updateAvailable = true;
        render();
      }
    });
  });
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

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  const normalizedText = text.charCodeAt(0) === 0 ? text.slice(1) : text;

  if (
    contentType.includes("text/html") ||
    /^\s*<!doctype html>/i.test(normalizedText) ||
    /^\s*<html[\s>]/i.test(normalizedText)
  ) {
    return {
      message:
        response.status === 403
          ? "Acceso prohibido"
          : "El servidor devolvio una respuesta HTML inesperada.",
    };
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

function buildSiteStorageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;

  const origin = new URL(API_BASE_URL).origin;
  return `${origin}/storage/${String(path).replace(/^\//, "")}`;
}

async function apiFetch(path, options = {}) {
  const { skipAuth = false, ...requestOptions } = options;
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  if (!skipAuth && state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }

  const normalizedPath = String(path || "").replace(/^\/api\/v1/, "");

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...requestOptions,
    headers,
  });

  const data = await parseResponseBody(response);

  if (!response.ok) {
    if (!skipAuth && isAuthFailureStatus(response.status)) {
      await clearAuthAndRedirect();
    }

    const error = new Error(data.message || "Error inesperado");
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
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

function showPendingScannerOverlay() {
  showScannerNotification(
    { channel: "pending-overlay", pendingOverlay: state.pendingOverlay, scannerState },
    getScannerOverlayDeps(),
  );
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
    showPendingScannerOverlay();
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
  const updateBanner = showInfoNotification(
    { channel: "update-banner", updateAvailable: state.updateAvailable },
    { renderUpdateBanner },
  );

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
    return showInfoNotification({ channel: "page-loading" });
  }

  if (route.name === "login") {
    return renderLoginPage({ loginError: state.loginError });
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
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      const { token } = await submitLogin(apiFetch, formData, extractAuthToken);
      applyLoginSuccess(state, token, { persistToken, resetSessionState });
      window.location.hash = "#/campaigns";
    } catch (error) {
      applyLoginError(state, error.message);
      render();
    }

    return;
  }

  if (form.id === "registerForm") {
    event.preventDefault();
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
          registerAttendeeForProduct,
          validateQr,
          refreshCurrentProduct,
        },
      );

      applyRegisterSuccess(state, validation);
      render();
      showPendingScannerOverlay();
      form.reset();
    } catch (error) {
      applyRegisterError(state, error.message);
      render();
    }
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
    const attemptedAttendee = findAttemptedAttendee(state, actionEl.dataset.qrcode);

    try {
      const validation = await validateQr(actionEl.dataset.qrcode);
      await refreshCurrentProduct();
      if (getCurrentRoute().name === "productSearch") {
        applySearchValidationSuccess(state, validation, {
          syncSearchValidationUI: (searchValidation, renderCard) =>
            showResultNotification(
              { channel: "search-validation", searchValidation },
              {
                syncSearchValidationUI,
                renderSearchValidationCard: renderCard,
              },
            ),
          renderSearchValidationCard,
        });
      } else {
        applyProductValidationSuccess(state, validation, {
          syncLastValidationUI: (lastValidation, renderCard) =>
            showResultNotification(
              { channel: "last-validation", lastValidation },
              {
                syncLastValidationUI,
                renderLastValidationCard: renderCard,
              },
          ),
          renderLastValidationCard,
          showValidationOverlay: showPendingScannerOverlay,
        });
      }
    } catch (error) {
      if (getCurrentRoute().name === "productSearch") {
        applySearchValidationError(state, error.message, attemptedAttendee, {
          renderSearchResults,
          renderSearchValidationCard,
          syncSearchValidationUI: (searchValidation, renderCard) =>
            showResultNotification(
              { channel: "search-validation", searchValidation },
              {
                syncSearchValidationUI,
                renderSearchValidationCard: renderCard,
              },
            ),
        });
      } else {
        applyProductValidationError(state, error.message, showPendingScannerOverlay);
      }
    }
    return;
  }

  if (action === "update-app") {
    event.preventDefault();

    if (serviceWorkerRegistration?.waiting) {
      serviceWorkerRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    window.location.reload();
    return;
  }

  if (action === "clear-search") {
    clearSearchFlow(state, {
      render,
      renderSearchResults,
      renderSearchValidationCard,
      syncSearchClearButton,
      syncSearchValidationUI: (searchValidation, renderCard) =>
        showResultNotification(
          { channel: "search-validation", searchValidation },
          {
            syncSearchValidationUI,
            renderSearchValidationCard: renderCard,
          },
        ),
    });
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.id === "manualSearchInput") {
    applySearchInputFlow(state, target.value, {
      getSearchResults,
      renderSearchResults,
      renderSearchValidationCard,
      syncSearchClearButton,
      syncSearchValidationUI: (searchValidation, renderCard) =>
        showResultNotification(
          { channel: "search-validation", searchValidation },
          {
            syncSearchValidationUI,
            renderSearchValidationCard: renderCard,
          },
        ),
    });
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
    const searchState = getSearchResults(
      state.product.attendees,
      state.searchQuery,
    );
    state.searchResults = searchState.results;
    const resultsEl = document.getElementById("manualSearchResults");
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults({
        searchQuery: state.searchQuery,
        searchResults: state.searchResults,
        hasEnoughChars: searchState.hasEnoughChars,
      });
    }
  }
}

function onScanFailure() {}
