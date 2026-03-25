import { describe, expect, it, vi } from "vitest";

import { resolveRouteData } from "./route-resolver";

describe("route-resolver", () => {
  it("loads campaigns for the campaigns route", async () => {
    const campaigns = [{ id: 1, name: "Campana" }];
    const dependencies = {
      ensureCampaignsLoaded: vi.fn().mockResolvedValue(campaigns),
    };

    await expect(
      resolveRouteData(
        { name: "campaigns" },
        { campaigns: [] },
        vi.fn(),
        dependencies,
      ),
    ).resolves.toEqual({ campaigns });
  });

  it("loads campaign products and resolves the selected campaign", async () => {
    const campaigns = [{ id: 22, name: "Expo" }];
    const products = [{ id: 4, name: "Entrada" }];
    const dependencies = {
      ensureCampaignsLoaded: vi.fn().mockResolvedValue(campaigns),
      fetchCampaignProducts: vi.fn().mockResolvedValue(products),
      findCampaignById: vi.fn().mockReturnValue(campaigns[0]),
    };

    await expect(
      resolveRouteData(
        { name: "campaignProducts", campaignId: "22" },
        { campaigns: [], products: [] },
        vi.fn(),
        dependencies,
      ),
    ).resolves.toEqual({
      campaigns,
      products,
      campaign: campaigns[0],
    });
  });

  it("reuses product context and registrations for product routes", async () => {
    const productContext = {
      campaigns: [{ id: 3, name: "Campana" }],
      campaign: { id: 3, name: "Campana" },
      productCampaign: { id: 3, name: "Campana" },
      products: [{ id: 7, name: "Entrada" }],
      product: { id: 7, name: "Entrada" },
    };
    const registrations = [
      {
        id: 1,
        unique_id: "qr-1",
        type: "vip",
        status: "verified",
        user: { name: "Ana", last_name: "Lopez" },
        metadata: {},
      },
    ];
    const dependencies = {
      resolveProductContext: vi.fn().mockResolvedValue(productContext),
      fetchProductRegistrations: vi.fn().mockResolvedValue(registrations),
      fetchCampaignRegistrations: vi.fn(),
    };

    await expect(
      resolveRouteData(
        { name: "product", productId: "7" },
        { campaigns: [], campaign: null, products: [] },
        vi.fn(),
        dependencies,
      ),
    ).resolves.toEqual({
      campaigns: productContext.campaigns,
      campaign: productContext.campaign,
      productCampaign: productContext.productCampaign,
      products: productContext.products,
      product: {
        id: 7,
        name: "Entrada",
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
      },
    });
    expect(dependencies.fetchProductRegistrations).toHaveBeenCalledWith(expect.any(Function), "7");
    expect(dependencies.fetchCampaignRegistrations).not.toHaveBeenCalled();
  });

  it("uses campaign registrations for aggregate campaign products", async () => {
    const productContext = {
      campaigns: [{ id: 22, name: "Expo" }],
      campaign: { id: 22, name: "Expo" },
      productCampaign: { id: 22, name: "Expo" },
      products: [{ id: "campaign-all-22", name: "TODOS", mode: "campaign", campaign_id: 22 }],
      product: { id: "campaign-all-22", name: "TODOS", mode: "campaign", campaign_id: 22 },
    };
    const registrations = [
      {
        id: 1,
        unique_id: "checkout-1",
        type: "vip",
        status: "paid",
        user: { name: "Ana", last_name: "Lopez" },
        metadata: {},
      },
    ];
    const dependencies = {
      resolveProductContext: vi.fn().mockResolvedValue(productContext),
      fetchProductRegistrations: vi.fn(),
      fetchCampaignRegistrations: vi.fn().mockResolvedValue(registrations),
    };

    const result = await resolveRouteData(
      { name: "product", productId: "campaign-all-22" },
      { campaigns: [], campaign: null, products: [] },
      vi.fn(),
      dependencies,
    );

    expect(result.product).toEqual({
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
          status: "paid",
          metadata: [],
        },
      ],
    });
    expect(dependencies.fetchCampaignRegistrations).toHaveBeenCalledWith(
      expect.any(Function),
      22,
    );
    expect(dependencies.fetchProductRegistrations).not.toHaveBeenCalled();
  });

  it("skips registration loading for register routes", async () => {
    const productContext = {
      campaigns: [],
      campaign: { id: 3, name: "Campana" },
      productCampaign: { id: 3, name: "Campana" },
      products: [{ id: 7, name: "Entrada" }],
      product: { id: 7, name: "Entrada" },
    };
    const dependencies = {
      resolveProductContext: vi.fn().mockResolvedValue(productContext),
      fetchProductRegistrations: vi.fn(),
      fetchCampaignRegistrations: vi.fn(),
    };

    const result = await resolveRouteData(
      { name: "register", productId: "7" },
      { campaigns: [], campaign: null, products: [] },
      vi.fn(),
      dependencies,
    );

    expect(result.product).toEqual({
      id: 7,
      name: "Entrada",
      attendees: [],
    });
    expect(dependencies.fetchProductRegistrations).not.toHaveBeenCalled();
    expect(dependencies.fetchCampaignRegistrations).not.toHaveBeenCalled();
  });
});
