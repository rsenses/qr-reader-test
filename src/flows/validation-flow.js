export function applyProductValidationSuccess(
  state,
  validation,
  { renderLastValidationCard, showValidationOverlay, syncLastValidationUI },
) {
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

  syncLastValidationUI(state.lastValidation, renderLastValidationCard);
  showValidationOverlay();
}

export function applyProductValidationError(state, errorMessage, showValidationOverlay) {
  state.lastValidation = null;
  state.pendingOverlay = {
    type: "error",
    title: "Error de verificacion",
    subtitle: errorMessage,
  };

  showValidationOverlay();
}
