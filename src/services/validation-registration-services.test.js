import { describe, expect, it, vi } from "vitest";

import {
  createProductRegistration,
  extractRegistrationUniqueId,
  registerAttendeeForProduct,
  registerUser,
} from "./registration-service";
import { validateRegistrationCode } from "./validation-service";

describe("validation-service", () => {
  it("validates a qr code and returns normalized domain data", async () => {
    const apiFetch = vi.fn().mockResolvedValue({
      data: {
        id: 1,
        unique_id: "qr-1",
        type: "vip",
        status: "verified",
        user: { name: "Ana", last_name: "Lopez" },
        metadata: { table: 4 },
      },
    });

    await expect(
      validateRegistrationCode(apiFetch, "qr-1", {
        mode: "product",
        productId: 9,
      }),
    ).resolves.toEqual({
      ok: true,
      title: "Verificado correctamente",
      subtitle: "Ana Lopez · vip · table: 4",
      attendee: {
        id: 1,
        qrCode: "qr-1",
        name: "Ana Lopez",
        email: "",
        phone: "",
        company: "",
        position: "",
        taxId: "",
        registrationType: "vip",
        status: "verified",
        metadata: [{ key: "table", value: "4" }],
      },
    });

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/verify/qr-1?product_id=9", {
      method: "POST",
    });
  });

  it("supports campaign mode verification", async () => {
    const apiFetch = vi.fn().mockResolvedValue({
      data: {
        id: 2,
        unique_id: "checkout-1",
        type: "multi",
        status: "verified",
        user: { name: "Luis", last_name: "Perez" },
        metadata: {},
      },
    });

    await validateRegistrationCode(apiFetch, "checkout-1", {
      mode: "campaign",
      campaignId: 22,
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/verify/checkout-1?campaign_id=22",
      { method: "POST" },
    );
  });
});

describe("registration-service", () => {
  it("creates the user with the current payload shape", async () => {
    const apiFetch = vi.fn().mockResolvedValue({ id: 4 });

    await registerUser(apiFetch, {
      advertising: "1",
      email: "ana@example.com",
      last_name: "Lopez",
      name: "Ana",
    });

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/register", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        advertising: 1,
        email: "ana@example.com",
        last_name: "Lopez",
        name: "Ana",
      }),
    });
  });

  it("creates the product registration with the current payload shape", async () => {
    const apiFetch = vi.fn().mockResolvedValue({ registrations: [] });

    await createProductRegistration(apiFetch, "7", 12);

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/trackit/registration", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        metadata: { origen: "in situ" },
        products: [7],
        promo: "",
        user_id: 12,
      }),
    });
  });

  it("creates the product registration for multiple campaign products", async () => {
    const apiFetch = vi.fn().mockResolvedValue({ registrations: [] });

    await createProductRegistration(apiFetch, ["7", 8], 12);

    expect(apiFetch).toHaveBeenCalledWith("/api/v1/trackit/registration", {
      method: "POST",
      headers: {},
      body: JSON.stringify({
        metadata: { origen: "in situ" },
        products: [7, 8],
        promo: "",
        user_id: 12,
      }),
    });
  });

  it("extracts the unique id from registration responses", () => {
    expect(
      extractRegistrationUniqueId({
        registrations: [{ unique_id: "qr-99" }],
      }),
    ).toBe("qr-99");
    expect(extractRegistrationUniqueId({ registrations: [] })).toBe("");
  });

  it("runs the registration flow and returns the generated unique id", async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce({ id: 5 })
      .mockResolvedValueOnce({ registrations: [{ unique_id: "qr-5" }] });

    await expect(
      registerAttendeeForProduct(apiFetch, {
        formData: { advertising: "1", name: "Ana" },
        productId: 3,
      }),
    ).resolves.toEqual({
      user: { id: 5 },
      registration: { registrations: [{ unique_id: "qr-5" }] },
      uniqueId: "qr-5",
    });
  });

  it("runs the registration flow for multiple products", async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce({ id: 5 })
      .mockResolvedValueOnce({ registrations: [{ unique_id: "checkout-5" }] });

    await expect(
      registerAttendeeForProduct(apiFetch, {
        formData: { advertising: "1", name: "Ana" },
        productIds: [3, 4],
      }),
    ).resolves.toEqual({
      user: { id: 5 },
      registration: { registrations: [{ unique_id: "checkout-5" }] },
      uniqueId: "checkout-5",
    });
  });

  it("fails when registration response has no unique id", async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce({ id: 5 })
      .mockResolvedValueOnce({ registrations: [] });

    await expect(
      registerAttendeeForProduct(apiFetch, {
        formData: { advertising: "1", name: "Ana" },
        productId: 3,
      }),
    ).rejects.toThrow("No se ha podido completar el alta. Intentalo de nuevo.");
  });
});
