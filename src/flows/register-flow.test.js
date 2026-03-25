import { describe, expect, it, vi } from "vitest";

import {
  applyRegisterError,
  applyRegisterSuccess,
  submitRegisterFlow,
} from "./register-flow";

describe("register-flow", () => {
  it("runs registration, validation and refresh in order", async () => {
    const registerAttendeeForProduct = vi.fn().mockResolvedValue({ uniqueId: "qr-1" });
    const validateQr = vi.fn().mockResolvedValue({
      title: "Verificado correctamente",
      subtitle: "Ana · VIP · mesa: 4",
      attendee: { name: "Ana" },
    });
    const refreshCurrentProduct = vi.fn().mockResolvedValue(undefined);

    await expect(
      submitRegisterFlow(
        {
          apiFetch: vi.fn(),
          formData: { name: "Ana" },
          productId: 9,
        },
        { registerAttendeeForProduct, validateQr, refreshCurrentProduct },
      ),
    ).resolves.toEqual({
      validation: {
        title: "Verificado correctamente",
        subtitle: "Ana · VIP · mesa: 4",
        attendee: { name: "Ana" },
      },
    });

    expect(registerAttendeeForProduct).toHaveBeenCalledWith(expect.any(Function), {
      formData: { name: "Ana" },
      productId: 9,
    });
    expect(validateQr).toHaveBeenCalledWith("qr-1");
    expect(refreshCurrentProduct).toHaveBeenCalled();
  });

  it("fails when no product is selected", async () => {
    await expect(
      submitRegisterFlow(
        {
          apiFetch: vi.fn(),
          formData: {},
          productId: null,
        },
        {
          registerAttendeeForProduct: vi.fn(),
          validateQr: vi.fn(),
          refreshCurrentProduct: vi.fn(),
        },
      ),
    ).rejects.toThrow("No hay un producto seleccionado para registrar.");
  });

  it("accepts campaign-wide registration with multiple product ids", async () => {
    const registerAttendeeForProduct = vi.fn().mockResolvedValue({ uniqueId: "checkout-1" });
    const validateQr = vi.fn().mockResolvedValue({
      title: "Verificado correctamente",
      subtitle: "Ana · VIP · mesa: 4",
      attendee: { name: "Ana" },
    });
    const refreshCurrentProduct = vi.fn().mockResolvedValue(undefined);

    await submitRegisterFlow(
      {
        apiFetch: vi.fn(),
        formData: { name: "Ana" },
        productId: "campaign-all-22",
        productIds: [3, 4],
      },
      { registerAttendeeForProduct, validateQr, refreshCurrentProduct },
    );

    expect(registerAttendeeForProduct).toHaveBeenCalledWith(expect.any(Function), {
      formData: { name: "Ana" },
      productId: "campaign-all-22",
      productIds: [3, 4],
    });
    expect(validateQr).toHaveBeenCalledWith("checkout-1");
  });

  it("applies register success and error state", () => {
    const state = {
      registerError: "old",
      lastValidation: null,
      pendingOverlay: null,
    };

    applyRegisterSuccess(state, {
      title: "Verificado correctamente",
      subtitle: "Ana · VIP · mesa: 4",
      attendee: { name: "Ana" },
    });

    expect(state.registerError).toBeNull();
    expect(state.lastValidation).toEqual({
      ok: true,
      message: "Verificado correctamente",
      attendee: { name: "Ana" },
    });
    expect(state.pendingOverlay).toEqual({
      type: "success",
      title: "Verificado correctamente",
      subtitle: "Ana · VIP · mesa: 4",
    });

    applyRegisterError(state, "Error de API");
    expect(state.registerError).toBe("Error de API");
  });
});
