export function formatMetadataKey(key) {
  const normalizedKey = String(key || "").replaceAll("_", " ").trim();
  if (!normalizedKey) return "";
  return normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
}

export function metadataText(metadata = []) {
  if (!metadata.length) return "Sin metadatos";
  return metadata.map((item) => `${formatMetadataKey(item.key)}: ${item.value}`).join(" · ");
}

export function normalizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return [];

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({ key, value: String(value) }));
}

export function normalizeRegistration(registration) {
  const metadata = normalizeMetadata(registration.metadata);
  const fullName = [
    registration.user?.name || registration.metadata?.name,
    registration.user?.last_name || registration.metadata?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: registration.id,
    qrCode: registration.unique_id,
    name: fullName || "Sin nombre",
    email: registration.user?.email || registration.metadata?.email || "",
    phone: registration.user?.phone || "",
    company: registration.user?.company || registration.metadata?.company || "",
    position:
      registration.user?.position || registration.metadata?.position || "",
    taxId: registration.user?.tax_id || registration.metadata?.tax_id || "",
    registrationType: registration.type || "",
    status: registration.status || "",
    metadata,
  };
}

export function buildProductFromRegistrations(
  productId,
  registrations,
  fallbackProduct,
) {
  const normalizedProductId = Number.isNaN(Number(productId))
    ? String(productId)
    : Number(productId);

  return {
    ...(fallbackProduct || {}),
    id: normalizedProductId,
    name:
      fallbackProduct?.name ||
      registrations[0]?.product?.name ||
      `Producto ${productId}`,
    attendees: registrations.map(normalizeRegistration),
  };
}

export function getRegisterPayload(formData) {
  return {
    advertising: formData.advertising ? 1 : 0,
    email: formData.email,
    last_name: formData.last_name,
    name: formData.name,
  };
}

export function buildProductRegistrationPayload(productIdOrIds, userId) {
  const products = Array.isArray(productIdOrIds)
    ? productIdOrIds.map((productId) => Number(productId))
    : [Number(productIdOrIds)];

  return {
    metadata: {
      origen: "in situ",
    },
    products,
    promo: "",
    user_id: userId,
  };
}
