import { metadataText, normalizeRegistration } from "../lib/registration-utils";

export async function validateRegistrationCode(apiFetch, decodedText, context) {
  const verifyQuery = new URLSearchParams();

  if (context?.mode === "product" && context.productId) {
    verifyQuery.set("product_id", String(context.productId));
  }

  if (context?.mode === "campaign" && context.campaignId) {
    verifyQuery.set("campaign_id", String(context.campaignId));
  }

  const response = await apiFetch(
    `/api/v1/verify/${encodeURIComponent(decodedText)}${verifyQuery.size ? `?${verifyQuery.toString()}` : ""}`,
    {
      method: "POST",
    },
  );

  const attendee = normalizeRegistration(response.data);

  return {
    ok: true,
    title: "Verificado correctamente",
    subtitle: `${attendee.name} · ${attendee.registrationType} · ${metadataText(attendee.metadata)}`,
    attendee,
  };
}
