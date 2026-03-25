export async function submitLogin(apiFetch, formData, extractAuthToken) {
  const response = await apiFetch("/api/v1/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(formData),
  });
  const token = extractAuthToken(response);

  if (!token) {
    throw new Error("La API no devolvio un token valido.");
  }

  return { token };
}

export function applyLoginSuccess(state, token, { persistToken, resetSessionState }) {
  state.loginError = null;
  resetSessionState();
  state.token = persistToken(token);
}

export function applyLoginError(state, errorMessage) {
  state.loginError = errorMessage;
}
