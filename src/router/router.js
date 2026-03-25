export const SUPPORTED_ROUTES = [
  {
    name: "login",
    match: (hash) => (hash === "/login" ? { name: "login" } : null),
  },
  {
    name: "campaigns",
    match: (hash) => (hash === "/campaigns" ? { name: "campaigns" } : null),
  },
  {
    name: "register",
    match: (hash) => {
      const match = hash.match(/^\/register\/([^/]+)$/);
      return match ? { name: "register", productId: match[1] } : null;
    },
  },
  {
    name: "campaignProducts",
    match: (hash) => {
      const match = hash.match(/^\/campaigns\/([^/]+)$/);
      return match ? { name: "campaignProducts", campaignId: match[1] } : null;
    },
  },
  {
    name: "product",
    match: (hash) => {
      const match = hash.match(/^\/products\/([^/]+)$/);
      return match ? { name: "product", productId: match[1] } : null;
    },
  },
  {
    name: "productSearch",
    match: (hash) => {
      const match = hash.match(/^\/products\/([^/]+)\/search$/);
      return match ? { name: "productSearch", productId: match[1] } : null;
    },
  },
  {
    name: "productStats",
    match: (hash) => {
      const match = hash.match(/^\/products\/([^/]+)\/stats$/);
      return match ? { name: "productStats", productId: match[1] } : null;
    },
  },
];

export const PRODUCT_CONTEXT_ROUTE_NAMES = new Set([
  "product",
  "productSearch",
  "productStats",
  "register",
]);

export function normalizeHash(hash) {
  return String(hash || "").replace(/^#/, "") || "/login";
}

export function getDefaultRoute({ hasToken = false } = {}) {
  return { name: hasToken ? "campaigns" : "login" };
}

export function getRoute(hash, options = {}) {
  const normalizedHash = normalizeHash(hash);

  for (const routeDefinition of SUPPORTED_ROUTES) {
    const route = routeDefinition.match(normalizedHash);
    if (route) return route;
  }

  return getDefaultRoute(options);
}

export function isProductContextRoute(route) {
  return PRODUCT_CONTEXT_ROUTE_NAMES.has(route?.name);
}

export function isScannerRoute(route) {
  return route?.name === "product";
}
