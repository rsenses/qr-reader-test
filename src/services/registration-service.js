import {
  buildProductRegistrationPayload,
  getRegisterPayload,
} from "../lib/registration-utils";

export async function registerUser(apiFetch, formData) {
  return apiFetch("/api/v1/register", {
    method: "POST",
    headers: {},
    body: JSON.stringify(getRegisterPayload(formData)),
  });
}

export async function createProductRegistration(apiFetch, productIds, userId) {
  return apiFetch("/api/v1/trackit/registration", {
    method: "POST",
    headers: {},
    body: JSON.stringify(buildProductRegistrationPayload(productIds, userId)),
  });
}

export function extractRegistrationUniqueId(registrationResponse) {
  return registrationResponse.registrations?.[0]?.unique_id || "";
}

export async function submitRegisterFlow(
  { apiFetch, formData, productId, productIds },
  { validateQr, refreshCurrentProduct },
) {
  if (!productId && !(Array.isArray(productIds) && productIds.length)) {
    throw new Error("No se ha podido preparar el alta para este producto.");
  }

  const { uniqueId } = await registerAttendeeForProduct(apiFetch, {
    formData,
    productId,
    productIds,
  });
  const validation = await validateQr(uniqueId);
  await refreshCurrentProduct();

  return { validation };
}

export async function registerAttendeeForProduct(
  apiFetch,
  { formData, productId, productIds },
) {
  const userResponse = await registerUser(apiFetch, formData);
  const registrationResponse = await createProductRegistration(
    apiFetch,
    productIds || productId,
    userResponse.id,
  );
  const uniqueId = extractRegistrationUniqueId(registrationResponse);

  if (!uniqueId) {
    throw new Error("No se ha podido completar el alta. Intentalo de nuevo.");
  }

  return {
    user: userResponse,
    registration: registrationResponse,
    uniqueId,
  };
}
