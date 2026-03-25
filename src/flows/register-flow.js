export async function submitRegisterFlow(
  { apiFetch, formData, productId, productIds },
  { registerAttendeeForProduct, validateQr, refreshCurrentProduct },
) {
  if (!productId && !(Array.isArray(productIds) && productIds.length)) {
    throw new Error("No hay un producto seleccionado para registrar.");
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

export function applyRegisterSuccess(state, validation) {
  state.registerError = null;
  state.lastValidation = {
    ok: true,
    message: validation.title,
    attendee: validation.attendee,
  };
  state.pendingOverlay = {
    type: "success",
    title: validation.title,
    subtitle: validation.subtitle,
  };
}

export function applyRegisterError(state, errorMessage) {
  state.registerError = errorMessage;
}
