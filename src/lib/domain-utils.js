export function metadataText(metadata = []) {
  if (!metadata.length) return "Sin metadatos";
  return metadata.map((item) => `${item.key}: ${item.value}`).join(" · ");
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

export function getProductStats(attendees) {
  const relevant = attendees.filter(
    (attendee) => attendee.status === "paid" || attendee.status === "verified",
  );
  const grouped = new Map();

  for (const attendee of relevant) {
    const key = attendee.registrationType || "sin tipo";
    const current = grouped.get(key) || { label: key, total: 0, verified: 0 };
    current.total += 1;
    if (attendee.status === "verified") {
      current.verified += 1;
    }
    grouped.set(key, current);
  }

  const byType = [...grouped.values()]
    .sort((a, b) => a.label.localeCompare(b.label, "es"))
    .map((entry) => ({
      ...entry,
      percentage: entry.total
        ? Math.round((entry.verified / entry.total) * 100)
        : 0,
    }));

  return {
    totalPaidOrVerified: relevant.length,
    totalVerified: relevant.filter((attendee) => attendee.status === "verified")
      .length,
    byType,
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

export function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ñ", "n");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeAttribute(value) {
  return escapeHtml(value);
}
