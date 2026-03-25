import {
  buildProductRegistrationPayload,
  getRegisterPayload,
} from "../lib/domain-utils";

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
    throw new Error("No se pudo obtener el identificador de registro.");
  }

  return {
    user: userResponse,
    registration: registrationResponse,
    uniqueId,
  };
}
