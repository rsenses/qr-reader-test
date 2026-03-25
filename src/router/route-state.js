import { isProductContextRoute } from "./router";

export function clearScreenMessages(state) {
  state.loginError = null;
  state.registerError = null;
}

export function resetSessionState(state) {
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
  state.registerError = null;
}

export function prepareRouteUiState(state) {
  clearScreenMessages(state);
}

export function applyResolvedRouteState(state, route, resolvedRouteData) {
  Object.assign(state, resolvedRouteData);

  if (!isProductContextRoute(route)) return;

  state.searchResults = [];
  state.searchQuery = "";

  if (route.name !== "productSearch") {
    state.searchValidation = null;
  }
}

export function applyRouteError(state, route, error) {
  if (route.name === "login") {
    state.loginError = error.message;
  }

  if (route.name === "register") {
    state.registerError = error.message;
  }
}

export function setRouteLoading(state, isLoading) {
  state.loading = isLoading;
}
