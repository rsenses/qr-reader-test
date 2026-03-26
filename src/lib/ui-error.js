const DEFAULT_UI_MESSAGE = "No se ha podido completar la operacion. Intentalo de nuevo.";

function getOperationType(path = "") {
  if (path === "/api/v1/login") return "login";
  if (path === "/api/v1/register" || path === "/api/v1/trackit/registration") {
    return "registration";
  }
  if (path.startsWith("/api/v1/verify/")) return "verification";
  return "default";
}

export function getApiErrorMessage({ path = "", status } = {}) {
  const operationType = getOperationType(path);

  if (operationType === "login") {
    if (status === 400 || status === 401 || status === 403) {
      return "No se ha podido iniciar sesion. Revisa tus credenciales e intentalo de nuevo.";
    }

    return "No se ha podido iniciar sesion. Intentalo de nuevo en unos minutos.";
  }

  if (operationType === "registration") {
    if (status === 400 || status === 404 || status === 409 || status === 422) {
      return "No se ha podido completar el alta. Revisa los datos e intentalo de nuevo.";
    }

    return "No se ha podido completar el alta. Intentalo de nuevo en unos minutos.";
  }

  if (operationType === "verification") {
    if (status === 400 || status === 404 || status === 409 || status === 422) {
      return "No se ha podido validar el QR. Comprueba el codigo e intentalo otra vez.";
    }

    return "No se ha podido validar el QR en este momento. Intentalo de nuevo.";
  }

  if (status === 401 || status === 403) {
    return "Tu sesion ya no es valida. Vuelve a iniciar sesion.";
  }

  if (status === 404) {
    return "No se ha encontrado la informacion solicitada.";
  }

  if (status === 429) {
    return "Hay demasiadas solicitudes. Espera un momento y vuelve a intentarlo.";
  }

  if (status >= 500) {
    return "Ha ocurrido un error en el servidor. Intentalo de nuevo en unos minutos.";
  }

  return DEFAULT_UI_MESSAGE;
}

export function createUiError(message, extras = {}) {
  const error = new Error(message || DEFAULT_UI_MESSAGE);
  Object.assign(error, extras);
  return error;
}

export function getDisplayErrorMessage(error, fallbackMessage = DEFAULT_UI_MESSAGE) {
  const message = error instanceof Error ? error.message : String(error || "");
  return String(message || fallbackMessage).trim() || fallbackMessage;
}
