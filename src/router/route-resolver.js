import { buildProductFromRegistrations } from "../lib/domain-utils";
import {
  ensureCampaignsLoaded,
  findCampaignById,
} from "../services/campaigns-service";
import {
  fetchCampaignProducts,
  fetchCampaignRegistrations,
  fetchProductRegistrations,
  resolveProductContext,
} from "../services/products-service";
import { isProductContextRoute } from "./router";

const defaultDependencies = {
  ensureCampaignsLoaded,
  findCampaignById,
  fetchCampaignProducts,
  fetchCampaignRegistrations,
  fetchProductRegistrations,
  resolveProductContext,
};

async function resolveCampaignProductsRoute(route, currentState, apiFetch, dependencies) {
  const campaigns = await dependencies.ensureCampaignsLoaded(
    currentState.campaigns,
    apiFetch,
  );
  const products = await dependencies.fetchCampaignProducts(apiFetch, route.campaignId);

  return {
    campaigns,
    products,
    campaign: dependencies.findCampaignById(campaigns, route.campaignId),
  };
}

async function resolveProductRoute(route, currentState, apiFetch, dependencies) {
  const productContext = await dependencies.resolveProductContext(
    {
      productId: route.productId,
      products: currentState.products,
      campaign: currentState.campaign,
      campaigns: currentState.campaigns,
    },
    apiFetch,
  );

  const baseProduct = productContext.product
    ? buildProductFromRegistrations(route.productId, [], productContext.product)
    : null;
  const registrations =
    route.name === "register"
      ? []
      : productContext.product?.mode === "campaign"
        ? await dependencies.fetchCampaignRegistrations(
            apiFetch,
            productContext.product.campaign_id,
          )
        : await dependencies.fetchProductRegistrations(apiFetch, route.productId);

  return {
    campaigns: productContext.campaigns,
    campaign: productContext.campaign,
    productCampaign: productContext.productCampaign,
    products: productContext.products,
    product: buildProductFromRegistrations(
      route.productId,
      registrations,
      baseProduct || productContext.product,
    ),
  };
}

export async function resolveRouteData(
  route,
  currentState,
  apiFetch,
  dependencies = defaultDependencies,
) {
  if (route.name === "campaigns") {
    return {
      campaigns: await dependencies.ensureCampaignsLoaded(
        currentState.campaigns,
        apiFetch,
      ),
    };
  }

  if (route.name === "campaignProducts") {
    return resolveCampaignProductsRoute(route, currentState, apiFetch, dependencies);
  }

  if (isProductContextRoute(route)) {
    return resolveProductRoute(route, currentState, apiFetch, dependencies);
  }

  return {};
}
