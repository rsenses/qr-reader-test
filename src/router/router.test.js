import { describe, expect, it } from "vitest";

import {
  getDefaultRoute,
  getRoute,
  isProductContextRoute,
  isScannerRoute,
  normalizeHash,
} from "./router";

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
});
