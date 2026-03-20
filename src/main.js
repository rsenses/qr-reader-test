import "./style.css";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { installFakeApi } from "./fakeApi";

installFakeApi();

const TOKEN_KEY = "qr-test-token";
const USER_KEY = "qr-test-user";

const app = document.querySelector("#app");

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  user: safeJsonParse(localStorage.getItem(USER_KEY)),
  campaigns: [],
  products: [],
  campaign: null,
  product: null,
  productCampaign: null,
  message: null,
  error: null,
  loading: false,
  searchQuery: "",
  searchResults: [],
};

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

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.error("No se pudo registrar el service worker", error);
    }
  });
}

function nowMs() {
  return performance.now();
}

function setMessage(message) {
  state.message = message;
  state.error = null;
  updateFeedbackRegion();
}

function setError(message) {
  state.error = message;
  state.message = null;
  updateFeedbackRegion();
}

function clearFeedback() {
  state.message = null;
  state.error = null;
  updateFeedbackRegion();
}

function metadataText(metadata = []) {
  if (!metadata.length) return "Sin metadatos";
  return metadata.map((item) => `${item.key}: ${item.value}`).join(" · ");
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Error inesperado");
    error.data = data;
    throw error;
  }

  return data;
}

async function bootstrap() {
  if (!window.location.hash) {
    window.location.hash = state.token ? "#/campaigns" : "#/login";
    return;
  }

  await handleRouteChange();
}

async function handleRouteChange() {
  const route = getRoute();

  if (!state.token && route.name !== "login" && route.name !== "register") {
    window.location.hash = "#/login";
    return;
  }

  if (route.name !== "product") {
    await destroyScanner();
  }

  clearFeedback();
  state.loading = true;
  render();

  try {
  if (route.name === "campaigns") {
      const response = await apiFetch("/api/v1/campaigns");
      state.campaigns = response.campaigns;
    }

    if (route.name === "campaignProducts") {
      const response = await apiFetch(`/api/v1/campaigns/${route.campaignId}/products`);
      state.campaign = response.campaign;
      state.products = response.products;
    }

    if (route.name === "product" || route.name === "productSearch" || route.name === "productStats") {
      const response = await apiFetch(`/api/v1/products/${route.productId}`);
      state.productCampaign = response.campaign;
      state.product = response.product;
      state.searchResults = [];
      state.searchQuery = "";
    }
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
    if (route.name === "product" && state.product?.id === route.productId) {
      await setupScanner({ autoStart: true });
    }
  }
}

