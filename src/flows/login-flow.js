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
  state.loginEmail = "";
  resetSessionState(state);
  state.token = persistToken(token);
}

export function applyLoginError(state, errorMessage, email = "") {
  state.loginError = errorMessage;
  state.loginEmail = email;
}
