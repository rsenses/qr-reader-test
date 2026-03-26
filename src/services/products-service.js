import { buildProductFromRegistrations } from "../lib/registration-utils";
import { ensureCampaignsLoaded } from "./campaigns-service";

const CAMPAIGN_ALL_PRODUCT_PREFIX = "campaign-all-";

export function buildCampaignAggregateProduct(campaign, products = []) {
  return {
    id: `${CAMPAIGN_ALL_PRODUCT_PREFIX}${campaign.id}`,
    name: "TODOS",
    mode: "campaign",
    campaign_id: campaign.id,
    productIds: products.map((product) => Number(product.id)).filter(Boolean),
  };
}

export function isCampaignAggregateProductId(productId) {
  return String(productId || "").startsWith(CAMPAIGN_ALL_PRODUCT_PREFIX);
}

export function getCampaignIdFromAggregateProductId(productId) {
  return String(productId || "").replace(CAMPAIGN_ALL_PRODUCT_PREFIX, "");
}

export async function fetchCampaignProducts(apiFetch, campaignId) {
  const response = await apiFetch(
    `/api/v1/products?campaign_id=${encodeURIComponent(campaignId)}&mode=presencial`,
  );

  const products = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : [];

  if (products.length <= 1) {
    return products;
  }

  return [buildCampaignAggregateProduct({ id: campaignId }, products), ...products];

}

export function getBaseCampaignProducts(products = []) {
  return products.filter((product) => !isCampaignAggregateProductId(product.id));
}

export async function fetchCampaignRegistrations(apiFetch, campaignId) {
  const response = await apiFetch(
    `/api/v1/registrations/campaign/${encodeURIComponent(campaignId)}?mode=presencial`,
  );

  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.registrations)) return response.registrations;

  return [];
}

export async function resolveProductContext(
  { productId, products = [], campaign = null, campaigns = [] },
  apiFetch,
) {
  const normalizedProductId = String(productId);
  const availableProducts = Array.isArray(products) ? products : [];
  const availableCampaignsInput = Array.isArray(campaigns) ? campaigns : [];
  const localProduct = availableProducts.find(
    (product) => String(product.id) === normalizedProductId,
  );

  if (localProduct && campaign) {
    return {
      product: localProduct,
      campaign,
      productCampaign: campaign,
      products: availableProducts,
      campaigns: availableCampaignsInput,
    };
  }

  if (isCampaignAggregateProductId(normalizedProductId)) {
    const campaignId = getCampaignIdFromAggregateProductId(normalizedProductId);
    const availableCampaigns = await ensureCampaignsLoaded(
      availableCampaignsInput,
      apiFetch,
    );
    const aggregateCampaign = availableCampaigns.find(
      (currentCampaign) => String(currentCampaign.id) === String(campaignId),
    );

    if (!aggregateCampaign) {
      return {
        product: null,
        campaign,
        productCampaign: null,
        products: availableProducts,
        campaigns: availableCampaigns,
      };
    }

    const campaignProducts = await fetchCampaignProducts(apiFetch, aggregateCampaign.id);
    const aggregateProduct = campaignProducts.find(
      (product) => String(product.id) === normalizedProductId,
    );

    return {
      product: aggregateProduct || null,
      campaign: aggregateCampaign,
      productCampaign: aggregateCampaign,
      products: campaignProducts,
      campaigns: availableCampaigns,
    };
  }

  const availableCampaigns = await ensureCampaignsLoaded(
    availableCampaignsInput,
    apiFetch,
  );

  for (const currentCampaign of availableCampaigns) {
    const campaignProducts = await fetchCampaignProducts(apiFetch, currentCampaign.id);
    const matchedProduct = campaignProducts.find(
      (product) => String(product.id) === normalizedProductId,
    );

    if (matchedProduct) {
      return {
        product: matchedProduct,
        campaign: currentCampaign,
        productCampaign: currentCampaign,
        products: campaignProducts,
        campaigns: availableCampaigns,
      };
    }
  }

  return {
    product: null,
    campaign,
    productCampaign: null,
    products: availableProducts,
    campaigns: availableCampaigns,
  };
}

export async function fetchProductRegistrations(apiFetch, productId) {
  const response = await apiFetch(`/api/v1/registrations/${productId}`);

  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.registrations)) return response.registrations;

  return [];
}

export function refreshProductFromRegistrations(product, registrations) {
  return buildProductFromRegistrations(product.id, registrations, product);
}

export async function refreshProductData(apiFetch, product) {
  if (!product?.id) return null;

  const registrations = product.mode === "campaign"
    ? await fetchCampaignRegistrations(apiFetch, product.campaign_id)
    : await fetchProductRegistrations(apiFetch, product.id);
  return refreshProductFromRegistrations(product, registrations);
}
