import "./style.css";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const API_BASE_URL = "https://inscripciones.expansion.com/api/v1";
const TOKEN_KEY = "qr-test-token";
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
  registerMessage: null,
  registerError: null,
  updateAvailable: false,
};

let serviceWorkerRegistration = null;
let refreshingForUpdate = false;

const scannerState = {
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
      serviceWorkerRegistration = await navigator.serviceWorker.register("/sw.js");
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

function clearScreenMessages() {
  state.loginError = null;
  state.registerMessage = null;
  state.registerError = null;
}

function getStoredToken() {
  return String(localStorage.getItem(TOKEN_KEY) || "").trim();
}

function persistToken(token) {
  const normalizedToken = String(token || "").trim();
  state.token = normalizedToken;

  if (normalizedToken) {
    localStorage.setItem(TOKEN_KEY, normalizedToken);
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
}

function resetSessionState() {
  state.campaigns = [];
  state.products = [];
  state.campaign = null;
  state.product = null;
  state.productCampaign = null;
  state.searchQuery = "";
  state.searchResults = [];
  state.lastValidation = null;
  state.pendingOverlay = null;
  state.searchValidation = null;
  state.registerMessage = null;
  state.registerError = null;
}

async function clearAuthAndRedirect() {
  await destroyScanner();
  persistToken("");
  resetSessionState();

  if (window.location.hash !== "#/login") {
    window.location.hash = "#/login";
  }
}

function extractAuthToken(payload) {
  const candidates = [
    payload?.token,
    payload?.access_token,
    payload?.data?.token,
    payload?.data?.access_token,
  ];

  return candidates.find((value) => String(value || "").trim()) || "";
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

function metadataText(metadata = []) {
  if (!metadata.length) return "Sin metadatos";
  return metadata.map((item) => `${item.key}: ${item.value}`).join(" · ");
}

function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return [];

  return Object.entries(metadata)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    )
    .map(([key, value]) => ({ key, value: String(value) }));
}

function normalizeRegistration(registration) {
  const metadata = normalizeMetadata(registration.metadata);
  const fullName = [
    registration.user?.name || registration.metadata?.name,
    registration.user?.last_name || registration.metadata?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: registration.id,
    qrCode: registration.unique_id,
    name: fullName || "Sin nombre",
    email: registration.user?.email || registration.metadata?.email || "",
    phone: registration.user?.phone || "",
    company: registration.user?.company || registration.metadata?.company || "",
    position:
      registration.user?.position || registration.metadata?.position || "",
    registrationType: registration.type || "",
    status: registration.status || "",
    metadata,
  };
}

function buildProductFromRegistrations(
  productId,
  registrations,
  fallbackProduct,
) {
  return {
    ...(fallbackProduct || {}),
    id: Number(productId),
    name:
      fallbackProduct?.name ||
      registrations[0]?.product?.name ||
      `Producto ${productId}`,
    attendees: registrations.map(normalizeRegistration),
  };
}

async function ensureCampaignsLoaded() {
  if (state.campaigns.length) return;

  const response = await apiFetch("/api/v1/campaigns");
  state.campaigns = response.data || [];
}

async function resolveProductContext(productId) {
  const normalizedProductId = String(productId);
  const localProduct = state.products.find(
    (product) => String(product.id) === normalizedProductId,
  );

  if (localProduct && state.campaign) {
    state.productCampaign = state.campaign;
    return localProduct;
  }

  await ensureCampaignsLoaded();

  for (const campaign of state.campaigns) {
    const products = await apiFetch(
      `/api/v1/products?campaign_id=${encodeURIComponent(campaign.id)}&mode=presencial`,
    );
    const matchedProduct = (products || []).find(
      (product) => String(product.id) === normalizedProductId,
    );

    if (matchedProduct) {
      state.campaign = campaign;
      state.productCampaign = campaign;
      state.products = products || [];
      return matchedProduct;
    }
  }

  return null;
}

function getCurrentCampaignId() {
  return (
    state.productCampaign?.id ||
    state.product?.campaign_id ||
    state.campaign?.id ||
    null
  );
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
    if (response.status === 401) {
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

async function handleRouteChange() {
  const route = getRoute();

  if (!state.token && route.name !== "login") {
    await destroyScanner();
    window.location.hash = "#/login";
    return;
  }

  if (state.token && route.name === "login") {
    window.location.hash = "#/campaigns";
    return;
  }

  if (route.name !== "product") {
    await destroyScanner();
  }

  clearScreenMessages();

  if (route.name === "login") {
    state.loading = false;
    render();
    return;
  }

  state.loading = true;
  render();

  try {
    if (route.name === "campaigns") {
      await ensureCampaignsLoaded();
    }

    if (route.name === "campaignProducts") {
      await ensureCampaignsLoaded();

      const response = await apiFetch(
        `/api/v1/products?campaign_id=${encodeURIComponent(route.campaignId)}&mode=presencial`,
      );
      state.campaign =
        state.campaigns.find(
          (campaign) => String(campaign.id) === String(route.campaignId),
        ) || null;
      state.products = response || [];
    }

    if (
      route.name === "product" ||
      route.name === "productSearch" ||
      route.name === "productStats" ||
      route.name === "register"
    ) {
      const fallbackProduct = await resolveProductContext(route.productId);
      const response = route.name === "register"
        ? { data: [] }
        : await apiFetch(`/api/v1/registrations/${route.productId}`);
      const registrations = response.data || [];
      state.product = buildProductFromRegistrations(
        route.productId,
        registrations,
        fallbackProduct,
      );
      state.searchResults = [];
      state.searchQuery = "";
      if (route.name !== "productSearch") {
        state.searchValidation = null;
      }
    }
  } catch (error) {
    if (route.name === "login") {
      state.loginError = error.message;
    }

    if (route.name === "register") {
      state.registerError = error.message;
    }
  } finally {
    state.loading = false;
    render();

    if (
      state.token &&
      getRoute().name === "product" &&
      route.name === "product" &&
      String(state.product?.id) === String(route.productId)
    ) {
      await setupScanner({ autoStart: true });
      showValidationOverlay();
    }
  }
}

function getRoute() {
  const hash = window.location.hash.replace(/^#/, "") || "/login";

  if (hash === "/login") return { name: "login" };

  if (hash === "/campaigns") return { name: "campaigns" };

  const registerMatch = hash.match(/^\/register\/([^/]+)$/);
  if (registerMatch) return { name: "register", productId: registerMatch[1] };

  const campaignMatch = hash.match(/^\/campaigns\/([^/]+)$/);
  if (campaignMatch)
    return { name: "campaignProducts", campaignId: campaignMatch[1] };

  const productMatch = hash.match(/^\/products\/([^/]+)$/);
  if (productMatch) return { name: "product", productId: productMatch[1] };

  const productSearchMatch = hash.match(/^\/products\/([^/]+)\/search$/);
  if (productSearchMatch)
    return { name: "productSearch", productId: productSearchMatch[1] };

  const productStatsMatch = hash.match(/^\/products\/([^/]+)\/stats$/);
  if (productStatsMatch)
    return { name: "productStats", productId: productStatsMatch[1] };

  return { name: state.token ? "campaigns" : "login" };
}

function render() {
  const route = getRoute();
  const page = renderPage(route);
  const appNav = renderAppNav(route);
  const updateBanner = renderUpdateBanner();

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

function renderUpdateBanner() {
  if (!state.updateAvailable) return "";

  return `
    <section class="app-update-banner mb-4 flex items-center justify-between gap-3 rounded-[24px] border border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] px-4 py-3 shadow-sm">
      <div>
        <p class="text-sm font-semibold text-[color:var(--accent-strong)]">Nueva version disponible</p>
        <p class="mt-1 text-xs text-[color:var(--accent-strong)]/80">Actualiza la app para cargar los ultimos cambios.</p>
      </div>
      <button type="button" data-action="update-app" class="shrink-0 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white">Actualizar</button>
    </section>
  `;
}
function renderPage(route) {
  if (state.loading) {
    return `
      <section class="flex min-h-[50vh] items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
        <div>
          <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
          <p class="mt-4 text-sm font-medium text-slate-600">Cargando datos...</p>
        </div>
      </section>
    `;
  }

  if (route.name === "login") return renderLogin();
  if (route.name === "register") return renderRegister();
  if (route.name === "campaigns") return renderCampaigns();
  if (route.name === "campaignProducts") return renderCampaignProducts();
  if (route.name === "product") return renderProductDetail();
  if (route.name === "productSearch") return renderProductSearch();
  if (route.name === "productStats") return renderProductStats();

  return renderCampaigns();
}

function renderLogin() {
  return `
    <section class="flex flex-1 items-center">
      <article class="app-card w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="hero-badge">
          <span class="hero-badge__icon">${renderIcon("shield")}</span>
          <span>Acceso seguro</span>
        </div>
        <p class="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">Trackit</p>
        <h2 class="login-title mt-2 font-heading text-3xl text-slate-900">Control de acceso claro, agil y moderno.</h2>
        <p class="mt-3 max-w-md text-sm text-slate-500">Inicia sesion para acceder a las campanas y seguir usando la navegacion actual de la app.</p>
        ${state.loginError ? `<div class="mt-4 rounded-2xl border border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)]">${escapeHtml(state.loginError)}</div>` : ""}
        <form id="loginForm" class="mt-6 space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input id="login-email" type="email" name="email" autocomplete="username email" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input id="login-password" type="password" name="password" autocomplete="current-password" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
          </label>
          <button class="w-full rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(228,79,58,0.28)]">Entrar</button>
        </form>
      </article>
    </section>
  `;
}

function renderRegister() {
  return `
    <section class="app-card rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="register-header flex items-center justify-between gap-3">
        <div>
          <h2 class="section-title font-heading text-2xl text-slate-900">Nuevo registro</h2>
          <p class="mt-1 text-sm text-slate-500">Formulario simple, sin metadatos.</p>
        </div>
      </div>

      ${state.registerError ? `<div class="mt-4 rounded-2xl border border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)]">${escapeHtml(state.registerError)}</div>` : ""}
      ${state.registerMessage ? `<div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">${escapeHtml(state.registerMessage)}</div>` : ""}

      <form id="registerForm" class="mt-6 grid gap-4">
        ${renderField("name", "Nombre")}
        ${renderField("last_name", "Apellidos")}
        ${renderField("email", "Email", "email")}
        ${renderField("phone", "Telefono", "text", false)}
        ${renderField("company", "Empresa", "text", false)}
        ${renderField("position", "Cargo", "text", false)}
        ${renderField("tax_id", "DNI / NIF", "text", false)}
        <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input name="advertising" type="checkbox" value="1" checked class="h-4 w-4 rounded border-slate-300" />
          <span class="text-sm font-medium text-slate-700">Acepta comunicaciones comerciales</span>
        </label>
        <button class="rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white">Registrar</button>
      </form>
    </section>
  `;
}

function renderCampaigns() {
  if (!state.campaigns.length) {
    return emptyState("No hay campañas disponibles.");
  }

  return `
    <section>
      <div class="mb-4">
        <div>
          <h2 class="section-title font-heading text-2xl text-slate-900">Campañas activas</h2>
          <p class="mt-1 text-sm text-slate-500">Selecciona una campaña.</p>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${state.campaigns
          .map(
            (campaign) => `
          <article class="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            ${campaign.image ? `<img src="${escapeAttribute(buildSiteStorageUrl(campaign.image))}" alt="${escapeHtml(campaign.name)}" class="w-full object-cover" />` : `<div class="flex h-36 items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">Sin imagen</div>`}
            <div class="p-4">
              <h3 class="font-heading text-xl text-slate-900">${escapeHtml(campaign.name)}</h3>
              <a href="#/campaigns/${campaign.id}" class="mt-4 inline-flex rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Abrir campaña</a>
            </div>
          </article>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCampaignProducts() {
  if (!state.campaign) {
    return emptyState("No encontramos la campaña solicitada.");
  }

  return `
    <section>
      <a href="#/campaigns" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">← Campañas</a>
        <div class="app-card mt-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
         <h2 class="section-title font-heading text-2xl text-slate-900">${escapeHtml(state.campaign.name)}</h2>
        <div class="mt-4 grid gap-3">
          ${state.products
            .map(
              (product) => `
            <a href="#/products/${product.id}" class="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <h3 class="font-heading text-xl text-slate-900">${escapeHtml(product.name)}</h3>
              <p class="mt-1 text-sm text-slate-500">Ir al escaner</p>
            </a>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProductDetail() {
  if (!state.product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  const productBackHref = state.productCampaign?.id
    ? `#/campaigns/${state.productCampaign.id}`
    : "#/campaigns";
  const productCampaignName = state.productCampaign?.name || "Campaña";

  return `
    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3 px-1">
        <a href="${productBackHref}" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">← Productos</a>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Escanear</span>
      </div>

      <article class="app-card rounded-[28px] border border-white/70 bg-white/90 p-3 shadow-sm sm:p-4">
          <div class="mb-3">
            <h2 class="section-title font-heading text-2xl text-slate-900">${escapeHtml(state.product.name)}</h2>
            <p class="text-sm text-slate-500">${escapeHtml(productCampaignName)}</p>
          </div>

          <div class="space-y-3">
             <div class="reader-shell relative overflow-hidden rounded-[28px] bg-black shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
              <div class="scanner-controls" aria-label="Controles de camara">
                <button id="torchBtn" type="button" hidden class="scanner-control scanner-control--primary" aria-label="Linterna">${renderIcon("flash")}</button>
                <div class="scanner-zoom-controls">
                  <button id="zoomOutBtn" type="button" hidden class="scanner-control" aria-label="Alejar zoom">-</button>
                  <button id="zoomInBtn" type="button" hidden class="scanner-control" aria-label="Acercar zoom">+</button>
                </div>
              </div>
                <div id="scannerLoading" class="scanner-loading" aria-live="polite">
                  <div class="scanner-loading__spinner"></div>
                  <p id="scannerLoadingText" class="scanner-loading__text">Abriendo camara...</p>
                </div>
                <div id="reader" class="reader-frame min-h-[420px] w-full bg-black"></div>
                <div id="scanOverlay" class="scan-overlay hidden" aria-live="polite">
                 <div class="scan-overlay-card">
                   <div id="scanOverlayIcon" class="scan-overlay-icon">✓</div>
                   <div id="scanOverlayTitle" class="scan-overlay-title">Verificado correctamente</div>
                  <div id="scanOverlaySubtitle" class="scan-overlay-subtitle">QR leido y validado</div>
                </div>
              </div>
            </div>

            <div id="lastValidationRegion">${renderLastValidationCard()}</div>
          </div>
      </article>
    </section>
  `;
}

function renderProductSearch() {
  if (!state.product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  const hasEnoughChars = normalizeSearch(state.searchQuery).length >= 2;

  return `
    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3 px-1">
        <a href="#/products/${state.product.id}" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">← Escanear</a>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Buscar</span>
      </div>

      <article class="app-card rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 class="section-title font-heading text-2xl text-slate-900">Buscar inscritos</h2>
        <p class="mt-1 text-sm text-slate-500">Escribe al menos 2 caracteres. La busqueda ignora acentos y eñes.</p>

        <div class="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input id="manualSearchInput" value="${escapeAttribute(state.searchQuery)}" placeholder="Nombre, email o empresa" class="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none" />
          <button type="button" data-action="clear-search" aria-label="Limpiar busqueda" class="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 ${state.searchQuery ? "" : "invisible"}">${renderIcon("close")}</button>
        </div>

        <div id="manualSearchResults" class="mt-4 space-y-3">
          ${renderSearchResults(hasEnoughChars)}
        </div>

        <div id="searchValidationRegion" class="mt-4">${renderSearchValidationCard()}</div>

      </article>
    </section>
  `;
}

function renderProductStats() {
  if (!state.product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  const stats = getProductStats(state.product.attendees);

  return `
    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3 px-1">
        <a href="#/products/${state.product.id}" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">← Escanear</a>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estadísticas</span>
      </div>

      <article class="app-card rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 class="section-title font-heading text-2xl text-slate-900">Estadisticas</h2>
        <p class="mt-1 text-sm text-slate-500">${escapeHtml(state.product.name)}</p>

        <div class="stats-grid mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-2xl bg-slate-100 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inscritos</p>
            <p class="stats-number mt-2 text-3xl font-bold text-slate-900">${stats.totalPaidOrVerified}</p>
          </div>
          <div class="rounded-2xl bg-[color:var(--accent-faint)] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Verificados</p>
            <p class="stats-number mt-2 text-3xl font-bold text-[color:var(--accent-strong)]">${stats.totalVerified}</p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          ${
            stats.byType.length
              ? stats.byType
                  .map(
                    (entry) => `
            <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-900">${escapeHtml(entry.label)}</h3>
                  <p class="mt-1 text-sm text-slate-500">${entry.verified} verificados de ${entry.total} inscritos</p>
                </div>
                <p class="text-sm font-semibold text-slate-700">${entry.percentage}%</p>
              </div>
              <div class="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div class="h-full rounded-full bg-slate-900" style="width: ${entry.percentage}%"></div>
              </div>
            </article>
          `,
                  )
                  .join("")
              : `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No hay inscritos paid o verified para mostrar.</p>`
          }
        </div>
      </article>
    </section>
  `;
}

function renderSearchResults(hasEnoughChars) {
  if (!state.searchQuery) {
    return `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">Todavia no has escrito nada.</p>`;
  }

  if (!hasEnoughChars) {
    return `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">Introduce al menos 2 caracteres.</p>`;
  }

  if (!state.searchResults.length) {
    return `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No hay resultados.</p>`;
  }

  return state.searchResults
    .map(
      (attendee) => `
    <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">${escapeHtml(attendee.name)}</h3>
          <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.email)}</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${attendee.status === "paid" ? "bg-slate-200 text-slate-700" : "bg-[color:var(--accent-faint)] text-[color:var(--accent-strong)]"}">${escapeHtml(attendee.status)}</span>
      </div>
      <p class="mt-3 text-sm text-slate-600">${escapeHtml(attendee.phone)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.company)} · ${escapeHtml(attendee.position)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.registrationType)}</p>
      <p class="mt-2 text-xs text-slate-500">${escapeHtml(metadataText(attendee.metadata))}</p>
      <button type="button" data-action="validate-attendee" data-qrcode="${escapeAttribute(attendee.qrCode)}" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Validar inscrito</button>
    </article>
  `,
    )
    .join("");
}

function renderLastValidationCard() {
  if (!state.lastValidation?.attendee) return "";

  const { attendee, ok, message } = state.lastValidation;
  const metadataLines = attendee.metadata?.length
    ? attendee.metadata
        .map(
          (item) =>
            `<p><strong>${escapeHtml(item.key)}:</strong> ${escapeHtml(item.value)}</p>`,
        )
        .join("")
    : "<p>Sin metadatos</p>";

  return `
    <article class="rounded-[24px] border ${ok ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"} p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] ${ok ? "text-emerald-700" : "text-slate-500"}">${ok ? "Validado" : "Ultimo intento"}</p>
          <h3 class="mt-2 font-heading text-2xl text-slate-900">${escapeHtml(attendee.name)}</h3>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-white text-emerald-700" : "bg-white text-slate-700"}">${escapeHtml(message || (ok ? "OK" : "Error"))}</span>
      </div>

      <div class="mt-3">
        <span class="inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${registrationTypeBadgeClass(attendee.registrationType)}">${escapeHtml(attendee.registrationType)}</span>
      </div>

      <div class="mt-4 grid gap-2 text-sm text-slate-700">
        ${metadataLines}
      </div>
    </article>
  `;
}

function renderSearchValidationCard() {
  if (!state.searchValidation) return "";

  const { ok, message, attendee } = state.searchValidation;

  if (!ok) {
    return `
      <article class="rounded-[24px] border border-rose-200 bg-rose-50 p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Error de validacion</p>
        ${attendee ? `<h3 class="mt-2 font-heading text-2xl text-slate-900">${escapeHtml(attendee.name)}</h3><div class="mt-3"><span class="inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${registrationTypeBadgeClass(attendee.registrationType)}">${escapeHtml(attendee.registrationType)}</span></div><div class="mt-4 grid gap-2 text-sm text-slate-700">${attendee.metadata?.length ? attendee.metadata.map((item) => `<p><strong>${escapeHtml(item.key)}:</strong> ${escapeHtml(item.value)}</p>`).join("") : "<p>Sin metadatos</p>"}</div>` : ""}
        <p class="mt-4 text-sm font-medium text-rose-800">${escapeHtml(message)}</p>
      </article>
    `;
  }

  if (!attendee) return "";

  const metadataLines = attendee.metadata?.length
    ? attendee.metadata
        .map(
          (item) =>
            `<p><strong>${escapeHtml(item.key)}:</strong> ${escapeHtml(item.value)}</p>`,
        )
        .join("")
    : "<p>Sin metadatos</p>";

  return `
    <article class="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Validado</p>
          <h3 class="mt-2 font-heading text-2xl text-slate-900">${escapeHtml(attendee.name)}</h3>
        </div>
        <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">${escapeHtml(message || "OK")}</span>
      </div>

      <div class="mt-3">
        <span class="inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${registrationTypeBadgeClass(attendee.registrationType)}">${escapeHtml(attendee.registrationType)}</span>
      </div>

      <div class="mt-4 grid gap-2 text-sm text-slate-700">
        ${metadataLines}
      </div>
    </article>
  `;
}

function registrationTypeBadgeClass(type) {
  const normalized = normalizeSearch(type);

  if (normalized === "ponente") {
    return "bg-sky-100 text-sky-800";
  }

  if (normalized === "vip") {
    return "bg-amber-100 text-amber-900";
  }

  if (normalized === "invitado") {
    return "bg-violet-100 text-violet-800";
  }

  if (normalized === "asistente") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-200 text-slate-700";
}

function syncLastValidationUI() {
  const region = document.getElementById("lastValidationRegion");
  if (!region) return;
  region.innerHTML = renderLastValidationCard();

  const card = region.firstElementChild;
  if (card instanceof HTMLElement) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function syncSearchValidationUI() {
  const region = document.getElementById("searchValidationRegion");
  if (!region) return;
  region.innerHTML = renderSearchValidationCard();

  const card = region.firstElementChild;
  if (card instanceof HTMLElement) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function syncSearchClearButton() {
  const button = document.querySelector('[data-action="clear-search"]');
  if (!(button instanceof HTMLElement)) return;
  button.classList.toggle("invisible", !state.searchQuery);
}

function showValidationOverlay() {
  if (!state.pendingOverlay) return;

  const { type, title, subtitle } = state.pendingOverlay;
  showOverlay(type, title, subtitle);

  if (scannerState.overlayTimer) {
    clearTimeout(scannerState.overlayTimer);
  }

  scannerState.overlayTimer = setTimeout(() => {
    hideOverlay();
    state.pendingOverlay = null;
    setStatus("escaneando");
  }, 2000);
}

function renderAttendeeRow(attendee) {
  return `
    <tr>
      <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(attendee.name)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(attendee.email)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(attendee.phone)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(attendee.company)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(attendee.position)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(attendee.registrationType)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(attendee.status)}</td>
      <td class="px-4 py-3 text-slate-700">${escapeHtml(metadataText(attendee.metadata))}</td>
      <td class="px-4 py-3"><button type="button" data-action="validate-attendee" data-qrcode="${escapeAttribute(attendee.qrCode)}" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">Validar</button></td>
    </tr>
  `;
}

function renderField(name, label, type = "text", required = true) {
  const fieldId = `field-${name}`;
  return `
    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-700">${label}</span>
      <input id="${fieldId}" name="${name}" type="${type}" autocomplete="off" ${required ? "required" : ""} class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
    </label>
  `;
}

function renderAppNav(route) {
  const isProductArea =
    route.name === "product" ||
    route.name === "productSearch" ||
    route.name === "productStats" ||
    route.name === "register";

  if (!isProductArea || !state.product) return "";

  const items = [
    {
      href: `#/products/${state.product.id}`,
      key: "product",
      label: "Escanear",
      icon: renderIcon("scan"),
      primary: true,
    },
    {
      href: `#/products/${state.product.id}/search`,
      key: "productSearch",
      label: "Buscar",
      icon: renderIcon("search"),
      primary: true,
    },
    {
      href: `#/products/${state.product.id}/stats`,
      key: "productStats",
      label: "Stats",
      icon: renderIcon("stats"),
    },
    {
      href: `#/register/${state.product.id}`,
      key: "register",
      label: "Alta",
      icon: renderIcon("plus"),
    },
  ];

  return `
    <nav class="app-bottom-nav-wrap fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6" aria-label="Navegacion del producto">
      <div class="app-bottom-nav relative grid grid-cols-4 gap-2 rounded-[28px] border border-white/70 bg-white/92 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
        ${items
          .map((item) => {
            const isActive =
              route.name === item.key ||
              (item.key === "product" && route.name === "product");
            return `
            <a href="${item.href}" aria-label="${item.label}" class="app-nav-item ${item.primary ? "app-nav-item-primary" : ""} ${isActive ? "app-nav-item-active" : ""}">
              <span class="app-nav-icon">${item.icon}</span>
              <span class="app-nav-label">${item.label}</span>
            </a>
          `;
          })
          .join("")}
      </div>
    </nav>
  `;
}

function renderIcon(name) {
  const icons = {
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M7 12h10"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>',
    stats:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16v-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    flash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v6c0 4.4 2.9 8.4 7 9 4.1-.6 7-4.6 7-9V6l-7-3Z"/><path d="m9.5 12 1.7 1.7 3.3-3.7"/></svg>',
  };

  return icons[name] || "";
}

function emptyState(message) {
  return `<section class="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-600">${escapeHtml(message)}</section>`;
}

function getRegisterPayload(formData) {
  return {
    advertising: formData.advertising ? 1 : 0,
    company: formData.company,
    email: formData.email,
    last_name: formData.last_name,
    name: formData.name,
    phone: formData.phone,
    position: formData.position,
    tax_id: formData.tax_id,
  };
}

function getProductRegistrationPayload(userId) {
  return {
    metadata: {},
    products: [Number(state.product.id)],
    promo: "",
    user_id: userId,
  };
}

async function handleSubmit(event) {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) return;

  if (form.id === "loginForm") {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await apiFetch("/api/v1/login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify(formData),
      });
      const token = extractAuthToken(response);

      if (!token) {
        throw new Error("La API no devolvio un token valido.");
      }

      state.loginError = null;
      resetSessionState();
      persistToken(token);
      window.location.hash = "#/campaigns";
    } catch (error) {
      state.loginError = error.message;
      render();
    }

    return;
  }

  if (form.id === "registerForm") {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      if (!state.product?.id) {
        throw new Error("No hay un producto seleccionado para registrar.");
      }

      const userResponse = await apiFetch("/api/v1/register", {
        method: "POST",
        headers: {},
        body: JSON.stringify(getRegisterPayload(formData)),
      });

      const registrationResponse = await apiFetch(
        "/api/v1/trackit/registration",
        {
        method: "POST",
        headers: {},
        body: JSON.stringify(getProductRegistrationPayload(userResponse.id)),
        },
      );

      const uniqueId = registrationResponse.registrations?.[0]?.unique_id;
      if (!uniqueId) {
        throw new Error("No se pudo obtener el identificador de registro.");
      }

      const validation = await validateQr(uniqueId);
      await refreshCurrentProduct();

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
      state.registerMessage = `Registrado y validado: ${validation.attendee.name}`;
      render();
      showValidationOverlay();
      form.reset();
    } catch (error) {
      state.registerMessage = null;
      state.registerError = error.message;
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
    const attemptedAttendee =
      state.searchResults.find(
        (entry) => entry.qrCode === actionEl.dataset.qrcode,
      ) ||
      state.product?.attendees?.find(
        (entry) => entry.qrCode === actionEl.dataset.qrcode,
      ) ||
      null;

    try {
      const validation = await validateQr(actionEl.dataset.qrcode);
      await refreshCurrentProduct();
      if (getRoute().name === "productSearch") {
        state.searchValidation = {
          ok: true,
          message: validation.title,
          attendee: validation.attendee,
        };
        state.searchQuery = "";
        state.searchResults = [];
        const input = document.getElementById("manualSearchInput");
        if (input instanceof HTMLInputElement) {
          input.value = "";
        }
        const resultsEl = document.getElementById("manualSearchResults");
        if (resultsEl) {
          resultsEl.innerHTML = "";
        }
        syncSearchValidationUI();
      } else {
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
        syncLastValidationUI();
        showValidationOverlay();
      }
    } catch (error) {
      if (getRoute().name === "productSearch") {
        state.searchValidation = {
          ok: false,
          message: error.message,
          attendee: attemptedAttendee,
        };
        state.searchResults = attemptedAttendee ? [attemptedAttendee] : [];
        const resultsEl = document.getElementById("manualSearchResults");
        if (resultsEl) {
          resultsEl.innerHTML = attemptedAttendee
            ? renderSearchResults(true)
            : "";
        }
        syncSearchValidationUI();
      } else {
        state.lastValidation = null;
        state.pendingOverlay = {
          type: "error",
          title: "Error de verificacion",
          subtitle: error.message,
        };
        showValidationOverlay();
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
    state.searchQuery = "";
    state.searchResults = [];
    state.searchValidation = null;
    const input = document.getElementById("manualSearchInput");
    const resultsEl = document.getElementById("manualSearchResults");
    if (input instanceof HTMLInputElement) {
      input.value = "";
      input.focus();
    }
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults(false);
    }
    syncSearchValidationUI();
    syncSearchClearButton();
    render();
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.id === "manualSearchInput") {
    state.searchQuery = target.value;
    state.searchValidation = null;
    const normalized = normalizeSearch(target.value);
    state.searchResults =
      normalized.length >= 2
        ? filterAttendees(state.product?.attendees || [], target.value)
        : [];
    const resultsEl = document.getElementById("manualSearchResults");
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults(normalized.length >= 2);
    }

    syncSearchValidationUI();
    syncSearchClearButton();
  }
}

function filterAttendees(attendees, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return attendees;

  return attendees.filter((attendee) => {
    const haystack = normalizeSearch(
      [
        attendee.name,
        attendee.email,
        attendee.phone,
        attendee.company,
        attendee.position,
        attendee.registrationType,
        attendee.qrCode,
        ...attendee.metadata.flatMap((item) => [item.key, item.value]),
      ].join(" "),
    );

    return haystack.includes(normalized);
  });
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ñ", "n");
}

async function validateQr(decodedText) {
  const campaignId = getCurrentCampaignId();
  const response = await apiFetch(
    `/api/v1/verify/${encodeURIComponent(decodedText)}?campaign_id=${encodeURIComponent(campaignId)}`,
    {
      method: "POST",
    },
  );

  const attendee = normalizeRegistration(response.data);
  return {
    ok: true,
    title: "Verificado correctamente",
    subtitle: `${attendee.name} · ${attendee.registrationType} · ${metadataText(attendee.metadata)}`,
    attendee,
  };
}

async function refreshCurrentProduct() {
  if (!state.product?.id) return;

  const response = await apiFetch(`/api/v1/registrations/${state.product.id}`);
  state.product = buildProductFromRegistrations(
    state.product.id,
    response.data || [],
    state.product,
  );

  if (getRoute().name === "productSearch") {
    const normalized = normalizeSearch(state.searchQuery);
    state.searchResults =
      normalized.length >= 2
        ? filterAttendees(state.product.attendees, state.searchQuery)
        : [];
    const resultsEl = document.getElementById("manualSearchResults");
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults(normalized.length >= 2);
    }
  }
}

function getProductStats(attendees) {
  const relevant = attendees.filter(
    (attendee) => attendee.status === "paid" || attendee.status === "verified",
  );
  const grouped = new Map();

  for (const attendee of relevant) {
    const key = attendee.registrationType || "sin tipo";
    const current = grouped.get(key) || { label: key, total: 0, verified: 0 };
    current.total += 1;
    if (attendee.status === "verified") {
      current.verified += 1;
    }
    grouped.set(key, current);
  }

  const byType = [...grouped.values()]
    .sort((a, b) => a.label.localeCompare(b.label, "es"))
    .map((entry) => ({
      ...entry,
      percentage: entry.total
        ? Math.round((entry.verified / entry.total) * 100)
        : 0,
    }));

  return {
    totalPaidOrVerified: relevant.length,
    totalVerified: relevant.filter((attendee) => attendee.status === "verified")
      .length,
    byType,
  };
}

async function setupScanner({ autoStart = false } = {}) {
  if (!state.product || scannerState.boundProductId === state.product.id) {
    bindScannerControls();
    if (autoStart) {
      await autoStartScanner();
    }
    return;
  }

  scannerState.html5QrCode = new Html5Qrcode("reader");
  scannerState.boundProductId = state.product.id;
  bindScannerControls();

  if (autoStart) {
    await autoStartScanner();
  }
}

async function autoStartScanner() {
  if (scannerState.isRunning || !scannerState.html5QrCode) return;

  showScannerLoading("Abriendo camara...");
  try {
    await startScanner();
  } catch (error) {
    console.error(error);
    hideScannerLoading();
    setStatus(
      "pulsa iniciar camara si el navegador no la abre automaticamente",
    );
  }
}

function bindScannerControls() {
  const torchBtn = document.getElementById("torchBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");

  if (!(torchBtn && zoomInBtn && zoomOutBtn)) return;

  torchBtn.onclick = async () => {
    try {
      await setTorch(!scannerState.torchOn);
    } catch (error) {
      console.error(error);
      setStatus("linterna no soportada o no disponible");
    }
  };

  zoomInBtn.onclick = async () => {
    try {
      await setZoom(
        (scannerState.currentZoom ?? 1) + (scannerState.zoomCaps?.step ?? 0.1),
      );
    } catch (error) {
      console.error(error);
      setStatus("zoom no soportado");
    }
  };

  zoomOutBtn.onclick = async () => {
    try {
      await setZoom(
        (scannerState.currentZoom ?? 1) - (scannerState.zoomCaps?.step ?? 0.1),
      );
    } catch (error) {
      console.error(error);
      setStatus("zoom no soportado");
    }
  };
}

function setStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = `Estado: ${text}`;

  const loadingTextEl = document.getElementById("scannerLoadingText");
  if (loadingTextEl && text === "pidiendo acceso a camara...") {
    loadingTextEl.textContent = "Abriendo camara...";
  }
}

function setResult(text) {
  const resultEl = document.getElementById("result");
  if (resultEl) resultEl.textContent = `Ultimo resultado: ${text}`;
}

function showOverlay(type, title, subtitle) {
  const overlayEl = document.getElementById("scanOverlay");
  const overlayIconEl = document.getElementById("scanOverlayIcon");
  const overlayTitleEl = document.getElementById("scanOverlayTitle");
  const overlaySubtitleEl = document.getElementById("scanOverlaySubtitle");
  if (!(overlayEl && overlayIconEl && overlayTitleEl && overlaySubtitleEl))
    return;

  overlayEl.classList.remove("hidden", "success", "error");
  overlayEl.classList.add(type);
  overlayIconEl.textContent = type === "success" ? "✓" : "✕";
  overlayTitleEl.textContent = title;
  overlaySubtitleEl.textContent = subtitle;
}

function hideOverlay() {
  const overlayEl = document.getElementById("scanOverlay");
  if (!overlayEl) return;
  overlayEl.classList.add("hidden");
  overlayEl.classList.remove("success", "error");
}

async function handleScanResult(decodedText) {
  if (scannerState.processingResult) return;
  scannerState.processingResult = true;

  try {
    setResult(decodedText);
    setStatus("verificando...");

    const validation = await validateQr(decodedText);

    if (validation.ok) {
      await refreshCurrentProduct();
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
      syncLastValidationUI();
      showValidationOverlay();
      setStatus("verificacion correcta");
    }

    if (scannerState.overlayTimer) {
      clearTimeout(scannerState.overlayTimer);
    }

    scannerState.overlayTimer = setTimeout(() => {
      hideOverlay();
      setStatus("escaneando");
      scannerState.processingResult = false;
      scannerState.lastText = null;
      scannerState.lastTs = 0;
    }, 2000);
  } catch (error) {
    console.error(error);
    const subtitle = error.message || "Ha fallado el proceso";
    state.lastValidation = null;
    syncLastValidationUI();
    showOverlay("error", "Error de verificacion", subtitle);
    setStatus("verificacion incorrecta");

    if (scannerState.overlayTimer) {
      clearTimeout(scannerState.overlayTimer);
    }

    scannerState.overlayTimer = setTimeout(() => {
      hideOverlay();
      setStatus("escaneando");
      scannerState.processingResult = false;
      scannerState.lastText = null;
      scannerState.lastTs = 0;
    }, 2000);
  }
}

function onScanSuccess(decodedText) {
  if (scannerState.processingResult) return;

  const now = nowMs();
  if (
    decodedText === scannerState.lastText &&
    now - scannerState.lastTs <= 500
  ) {
    handleScanResult(decodedText);
    return;
  }

  scannerState.lastText = decodedText;
  scannerState.lastTs = now;
  setStatus("QR detectado, confirmando...");
}

function onScanFailure() {}

async function setupTrackControls() {
  const video = document.querySelector("#reader video");
  if (!video || !video.srcObject) return;

  const stream = video.srcObject;
  scannerState.track = stream.getVideoTracks()[0];
  if (!scannerState.track) return;

  const capabilities = scannerState.track.getCapabilities
    ? scannerState.track.getCapabilities()
    : {};
  const torchBtn = document.getElementById("torchBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");

  if (capabilities && "torch" in capabilities && torchBtn) {
    torchBtn.hidden = false;
    torchBtn.innerHTML = renderIcon("flash");
    torchBtn.classList.toggle("is-active", scannerState.torchOn);
  }

  if (capabilities && capabilities.zoom && zoomInBtn && zoomOutBtn) {
    scannerState.zoomCaps = capabilities.zoom;
    scannerState.currentZoom =
      scannerState.track.getSettings?.().zoom ?? scannerState.zoomCaps.min ?? 1;
    zoomInBtn.hidden = false;
    zoomOutBtn.hidden = false;
  }
}

async function setTorch(enabled) {
  if (!scannerState.track) return;
  await scannerState.track.applyConstraints({ advanced: [{ torch: enabled }] });
  scannerState.torchOn = enabled;
  const torchBtn = document.getElementById("torchBtn");
  if (torchBtn) {
    torchBtn.innerHTML = renderIcon("flash");
    torchBtn.classList.toggle("is-active", scannerState.torchOn);
  }
}

async function setZoom(nextZoom) {
  if (!scannerState.track || !scannerState.zoomCaps) return;

  const min = scannerState.zoomCaps.min ?? 1;
  const max = scannerState.zoomCaps.max ?? nextZoom;
  const step = scannerState.zoomCaps.step ?? 0.1;
  const clamped = Math.max(min, Math.min(max, nextZoom));
  const snapped = Math.round(clamped / step) * step;

  await scannerState.track.applyConstraints({ advanced: [{ zoom: snapped }] });
  scannerState.currentZoom = snapped;
}

async function startScanner() {
  if (scannerState.isRunning || !scannerState.html5QrCode) return;

  setStatus("pidiendo acceso a camara...");
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras || cameras.length === 0) {
    throw new Error("No se han encontrado camaras");
  }

  const backCamera =
    cameras.find((camera) => /back|rear|environment/gi.test(camera.label)) ||
    cameras[cameras.length - 1];

  await scannerState.html5QrCode.start(
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

  scannerState.isRunning = true;
  hideScannerLoading();
  setStatus("escaneando");
  await setupTrackControls();
}

async function stopScanner() {
  if (!scannerState.isRunning || !scannerState.html5QrCode) return;

  if (scannerState.overlayTimer) {
    clearTimeout(scannerState.overlayTimer);
    scannerState.overlayTimer = null;
  }

  hideOverlay();
  await scannerState.html5QrCode.stop();
  await scannerState.html5QrCode.clear();

  scannerState.isRunning = false;
  scannerState.track = null;
  scannerState.torchOn = false;
  scannerState.currentZoom = null;
  scannerState.zoomCaps = null;
  scannerState.processingResult = false;
  scannerState.lastText = null;
  scannerState.lastTs = 0;

  const torchBtn = document.getElementById("torchBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");

  if (torchBtn) torchBtn.hidden = true;
  if (zoomInBtn) zoomInBtn.hidden = true;
  if (zoomOutBtn) zoomOutBtn.hidden = true;
  setStatus("camara parada");
}

function showScannerLoading(text = "Abriendo camara...") {
  const loadingEl = document.getElementById("scannerLoading");
  const loadingTextEl = document.getElementById("scannerLoadingText");
  if (!loadingEl) return;
  loadingEl.classList.remove("hidden");
  if (loadingTextEl) loadingTextEl.textContent = text;
}

function hideScannerLoading() {
  const loadingEl = document.getElementById("scannerLoading");
  if (!loadingEl) return;
  loadingEl.classList.add("hidden");
}

async function destroyScanner() {
  if (scannerState.isRunning) {
    try {
      await stopScanner();
    } catch (error) {
      console.error(error);
    }
  }

  if (scannerState.html5QrCode) {
    try {
      await scannerState.html5QrCode.clear();
    } catch {}
  }

  scannerState.html5QrCode = null;
  scannerState.boundProductId = null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
