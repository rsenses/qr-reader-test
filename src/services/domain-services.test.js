import { describe, expect, it, vi } from "vitest";

import { ensureCampaignsLoaded, findCampaignById } from "./campaigns-service";
import {
  buildCampaignAggregateProduct,
  fetchCampaignRegistrations,
  fetchCampaignProducts,
  fetchProductRegistrations,
  refreshProductData,
  refreshProductFromRegistrations,
  resolveProductContext,
} from "./products-service";

describe("campaigns-service", () => {
  it("reuses campaigns already loaded", async () => {
    const apiFetch = vi.fn();
    const campaigns = [{ id: 1, name: "Loaded" }];

    await expect(ensureCampaignsLoaded(campaigns, apiFetch)).resolves.toEqual(
      campaigns,
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("loads campaigns when missing", async () => {
    const campaigns = [{ id: 2, name: "Remote" }];
    const apiFetch = vi.fn().mockResolvedValue({ data: campaigns });

    await expect(ensureCampaignsLoaded([], apiFetch)).resolves.toEqual(campaigns);
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/campaigns");
  });

  it("guards against non-array campaign payloads", async () => {
    const apiFetch = vi.fn().mockResolvedValue({ data: null });

    await expect(ensureCampaignsLoaded([], apiFetch)).resolves.toEqual([]);
  });

  it("finds a campaign by id", () => {
    expect(findCampaignById([{ id: 1 }, { id: 2 }], "2")).toEqual({ id: 2 });
    expect(findCampaignById([{ id: 1 }], 3)).toBeNull();
  });
});

describe("products-service", () => {
  it("fetches campaign products with the expected endpoint", async () => {
    const products = [{ id: 4 }];
    const apiFetch = vi.fn().mockResolvedValue(products);

    await expect(fetchCampaignProducts(apiFetch, 9)).resolves.toEqual([
      buildCampaignAggregateProduct({ id: 9 }, products),
      ...products,
    ]);
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/products?campaign_id=9&mode=presencial",
    );
  });

  it("accepts products wrapped under data", async () => {
    const products = [{ id: 4 }];
    const apiFetch = vi.fn().mockResolvedValue({ data: products });

    await expect(fetchCampaignProducts(apiFetch, 9)).resolves.toEqual([
      buildCampaignAggregateProduct({ id: 9 }, products),
      ...products,
    ]);
  });

  it("reuses local product context when product and campaign are already loaded", async () => {
    const apiFetch = vi.fn();
    const context = {
      productId: "7",
      products: [{ id: 7, name: "Producto" }],
      campaign: { id: 3, name: "Campana" },
      campaigns: [{ id: 3, name: "Campana" }],
    };

    await expect(resolveProductContext(context, apiFetch)).resolves.toEqual({
      product: { id: 7, name: "Producto" },
      campaign: { id: 3, name: "Campana" },
      productCampaign: { id: 3, name: "Campana" },
      products: [{ id: 7, name: "Producto" }],
      campaigns: [{ id: 3, name: "Campana" }],
    });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("resolves the synthetic TODOS product for a campaign", async () => {
    const campaign = { id: 3, name: "Campana" };
    const products = [buildCampaignAggregateProduct(campaign, [{ id: 7 }]), { id: 7 }];
    const apiFetch = vi.fn();

    await expect(
      resolveProductContext(
        {
          productId: "campaign-all-3",
          products,
          campaign,
          campaigns: [campaign],
        },
        apiFetch,
      ),
    ).resolves.toEqual({
      product: products[0],
      campaign,
      productCampaign: campaign,
      products,
      campaigns: [campaign],
    });
  });

  it("searches campaigns remotely until it finds the product", async () => {
    const apiFetch = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }] })
      .mockResolvedValueOnce([{ id: 10, name: "Uno" }])
      .mockResolvedValueOnce([{ id: 20, name: "Dos" }, { id: 21, name: "Objetivo" }]);

    await expect(
      resolveProductContext({ productId: 21, products: [], campaign: null, campaigns: [] }, apiFetch),
    ).resolves.toEqual({
      product: { id: 21, name: "Objetivo" },
      campaign: { id: 2 },
      productCampaign: { id: 2 },
      products: [
        buildCampaignAggregateProduct({ id: 2 }, [{ id: 20, name: "Dos" }, { id: 21, name: "Objetivo" }]),
        { id: 20, name: "Dos" },
        { id: 21, name: "Objetivo" },
      ],
      campaigns: [{ id: 1 }, { id: 2 }],
    });
  });

  it("loads campaign registrations for aggregate product mode", async () => {
    const registrations = [{ id: 1, unique_id: "checkout-1", metadata: {} }];
    const apiFetch = vi.fn().mockResolvedValue({ data: registrations });

    await expect(fetchCampaignRegistrations(apiFetch, 22)).resolves.toEqual(
      registrations,
    );
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/registrations/campaign/22?mode=presencial",
    );
  });

  it("loads registrations and rebuilds the current product", async () => {
    const apiFetch = vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          unique_id: "qr-1",
          type: "vip",
          status: "verified",
          user: { name: "Ana", last_name: "Lopez" },
          metadata: {},
        },
      ],
    });

    await expect(fetchProductRegistrations(apiFetch, 42)).resolves.toEqual([
      {
        id: 1,
        unique_id: "qr-1",
        type: "vip",
        status: "verified",
        user: { name: "Ana", last_name: "Lopez" },
        metadata: {},
      },
    ]);

    expect(
      refreshProductFromRegistrations(
        { id: 42, name: "Producto base" },
        [
          {
            id: 1,
            unique_id: "qr-1",
            type: "vip",
            status: "verified",
            user: { name: "Ana", last_name: "Lopez" },
            metadata: {},
          },
        ],
      ),
    ).toEqual({
      id: 42,
      name: "Producto base",
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

    await expect(
      refreshProductData(apiFetch, { id: 42, name: "Producto base" }),
    ).resolves.toEqual({
      id: 42,
      name: "Producto base",
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

  it("refreshes aggregate campaign products with campaign registrations", async () => {
    const apiFetch = vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          unique_id: "checkout-1",
          type: "vip",
          status: "verified",
          user: { name: "Ana", last_name: "Lopez" },
          metadata: {},
        },
      ],
    });

    await expect(
      refreshProductData(apiFetch, {
        id: "campaign-all-22",
        name: "TODOS",
        mode: "campaign",
        campaign_id: 22,
      }),
    ).resolves.toEqual({
      id: "campaign-all-22",
      name: "TODOS",
      mode: "campaign",
      campaign_id: 22,
      attendees: [
        {
          id: 1,
          qrCode: "checkout-1",
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

  it("guards registration payloads that are not arrays", async () => {
    const apiFetch = vi.fn().mockResolvedValue({ data: null });

    await expect(fetchProductRegistrations(apiFetch, 42)).resolves.toEqual([]);
  });

  it("accepts registrations returned as a direct array", async () => {
    const registrations = [{ id: 1, unique_id: "qr-1", metadata: {} }];
    const apiFetch = vi.fn().mockResolvedValue(registrations);

    await expect(fetchProductRegistrations(apiFetch, 42)).resolves.toEqual(
      registrations,
    );
  });

  it("accepts registrations wrapped under registrations", async () => {
    const registrations = [{ id: 1, unique_id: "qr-1", metadata: {} }];
    const apiFetch = vi.fn().mockResolvedValue({ registrations });

    await expect(fetchProductRegistrations(apiFetch, 42)).resolves.toEqual(
      registrations,
    );
  });

});
