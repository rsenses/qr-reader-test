export function requiresAuth(route) {
  return route?.name !== "login";
}

export function isGuestOnlyRoute(route) {
  return route?.name === "login";
}

export function getRouteRedirect(route, { hasToken = false } = {}) {
  if (!hasToken && requiresAuth(route)) {
    return { name: "login", hash: "#/login" };
  }

  if (hasToken && isGuestOnlyRoute(route)) {
    return { name: "campaigns", hash: "#/campaigns" };
  }

  return null;
}
