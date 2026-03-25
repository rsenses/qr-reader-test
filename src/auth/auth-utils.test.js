import { afterEach, describe, expect, it, vi } from "vitest";

import { extractAuthToken, isAuthFailureStatus } from "./auth-utils";
import { TOKEN_KEY, getStoredToken, persistToken } from "./token-storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubLocalStorage(initialValue) {
  let store = initialValue === undefined ? {} : { [TOKEN_KEY]: initialValue };

  vi.stubGlobal("localStorage", {
    getItem(key) {
      return key in store ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  });
}

describe("extractAuthToken", () => {
  it("returns the first supported token shape", () => {
    expect(extractAuthToken({ token: "abc" })).toBe("abc");
    expect(extractAuthToken({ access_token: "def" })).toBe("def");
    expect(extractAuthToken({ data: { token: "ghi" } })).toBe("ghi");
    expect(extractAuthToken({ data: { access_token: "jkl" } })).toBe("jkl");
  });

  it("ignores empty token candidates", () => {
    expect(extractAuthToken({ token: "   ", data: { token: "abc" } })).toBe(
      "abc",
    );
    expect(extractAuthToken({})).toBe("");
  });
});

describe("isAuthFailureStatus", () => {
  it("matches auth-related HTTP statuses", () => {
    expect(isAuthFailureStatus(401)).toBe(true);
    expect(isAuthFailureStatus(403)).toBe(true);
    expect(isAuthFailureStatus(500)).toBe(false);
  });
});

describe("token-storage", () => {
  it("reads and trims the stored token", () => {
    stubLocalStorage("  saved-token  ");

    expect(getStoredToken()).toBe("saved-token");
  });

  it("persists and returns a normalized token", () => {
    stubLocalStorage();

    expect(persistToken("  next-token  ")).toBe("next-token");
    expect(getStoredToken()).toBe("next-token");
  });

  it("removes the token when empty", () => {
    stubLocalStorage("existing-token");

    expect(persistToken("")).toBe("");
    expect(getStoredToken()).toBe("");
  });
});
