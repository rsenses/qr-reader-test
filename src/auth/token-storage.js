export const TOKEN_KEY = "qr-test-token";

export function getStoredToken() {
  return String(localStorage.getItem(TOKEN_KEY) || "").trim();
}

export function persistToken(token) {
  const normalizedToken = String(token || "").trim();

  if (normalizedToken) {
    localStorage.setItem(TOKEN_KEY, normalizedToken);
    return normalizedToken;
  }

  localStorage.removeItem(TOKEN_KEY);
  return "";
}
