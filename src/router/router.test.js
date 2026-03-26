import { describe, expect, it } from "vitest";

import {
  applyResolvedRouteState,
  applyRouteError,
  clearScreenMessages,
  getDefaultRoute,
  getRoute,
  getRouteRedirect,
  isGuestOnlyRoute,
  isProductContextRoute,
  isScannerRoute,
  normalizeHash,
  prepareRouteUiState,
  requiresAuth,
  resetSessionState,
  setRouteLoading,
} from "./router";

function createState() {
  return {
    campaigns: [{ id: 1 }],
    products: [{ id: 2 }],
    campaign: { id: 1 },
    product: { id: 2 },
    productCampaign: { id: 1 },
    loading: false,
    searchQuery: "ana",
    searchResults: [{ id: 1 }],
    lastValidation: { ok: true },
    pendingOverlay: { type: "success" },
    searchValidation: { ok: true },
    loginError: "bad login",
    registerError: "bad register",
  };
}

describe("router", () => {
  it("normalizes empty hashes to the login path", () => {
    expect(normalizeHash("")).toBe("/login");
    expect(normalizeHash(undefined)).toBe("/login");
  });

  it("parses supported hashes", () => {
    expect(getRoute("#/login")).toEqual({ name: "login" });
    expect(getRoute("#/campaigns")).toEqual({ name: "campaigns" });
    expect(getRoute("#/campaigns/22")).toEqual({
      name: "campaignProducts",
      campaignId: "22",
    });
    expect(getRoute("#/register/campaign-all-22")).toEqual({
      name: "register",
      productId: "campaign-all-22",
    });
    expect(getRoute("#/products/7")).toEqual({ name: "product", productId: "7" });
    expect(getRoute("#/products/7/search")).toEqual({
      name: "productSearch",
      productId: "7",
    });
    expect(getRoute("#/products/7/stats")).toEqual({
      name: "productStats",
      productId: "7",
    });
  });

  it("falls back to the auth-aware default route when unknown", () => {
    expect(getRoute("#/desconocida", { hasToken: false })).toEqual({
      name: "login",
    });
    expect(getRoute("#/desconocida", { hasToken: true })).toEqual({
      name: "campaigns",
    });
    expect(getDefaultRoute({ hasToken: true })).toEqual({ name: "campaigns" });
  });

  it("identifies product-context and scanner routes", () => {
    expect(isProductContextRoute({ name: "product" })).toBe(true);
    expect(isProductContextRoute({ name: "register" })).toBe(true);
    expect(isProductContextRoute({ name: "campaigns" })).toBe(false);
    expect(isScannerRoute({ name: "product" })).toBe(true);
    expect(isScannerRoute({ name: "productSearch" })).toBe(false);
  });

  it("handles auth guards", () => {
    expect(requiresAuth({ name: "campaigns" })).toBe(true);
    expect(requiresAuth({ name: "login" })).toBe(false);
    expect(isGuestOnlyRoute({ name: "login" })).toBe(true);
    expect(isGuestOnlyRoute({ name: "product" })).toBe(false);
    expect(getRouteRedirect({ name: "campaigns" }, { hasToken: false })).toEqual({
      name: "login",
      hash: "#/login",
    });
    expect(getRouteRedirect({ name: "login" }, { hasToken: true })).toEqual({
      name: "campaigns",
      hash: "#/campaigns",
    });
    expect(getRouteRedirect({ name: "product" }, { hasToken: true })).toBeNull();
  });

  it("handles route state helpers", () => {
    const state = createState();

    clearScreenMessages(state);
    expect(state.loginError).toBeNull();
    expect(state.registerError).toBeNull();

    resetSessionState(state);
    expect(state).toMatchObject({
      campaigns: [],
      products: [],
      campaign: null,
      product: null,
      productCampaign: null,
      searchQuery: "",
      searchResults: [],
      lastValidation: null,
      pendingOverlay: null,
      searchValidation: null,
      registerError: null,
    });
  });

  it("applies resolved route state and route errors", () => {
    const state = createState();

    prepareRouteUiState(state);
    expect(state.loginError).toBeNull();
    expect(state.registerError).toBeNull();

    applyResolvedRouteState(
      state,
      { name: "productStats", productId: "7" },
      { product: { id: 7 }, campaign: { id: 3 } },
    );

    expect(state.product).toEqual({ id: 7 });
    expect(state.campaign).toEqual({ id: 3 });
    expect(state.searchQuery).toBe("");
    expect(state.searchResults).toEqual([]);
    expect(state.searchValidation).toBeNull();

    const searchState = createState();
    applyResolvedRouteState(
      searchState,
      { name: "productSearch", productId: "7" },
      { product: { id: 7 } },
    );
    expect(searchState.searchValidation).toEqual({ ok: true });

    const nonProductState = createState();
    applyResolvedRouteState(nonProductState, { name: "campaigns" }, { campaigns: [] });
    expect(nonProductState.searchQuery).toBe("ana");

    const loginState = createState();
    const registerState = createState();
    applyRouteError(loginState, { name: "login" }, new Error("Credenciales invalidas"));
    applyRouteError(registerState, { name: "register" }, new Error("No se pudo registrar"));
    expect(loginState.loginError).toBe("Credenciales invalidas");
    expect(registerState.registerError).toBe("No se pudo registrar");

    setRouteLoading(state, true);
    expect(state.loading).toBe(true);
    setRouteLoading(state, false);
    expect(state.loading).toBe(false);
  });
});
