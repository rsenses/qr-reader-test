import { describe, expect, it } from "vitest";

import {
  buildProductFromRegistrations,
  buildProductRegistrationPayload,
  escapeAttribute,
  escapeHtml,
  getProductStats,
  getRegisterPayload,
  metadataText,
  normalizeMetadata,
  normalizeRegistration,
  normalizeSearch,
} from "./domain-utils";

describe("normalizeSearch", () => {
  it("normalizes case, whitespace, accents and enye", () => {
    expect(normalizeSearch("  ÁRBoL Ñandú ")).toBe("arbol nandu");
  });

  it("returns empty string for nullish values", () => {
    expect(normalizeSearch(null)).toBe("");
    expect(normalizeSearch(undefined)).toBe("");
  });
});

describe("normalizeMetadata", () => {
  it("maps object entries into key value pairs as strings", () => {
    expect(normalizeMetadata({ seats: 3, vip: true })).toEqual([
      { key: "seats", value: "3" },
      { key: "vip", value: "true" },
    ]);
  });

  it("filters nullish and empty string values", () => {
    expect(
      normalizeMetadata({
        ok: "yes",
        empty: "",
        nothing: null,
        missing: undefined,
      }),
    ).toEqual([{ key: "ok", value: "yes" }]);
  });

  it("returns empty array for invalid inputs", () => {
    expect(normalizeMetadata(null)).toEqual([]);
    expect(normalizeMetadata("text")).toEqual([]);
  });
});

describe("metadataText", () => {
  it("returns fallback text for empty metadata", () => {
    expect(metadataText()).toBe("Sin metadatos");
    expect(metadataText([])).toBe("Sin metadatos");
  });

  it("joins metadata entries in display format", () => {
    expect(
      metadataText([
        { key: "company", value: "Acme" },
        { key: "city", value: "Madrid" },
      ]),
    ).toBe("company: Acme · city: Madrid");
  });
});

describe("normalizeRegistration", () => {
  it("prioritizes user fields and normalizes metadata", () => {
    expect(
      normalizeRegistration({
        id: 10,
        unique_id: "qr-1",
        type: "vip",
        status: "paid",
        user: {
          name: "Ana",
          last_name: "Lopez",
          email: "ana@example.com",
          phone: "123",
          company: "Acme",
          position: "CEO",
          tax_id: "12345678A",
        },
        metadata: {
          company: "Fallback Corp",
          note: "Mesa 4",
          empty: "",
        },
      }),
    ).toEqual({
      id: 10,
      qrCode: "qr-1",
      name: "Ana Lopez",
      email: "ana@example.com",
      phone: "123",
      company: "Acme",
      position: "CEO",
      taxId: "12345678A",
      registrationType: "vip",
      status: "paid",
      metadata: [
        { key: "company", value: "Fallback Corp" },
        { key: "note", value: "Mesa 4" },
      ],
    });
  });

  it("falls back to metadata and defaults when user fields are absent", () => {
    expect(
      normalizeRegistration({
        id: 11,
        unique_id: "qr-2",
        metadata: {
          name: "Luis",
          last_name: "Perez",
          email: "luis@example.com",
          company: "Globex",
          position: "CTO",
          tax_id: "B12345678",
        },
      }),
    ).toEqual({
      id: 11,
      qrCode: "qr-2",
      name: "Luis Perez",
      email: "luis@example.com",
      phone: "",
      company: "Globex",
      position: "CTO",
      taxId: "B12345678",
      registrationType: "",
      status: "",
      metadata: [
        { key: "name", value: "Luis" },
        { key: "last_name", value: "Perez" },
        { key: "email", value: "luis@example.com" },
        { key: "company", value: "Globex" },
        { key: "position", value: "CTO" },
        { key: "tax_id", value: "B12345678" },
      ],
    });
  });

  it("uses Sin nombre when no name is available", () => {
    expect(
      normalizeRegistration({
        id: 12,
        unique_id: "qr-3",
        metadata: {},
      }).name,
    ).toBe("Sin nombre");
  });
});

describe("buildProductFromRegistrations", () => {
  it("uses fallback product data and normalizes attendees", () => {
    const product = buildProductFromRegistrations(
      "42",
      [
        {
          id: 1,
          unique_id: "qr-1",
          type: "vip",
          status: "verified",
          user: { name: "Ana", last_name: "Lopez" },
          metadata: {},
          product: { name: "Nombre API" },
        },
      ],
      { name: "Fallback product", extra: true },
    );

    expect(product).toEqual({
      name: "Fallback product",
      extra: true,
      id: 42,
      attendees: [
        {
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
          metadata: [],
        },
      ],
    });
  });

  it("falls back to registration product name and generated name", () => {
    expect(
      buildProductFromRegistrations(
        50,
        [{ id: 1, unique_id: "qr", metadata: {}, product: { name: "Desde API" } }],
        null,
      ).name,
    ).toBe("Desde API");

    expect(buildProductFromRegistrations(51, [], null).name).toBe("Producto 51");
  });

  it("preserves non-numeric synthetic product ids", () => {
    expect(
      buildProductFromRegistrations("campaign-all-9", [], { name: "TODOS" }).id,
    ).toBe("campaign-all-9");
  });
});

describe("getProductStats", () => {
  it("aggregates paid and verified attendees by registration type", () => {
    expect(
      getProductStats([
        { registrationType: "VIP", status: "paid" },
        { registrationType: "VIP", status: "verified" },
        { registrationType: "Asistente", status: "verified" },
        { registrationType: "Asistente", status: "pending" },
        { registrationType: "", status: "paid" },
      ]),
    ).toEqual({
      totalPaidOrVerified: 4,
      totalVerified: 2,
      byType: [
        { label: "Asistente", total: 1, verified: 1, percentage: 100 },
        { label: "sin tipo", total: 1, verified: 0, percentage: 0 },
        { label: "VIP", total: 2, verified: 1, percentage: 50 },
      ],
    });
  });
});

describe("getRegisterPayload", () => {
  it("maps register form data to API payload", () => {
    expect(
      getRegisterPayload({
        advertising: "1",
        email: "ana@example.com",
        last_name: "Lopez",
        name: "Ana",
      }),
    ).toEqual({
      advertising: 1,
      email: "ana@example.com",
      last_name: "Lopez",
      name: "Ana",
    });
  });

  it("maps falsy advertising to 0", () => {
    expect(getRegisterPayload({ advertising: "", name: "Ana" }).advertising).toBe(0);
  });
});

describe("buildProductRegistrationPayload", () => {
  it("builds the registration payload from product and user ids", () => {
    expect(buildProductRegistrationPayload("9", 17)).toEqual({
      metadata: { origen: "in situ" },
      products: [9],
      promo: "",
      user_id: 17,
    });
  });

  it("builds the registration payload for multiple products", () => {
    expect(buildProductRegistrationPayload(["9", 10], 17)).toEqual({
      metadata: { origen: "in situ" },
      products: [9, 10],
      promo: "",
      user_id: 17,
    });
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("returns empty string for nullish values", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("escapeAttribute", () => {
  it("reuses HTML escaping for attributes", () => {
    expect(escapeAttribute(`hola" onclick='x'`)).toBe(
      "hola&quot; onclick=&#39;x&#39;",
    );
  });
});
