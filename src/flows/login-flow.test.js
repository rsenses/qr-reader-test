import { describe, expect, it, vi } from "vitest";

import {
  applyLoginError,
  applyLoginSuccess,
  submitLogin,
} from "./login-flow";

describe("login-flow", () => {
  it("submits login and returns extracted token", async () => {
    const apiFetch = vi.fn().mockResolvedValue({ data: { token: "abc" } });
    const extractAuthToken = vi.fn().mockReturnValue("abc");

    await expect(
      submitLogin(apiFetch, { email: "a", password: "b" }, extractAuthToken),
    ).resolves.toEqual({ token: "abc" });

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email: "a", password: "b" }),
    });
  });

  it("fails when no valid token is returned", async () => {
    const apiFetch = vi.fn().mockResolvedValue({});
    const extractAuthToken = vi.fn().mockReturnValue("");

    await expect(submitLogin(apiFetch, {}, extractAuthToken)).rejects.toThrow(
      "La API no devolvio un token valido.",
    );
  });

  it("applies login success and error state", () => {
    const state = { loginError: "bad", loginEmail: "ana@example.com", token: "old" };
    const persistToken = vi.fn().mockReturnValue("new-token");
    const resetSessionState = vi.fn();

    applyLoginSuccess(state, "new-token", { persistToken, resetSessionState });

    expect(state.loginError).toBeNull();
    expect(state.loginEmail).toBe("");
    expect(state.token).toBe("new-token");
    expect(resetSessionState).toHaveBeenCalledWith(state);

    applyLoginError(state, "Credenciales invalidas", "ana@example.com");
    expect(state.loginError).toBe("Credenciales invalidas");
    expect(state.loginEmail).toBe("ana@example.com");
  });
});
