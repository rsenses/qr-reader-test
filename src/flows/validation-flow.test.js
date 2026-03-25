import { describe, expect, it, vi } from "vitest";

import {
  applyProductValidationError,
  applyProductValidationSuccess,
} from "./validation-flow";

describe("validation-flow", () => {
  it("stores successful validation state and triggers UI hooks", () => {
    const state = {
      lastValidation: null,
      pendingOverlay: null,
    };
    const syncLastValidationUI = vi.fn();
    const showValidationOverlay = vi.fn();
    const renderLastValidationCard = vi.fn();
    const validation = {
      title: "Verificado correctamente",
      subtitle: "Ana Lopez · vip · mesa: 4",
      attendee: { name: "Ana Lopez" },
    };

    applyProductValidationSuccess(state, validation, {
      syncLastValidationUI,
      renderLastValidationCard,
      showValidationOverlay,
    });

    expect(state.lastValidation).toEqual({
      ok: true,
      message: "Verificado correctamente",
      attendee: { name: "Ana Lopez" },
    });
    expect(state.pendingOverlay).toEqual({
      type: "success",
      title: "Verificado correctamente",
      subtitle: "Ana Lopez · vip · mesa: 4",
    });
    expect(syncLastValidationUI).toHaveBeenCalledWith(
      state.lastValidation,
      renderLastValidationCard,
    );
    expect(showValidationOverlay).toHaveBeenCalled();
  });

  it("stores failed validation state and triggers overlay", () => {
    const state = {
      lastValidation: { ok: true },
      pendingOverlay: null,
    };
    const showValidationOverlay = vi.fn();

    applyProductValidationError(state, "QR no valido", showValidationOverlay);

    expect(state.lastValidation).toBeNull();
    expect(state.pendingOverlay).toEqual({
      type: "error",
      title: "Error de verificacion",
      subtitle: "QR no valido",
    });
    expect(showValidationOverlay).toHaveBeenCalled();
  });
});
