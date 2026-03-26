export function createApiClient({
  baseUrl,
  getToken,
  isAuthFailureStatus,
  onAuthFailure,
}) {
  async function parseResponseBody(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    const normalizedText = text.charCodeAt(0) === 0 ? text.slice(1) : text;

    if (
      contentType.includes("text/html") ||
      /^\s*<!doctype html>/i.test(normalizedText) ||
      /^\s*<html[\s>]/i.test(normalizedText)
    ) {
      return {
        message:
          response.status === 403
            ? "Acceso prohibido"
            : "El servidor devolvio una respuesta HTML inesperada.",
      };
    }

    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return { message: text };
    }
  }

  function buildSiteStorageUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;

    const origin = new URL(baseUrl).origin;
    return `${origin}/storage/${String(path).replace(/^\//, "")}`;
  }

  async function apiFetch(path, options = {}) {
    const { skipAuth = false, ...requestOptions } = options;
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    const token = getToken?.();
    if (!skipAuth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const normalizedPath = String(path || "").replace(/^\/api\/v1/, "");

    const response = await fetch(`${baseUrl}${normalizedPath}`, {
      ...requestOptions,
      headers,
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      if (!skipAuth && isAuthFailureStatus?.(response.status)) {
        await onAuthFailure?.();
      }

      const error = new Error(data.message || "Error inesperado");
      error.data = data;
      error.status = response.status;
      throw error;
    }

    return data;
  }

  return {
    apiFetch,
    buildSiteStorageUrl,
  };
}