function getRoute() {
  const hash = window.location.hash.replace(/^#/, "") || "/login";

  if (hash === "/login") return { name: "login" };
  if (hash === "/register") return { name: "register" };
  if (hash === "/campaigns") return { name: "campaigns" };

  const campaignMatch = hash.match(/^\/campaigns\/([^/]+)$/);
  if (campaignMatch) return { name: "campaignProducts", campaignId: campaignMatch[1] };

  const productMatch = hash.match(/^\/products\/([^/]+)$/);
  if (productMatch) return { name: "product", productId: productMatch[1] };

  const productSearchMatch = hash.match(/^\/products\/([^/]+)\/search$/);
  if (productSearchMatch) return { name: "productSearch", productId: productSearchMatch[1] };

  const productStatsMatch = hash.match(/^\/products\/([^/]+)\/stats$/);
  if (productStatsMatch) return { name: "productStats", productId: productStatsMatch[1] };

  return { name: state.token ? "campaigns" : "login" };
}

function render() {
  const route = getRoute();
  const page = renderPage(route);
  const appNav = renderAppNav(route);

  app.innerHTML = `
    <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900">
      <div class="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 sm:max-w-2xl sm:px-6">
        <header class="mb-4 flex items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <h1 class="font-heading text-lg text-slate-900">QR Access</h1>
            <p class="text-xs text-slate-500">${renderHeaderSubtitle(route)}</p>
          </div>
          ${state.token ? `<button type="button" data-action="logout" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">Salir</button>` : ""}
        </header>

        ${renderFeedback()}

        <main class="flex-1 pb-24">${page}</main>

        ${appNav}
      </div>
    </div>
  `;
}

function renderHeaderSubtitle(route) {
  if (route.name === "login") return "Acceso";
  if (route.name === "campaigns") return "Campañas";
  if (route.name === "campaignProducts") return state.campaign?.name || "Productos";
  if (route.name === "product" || route.name === "productSearch" || route.name === "productStats") {
    return state.product?.name || "Producto";
  }
  if (route.name === "register") return "Registro";
  return state.user?.email || "App";
}

function renderFeedback() {
  const isError = Boolean(state.error);
  const text = escapeHtml(state.error || state.message || "");

  return `
    <div id="feedbackRegion" class="${state.message || state.error ? "mb-6" : "hidden"} rounded-2xl border px-4 py-3 text-sm font-medium ${isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}">
      ${text}
    </div>
  `;
}

function updateFeedbackRegion() {
  const feedbackEl = document.getElementById("feedbackRegion");
  if (!feedbackEl) return;

  const isError = Boolean(state.error);
  const text = state.error || state.message;

  if (!text) {
    feedbackEl.className = "hidden rounded-2xl border px-4 py-3 text-sm font-medium";
    feedbackEl.textContent = "";
    return;
  }

  feedbackEl.className = `mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${isError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`;
  feedbackEl.textContent = text;
}

function renderPage(route) {
  if (state.loading) {
    return `
      <section class="flex min-h-[50vh] items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
        <div>
          <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
          <p class="mt-4 text-sm font-medium text-slate-600">Cargando datos de la demo...</p>
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
      <article class="w-full rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 class="font-heading text-2xl text-slate-900">Acceder</h2>
        <p class="mt-1 text-sm text-slate-500">Solo email y contrasena.</p>
        <form id="loginForm" class="mt-6 space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input id="login-email" type="email" name="email" autocomplete="username email" required value="demo@qrtest.es" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input id="login-password" type="password" name="password" autocomplete="current-password" required value="123456" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
          </label>
          <button class="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Entrar</button>
        </form>
      </article>
    </section>
  `;
}

function renderRegister() {
  return `
    <section class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-heading text-2xl text-slate-900">Nuevo registro</h2>
          <p class="mt-1 text-sm text-slate-500">Formulario simple, sin metadatos.</p>
        </div>
        ${state.product ? `<a href="#/products/${state.product.id}" class="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Volver</a>` : `<a href="#/login" class="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Login</a>`}
      </div>

      <form id="registerForm" class="mt-6 grid gap-4">
        ${renderField("name", "Nombre completo")}
        ${renderField("email", "Email", "email")}
        ${renderField("phone", "Telefono")}
        ${renderField("company", "Empresa")}
        ${renderField("position", "Cargo")}
        ${renderField("registrationType", "Tipo de inscripcion")}
        <button class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Registrar</button>
      </form>
    </section>
  `;
}

function renderCampaigns() {
  return `
    <section>
      <div class="mb-4">
        <div>
          <h2 class="font-heading text-2xl text-slate-900">Campañas activas</h2>
          <p class="mt-1 text-sm text-slate-500">Selecciona una campaña.</p>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${state.campaigns.map((campaign) => `
          <a href="#/campaigns/${campaign.id}" class="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <img src="${campaign.image}" alt="${escapeHtml(campaign.name)}" class="h-36 w-full object-cover" />
            <div class="p-4">
              <h3 class="font-heading text-xl text-slate-900">${escapeHtml(campaign.name)}</h3>
              <p class="mt-1 text-sm text-slate-500">${campaign.productCount} productos</p>
            </div>
          </a>
        `).join("")}
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
      <div class="mt-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 class="font-heading text-2xl text-slate-900">${escapeHtml(state.campaign.name)}</h2>
        <div class="mt-4 grid gap-3">
          ${state.products.map((product) => `
            <a href="#/products/${product.id}" class="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <h3 class="font-heading text-xl text-slate-900">${escapeHtml(product.name)}</h3>
              <p class="mt-1 text-sm text-slate-500">${product.attendeeCount} inscritos</p>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderProductDetail() {
  if (!state.product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  return `
    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3 px-1">
        <a href="#/campaigns/${state.productCampaign.id}" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">← Productos</a>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Escanear</span>
      </div>

      <article class="rounded-[28px] border border-white/70 bg-white/90 p-3 shadow-sm sm:p-4">
          <div class="mb-3">
            <h2 class="font-heading text-2xl text-slate-900">${escapeHtml(state.product.name)}</h2>
            <p class="text-sm text-slate-500">${escapeHtml(state.productCampaign.name)}</p>
          </div>

          <div class="space-y-3">
            <div class="controls flex flex-wrap gap-3 px-1">
              <button id="torchBtn" type="button" hidden class="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-amber-950">Linterna</button>
              <button id="zoomOutBtn" type="button" hidden class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">-</button>
              <button id="zoomInBtn" type="button" hidden class="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">+</button>
            </div>

            <div class="reader-shell relative overflow-hidden rounded-[28px] bg-black shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
              <div id="reader" class="min-h-[420px] w-full bg-black"></div>
              <div id="scanOverlay" class="scan-overlay hidden" aria-live="polite">
                <div class="scan-overlay-card">
                  <div id="scanOverlayIcon" class="scan-overlay-icon">✓</div>
                  <div id="scanOverlayTitle" class="scan-overlay-title">Verificado correctamente</div>
                  <div id="scanOverlaySubtitle" class="scan-overlay-subtitle">QR leido y validado</div>
                </div>
              </div>
            </div>
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

      <article class="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 class="font-heading text-2xl text-slate-900">Buscar inscritos</h2>
        <p class="mt-1 text-sm text-slate-500">Escribe al menos 2 caracteres. La busqueda ignora acentos y eñes.</p>

        <div class="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <input id="manualSearchInput" value="${escapeAttribute(state.searchQuery)}" placeholder="Nombre, email, empresa, metadata..." class="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none" />
          ${state.searchQuery ? `<button type="button" data-action="clear-search" class="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Limpiar</button>` : ""}
        </div>

        <div id="manualSearchResults" class="mt-4 space-y-3">
          ${renderSearchResults(hasEnoughChars)}
        </div>
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

      <article class="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 class="font-heading text-2xl text-slate-900">Estadisticas</h2>
        <p class="mt-1 text-sm text-slate-500">${escapeHtml(state.product.name)}</p>

        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-2xl bg-slate-100 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inscritos</p>
            <p class="mt-2 text-3xl font-bold text-slate-900">${stats.totalPaidOrVerified}</p>
          </div>
          <div class="rounded-2xl bg-emerald-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Verificados</p>
            <p class="mt-2 text-3xl font-bold text-emerald-800">${stats.totalVerified}</p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          ${stats.byType.length ? stats.byType.map((entry) => `
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
          `).join("") : `<p class="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">No hay inscritos paid o verified para mostrar.</p>`}
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

  return state.searchResults.map((attendee) => `
    <article class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-slate-900">${escapeHtml(attendee.name)}</h3>
          <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.email)}</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${attendee.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}">${escapeHtml(attendee.status)}</span>
      </div>
      <p class="mt-3 text-sm text-slate-600">${escapeHtml(attendee.phone)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.company)} · ${escapeHtml(attendee.position)}</p>
      <p class="mt-1 text-sm text-slate-600">${escapeHtml(attendee.registrationType)}</p>
      <p class="mt-2 text-xs text-slate-500">${escapeHtml(metadataText(attendee.metadata))}</p>
      <button type="button" data-action="validate-attendee" data-qrcode="${escapeAttribute(attendee.qrCode)}" class="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Validar inscrito</button>
    </article>
  `).join("");
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

function renderField(name, label, type = "text") {
  const fieldId = `field-${name}`;
  return `
    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-700">${label}</span>
      <input id="${fieldId}" name="${name}" type="${type}" autocomplete="off" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
    </label>
  `;
}

function renderAppNav(route) {
  if (!state.token || !state.product) return "";

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
      href: "#/register",
      key: "register",
      label: "Alta",
      icon: renderIcon("plus"),
    },
  ];

  return `
    <nav class="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-4 pb-4 sm:max-w-2xl sm:px-6" aria-label="Navegacion del producto">
      <div class="grid grid-cols-4 gap-2 rounded-[28px] border border-white/70 bg-white/92 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
        ${items.map((item) => {
          const isActive = route.name === item.key || (item.key === "product" && route.name === "product");
          return `
            <a href="${item.href}" aria-label="${item.label}" class="app-nav-item ${item.primary ? "app-nav-item-primary" : ""} ${isActive ? "app-nav-item-active" : ""}">
              <span class="app-nav-icon">${item.icon}</span>
              <span class="app-nav-label">${item.label}</span>
            </a>
          `;
        }).join("")}
      </div>
    </nav>
  `;
}

function renderIcon(name) {
  const icons = {
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M20 8V6a2 2 0 0 0-2-2h-2"/><path d="M4 16v2a2 2 0 0 0 2 2h2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M7 12h10"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V8"/><path d="M17 16v-7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  };

  return icons[name] || "";
}

function emptyState(message) {
  return `<section class="rounded-[32px] border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-600">${escapeHtml(message)}</section>`;
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
        body: JSON.stringify(formData),
      });

      state.token = response.token;
      state.user = response.user;
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      state.message = `Bienvenido ${response.user.name}. Token recibido y guardado.`;
      window.location.hash = "#/campaigns";
    } catch (error) {
      setError(error.message);
    }
  }

  if (form.id === "registerForm") {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await apiFetch("/api/v1/register/", {
        method: "POST",
        headers: {},
        body: JSON.stringify(formData),
      });
      state.message = `${response.message}: ${response.user.name}`;
      render();
      form.reset();
    } catch (error) {
      setError(error.message);
    }
  }
}

