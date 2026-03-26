import { describe, expect, it, vi } from "vitest";

import { submitRegisterFlow } from "./registration-service";

describe("registration-service submitRegisterFlow", () => {
  it("runs registration, validation and refresh in order", async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce({ id: 42 })
      .mockResolvedValueOnce({ registrations: [{ unique_id: "qr-1" }] });
    const validateQr = vi.fn().mockResolvedValue({
      title: "Verificado correctamente",
      subtitle: "Ana · VIP · mesa: 4",
      attendee: { name: "Ana" },
    });
    const refreshCurrentProduct = vi.fn().mockResolvedValue(undefined);

    await expect(
      submitRegisterFlow(
        {
          apiFetch,
          formData: { name: "Ana" },
          productId: 9,
        },
        { validateQr, refreshCurrentProduct },
      ),
    ).resolves.toEqual({
      validation: {
        title: "Verificado correctamente",
        subtitle: "Ana · VIP · mesa: 4",
        attendee: { name: "Ana" },
      },
    });

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/v1/register", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        advertising: 0,
        email: undefined,
        last_name: undefined,
        name: "Ana",
      }),
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/v1/trackit/registration", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        metadata: { origen: "in situ" },
        products: [9],
        promo: "",
        user_id: 42,
      }),
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
          validateQr: vi.fn(),
          refreshCurrentProduct: vi.fn(),
        },
      ),
    ).rejects.toThrow("No hay un producto seleccionado para registrar.");
  });

  it("accepts campaign-wide registration with multiple product ids", async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce({ id: 42 })
      .mockResolvedValueOnce({ registrations: [{ unique_id: "checkout-1" }] });
    const validateQr = vi.fn().mockResolvedValue({
      title: "Verificado correctamente",
      subtitle: "Ana · VIP · mesa: 4",
      attendee: { name: "Ana" },
    });
    const refreshCurrentProduct = vi.fn().mockResolvedValue(undefined);

    await submitRegisterFlow(
      {
        apiFetch,
        formData: { name: "Ana" },
        productId: "campaign-all-22",
        productIds: [3, 4],
      },
      { validateQr, refreshCurrentProduct },
    );

    expect(apiFetch).toHaveBeenNthCalledWith(2, "/api/v1/trackit/registration", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        metadata: { origen: "in situ" },
        products: [3, 4],
        promo: "",
        user_id: 42,
      }),
    });
    expect(validateQr).toHaveBeenCalledWith("checkout-1");
  });
});
