export function extractAuthToken(payload) {
  const candidates = [
    payload?.token,
    payload?.access_token,
    payload?.data?.token,
    payload?.data?.access_token,
  ];

  return candidates.find((value) => String(value || "").trim()) || "";
}

export function isAuthFailureStatus(status) {
  return status === 401 || status === 403;
}
