import { describe, expect, it } from "vitest";

import {
  applyResolvedRouteState,
  applyRouteError,
  clearScreenMessages,
  prepareRouteUiState,
  resetSessionState,
  setRouteLoading,
} from "./route-state";

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

describe("route-state", () => {
  it("clears screen errors used by route changes", () => {
    const state = createState();

    clearScreenMessages(state);

    expect(state.loginError).toBeNull();
    expect(state.registerError).toBeNull();
  });

  it("resets session-scoped transient state", () => {
    const state = createState();

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

  it("prepares route ui state by clearing screen messages", () => {
    const state = createState();

    prepareRouteUiState(state);

    expect(state.loginError).toBeNull();
    expect(state.registerError).toBeNull();
  });

  it("applies resolved route data and resets product route search state", () => {
    const state = createState();

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
  });

  it("preserves search validation on the product search route", () => {
    const state = createState();

    applyResolvedRouteState(
      state,
      { name: "productSearch", productId: "7" },
      { product: { id: 7 } },
    );

    expect(state.searchQuery).toBe("");
    expect(state.searchResults).toEqual([]);
    expect(state.searchValidation).toEqual({ ok: true });
  });

  it("does not reset search state on non-product routes", () => {
    const state = createState();

    applyResolvedRouteState(state, { name: "campaigns" }, { campaigns: [] });

    expect(state.searchQuery).toBe("ana");
    expect(state.searchResults).toEqual([{ id: 1 }]);
    expect(state.searchValidation).toEqual({ ok: true });
  });

  it("maps route errors to the matching screen error", () => {
    const loginState = createState();
    const registerState = createState();

    applyRouteError(loginState, { name: "login" }, new Error("Credenciales invalidas"));
    applyRouteError(registerState, { name: "register" }, new Error("No se pudo registrar"));

    expect(loginState.loginError).toBe("Credenciales invalidas");
    expect(registerState.registerError).toBe("No se pudo registrar");
  });

  it("updates loading state explicitly", () => {
    const state = createState();

    setRouteLoading(state, true);
    expect(state.loading).toBe(true);

    setRouteLoading(state, false);
    expect(state.loading).toBe(false);
  });
});
