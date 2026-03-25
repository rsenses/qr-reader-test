export async function ensureCampaignsLoaded(campaigns, apiFetch) {
  if (Array.isArray(campaigns) && campaigns.length) return campaigns;

  const response = await apiFetch("/api/v1/campaigns");
  return Array.isArray(response?.data) ? response.data : [];
}

export function findCampaignById(campaigns, campaignId) {
  if (!Array.isArray(campaigns)) return null;

  return (
    campaigns.find((campaign) => String(campaign.id) === String(campaignId)) ||
    null
  );
}
