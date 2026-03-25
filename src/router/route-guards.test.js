import { describe, expect, it } from "vitest";

import {
  getRouteRedirect,
  isGuestOnlyRoute,
  requiresAuth,
} from "./route-guards";

describe("route-guards", () => {
  it("marks login as guest-only and the rest as auth-only", () => {
    expect(requiresAuth({ name: "campaigns" })).toBe(true);
    expect(requiresAuth({ name: "login" })).toBe(false);
    expect(isGuestOnlyRoute({ name: "login" })).toBe(true);
    expect(isGuestOnlyRoute({ name: "product" })).toBe(false);
  });

  it("redirects anonymous users to login", () => {
    expect(getRouteRedirect({ name: "campaigns" }, { hasToken: false })).toEqual({
      name: "login",
      hash: "#/login",
    });
  });

  it("redirects authenticated users away from login", () => {
    expect(getRouteRedirect({ name: "login" }, { hasToken: true })).toEqual({
      name: "campaigns",
      hash: "#/campaigns",
    });
  });

  it("allows valid routes when no redirect is needed", () => {
    expect(getRouteRedirect({ name: "product" }, { hasToken: true })).toBeNull();
    expect(getRouteRedirect({ name: "login" }, { hasToken: false })).toBeNull();
  });
});