async function handleClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  if (!action) return;

  if (action === "logout") {
    await destroyScanner();
    state.token = null;
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.hash = "#/login";
    return;
  }

  if (action === "validate-attendee") {
    try {
      const validation = await fakeValidateQr(target.dataset.qrcode);
      setMessage(validation.subtitle);
      await refreshCurrentProduct();
    } catch (error) {
      setError(error.message);
    }
    return;
  }

  if (action === "clear-search") {
    state.searchQuery = "";
    state.searchResults = [];
    const input = document.getElementById("manualSearchInput");
    const resultsEl = document.getElementById("manualSearchResults");
    if (input instanceof HTMLInputElement) {
      input.value = "";
      input.focus();
    }
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults(false);
    }
    render();
  }
}

function handleInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.id === "manualSearchInput") {
    state.searchQuery = target.value;
    const normalized = normalizeSearch(target.value);
    state.searchResults = normalized.length >= 2 ? filterAttendees(state.product?.attendees || [], target.value) : [];
    const resultsEl = document.getElementById("manualSearchResults");
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults(normalized.length >= 2);
    }
  }
}

function filterAttendees(attendees, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return attendees;

  return attendees.filter((attendee) => {
    const haystack = normalizeSearch([
      attendee.name,
      attendee.email,
      attendee.phone,
      attendee.company,
      attendee.position,
      attendee.registrationType,
      attendee.qrCode,
      ...attendee.metadata.flatMap((item) => [item.key, item.value]),
    ].join(" "));

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

async function fakeValidateQr(decodedText) {
  const response = await apiFetch(`/api/v1/validate/${encodeURIComponent(decodedText)}`, {
    method: "POST",
  });

  const attendee = response.attendee;
  return {
    ok: true,
    title: response.title,
    subtitle: `${attendee.name} · ${attendee.registrationType} · ${metadataText(attendee.metadata)}`,
  };
}

async function refreshCurrentProduct() {
  if (!state.product?.id) return;

  const response = await apiFetch(`/api/v1/products/${state.product.id}`);
  state.productCampaign = response.campaign;
  state.product = response.product;

  if (getRoute().name === "productSearch") {
    const normalized = normalizeSearch(state.searchQuery);
    state.searchResults = normalized.length >= 2 ? filterAttendees(state.product.attendees, state.searchQuery) : [];
    const resultsEl = document.getElementById("manualSearchResults");
    if (resultsEl) {
      resultsEl.innerHTML = renderSearchResults(normalized.length >= 2);
    }
  }
}

function getProductStats(attendees) {
  const relevant = attendees.filter((attendee) => attendee.status === "paid" || attendee.status === "verified");
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
      percentage: entry.total ? Math.round((entry.verified / entry.total) * 100) : 0,
    }));

  return {
    totalPaidOrVerified: relevant.length,
    totalVerified: relevant.filter((attendee) => attendee.status === "verified").length,
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

  try {
    await startScanner();
  } catch (error) {
    console.error(error);
    setStatus("pulsa iniciar camara si el navegador no la abre automaticamente");
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
      await setZoom((scannerState.currentZoom ?? 1) + (scannerState.zoomCaps?.step ?? 0.1));
    } catch (error) {
      console.error(error);
      setStatus("zoom no soportado");
    }
  };

  zoomOutBtn.onclick = async () => {
    try {
      await setZoom((scannerState.currentZoom ?? 1) - (scannerState.zoomCaps?.step ?? 0.1));
    } catch (error) {
      console.error(error);
      setStatus("zoom no soportado");
    }
  };
}

function setStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = `Estado: ${text}`;
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
  if (!(overlayEl && overlayIconEl && overlayTitleEl && overlaySubtitleEl)) return;

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

    const validation = await fakeValidateQr(decodedText);

    if (validation.ok) {
      await refreshCurrentProduct();
      showOverlay("success", validation.title, validation.subtitle);
      setStatus("verificacion correcta");
      setMessage(validation.subtitle);
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
    const subtitle = error.data?.attendee
      ? `${error.data.attendee.name} · ${error.data.attendee.registrationType} · ${metadataText(error.data.attendee.metadata)}`
      : "Ha fallado el proceso";
    showOverlay("error", "Error de verificacion", subtitle);
    setStatus("verificacion incorrecta");
    setError(error.message);

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
  if (decodedText === scannerState.lastText && now - scannerState.lastTs <= 500) {
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

  const capabilities = scannerState.track.getCapabilities ? scannerState.track.getCapabilities() : {};
  const torchBtn = document.getElementById("torchBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");

  if (capabilities && "torch" in capabilities && torchBtn) {
    torchBtn.hidden = false;
  }

  if (capabilities && capabilities.zoom && zoomInBtn && zoomOutBtn) {
    scannerState.zoomCaps = capabilities.zoom;
    scannerState.currentZoom = scannerState.track.getSettings?.().zoom ?? scannerState.zoomCaps.min ?? 1;
    zoomInBtn.hidden = false;
    zoomOutBtn.hidden = false;
  }
}

async function setTorch(enabled) {
  if (!scannerState.track) return;
  await scannerState.track.applyConstraints({ advanced: [{ torch: enabled }] });
  scannerState.torchOn = enabled;
  const torchBtn = document.getElementById("torchBtn");
  if (torchBtn) torchBtn.textContent = scannerState.torchOn ? "Linterna off" : "Linterna";
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

  const backCamera = cameras.find((camera) => /back|rear|environment/gi.test(camera.label)) || cameras[cameras.length - 1];

  await scannerState.html5QrCode.start(
    { deviceId: { exact: backCamera.id } },
    {
      fps: 12,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
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
