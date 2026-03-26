import { describe, expect, it, vi } from "vitest";

import {
  createUiError,
  getApiErrorMessage,
  getDisplayErrorMessage,
} from "./ui-error";
import { isDevelopmentMode, logErrorDev } from "./runtime-utils";

describe("getApiErrorMessage", () => {
  it("maps login errors to a safe ui message", () => {
    expect(getApiErrorMessage({ path: "/api/v1/login", status: 401 })).toBe(
      "No se ha podido iniciar sesion. Revisa tus credenciales e intentalo de nuevo.",
    );
  });

  it("maps registration errors to a safe ui message", () => {
    expect(
      getApiErrorMessage({ path: "/api/v1/trackit/registration", status: 422 }),
    ).toBe("No se ha podido completar el alta. Revisa los datos e intentalo de nuevo.");
  });

  it("maps verification errors to a safe ui message", () => {
    expect(getApiErrorMessage({ path: "/api/v1/verify/qr-1", status: 409 })).toBe(
      "No se ha podido validar el QR. Comprueba el codigo e intentalo otra vez.",
    );
  });

  it("shows previous access message for verification when returned by api", () => {
    expect(
      getApiErrorMessage({
        path: "/api/v1/verify/qr-1",
        status: 409,
        backendMessage: "Acceso realizado anteriormente",
      }),
    ).toBe("Acceso realizado anteriormente");
  });

  it("maps generic statuses without exposing backend detail", () => {
    expect(getApiErrorMessage({ path: "/api/v1/campaigns", status: 429 })).toBe(
      "Hay demasiadas solicitudes. Espera un momento y vuelve a intentarlo.",
    );
  });
});

describe("ui error helpers", () => {
  it("returns a normalized display message", () => {
    expect(getDisplayErrorMessage(new Error("Fallo controlado"))).toBe("Fallo controlado");
    expect(getDisplayErrorMessage(null, "Fallback")).toBe("Fallback");
  });

  it("creates errors with extra metadata", () => {
    const error = createUiError("Mensaje", { status: 500, backendMessage: "trace" });
    expect(error.message).toBe("Mensaje");
    expect(error.status).toBe(500);
    expect(error.backendMessage).toBe("trace");
  });
});

describe("runtime utils", () => {
  it("detects development mode from env", () => {
    expect(isDevelopmentMode({ DEV: true })).toBe(true);
    expect(isDevelopmentMode({ DEV: false })).toBe(false);
  });

  it("logs only in development mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logErrorDev("debug", new Error("boom"), { DEV: false });
    logErrorDev("debug", new Error("boom"), { DEV: true });

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
