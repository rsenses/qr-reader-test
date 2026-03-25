export function renderUpdateBanner(updateAvailable) {
  if (!updateAvailable) return "";

  return `
    <section class="app-update-banner mb-4 flex items-center justify-between gap-3 rounded-[24px] border border-[color:var(--accent-soft)] bg-[color:var(--accent-faint)] px-4 py-3 shadow-sm">
      <div>
        <p class="text-sm font-semibold text-[color:var(--accent-strong)]">Nueva version disponible</p>
        <p class="mt-1 text-xs text-[color:var(--accent-strong)]/80">Actualiza la app para cargar los ultimos cambios.</p>
      </div>
      <button type="button" data-action="update-app" class="shrink-0 rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white">Actualizar</button>
    </section>
  `;
}

export function renderAppNav(route, product, renderIcon) {
  const isProductArea =
    route.name === "product" ||
    route.name === "productSearch" ||
    route.name === "productStats" ||
    route.name === "register";

  if (!isProductArea || !product) return "";

  const items = [
    {
      href: `#/products/${product.id}`,
      key: "product",
      label: "Escanear",
      icon: renderIcon("scan"),
      primary: true,
    },
    {
      href: `#/products/${product.id}/search`,
      key: "productSearch",
      label: "Buscar",
      icon: renderIcon("search"),
      primary: true,
    },
    {
      href: `#/products/${product.id}/stats`,
      key: "productStats",
      label: "Stats",
      icon: renderIcon("stats"),
    },
    {
      href: `#/register/${product.id}`,
      key: "register",
      label: "Alta",
      icon: renderIcon("plus"),
    },
  ];

  return `
    <nav class="app-bottom-nav-wrap fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6" aria-label="Navegacion del producto">
      <div class="app-bottom-nav relative grid grid-cols-4 gap-2 rounded-[28px] border border-white/70 bg-white/92 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur">
        ${items
          .map((item) => {
            const isActive =
              route.name === item.key ||
              (item.key === "product" && route.name === "product");
            return `
            <a href="${item.href}" aria-label="${item.label}" class="app-nav-item ${item.primary ? "app-nav-item-primary" : ""} ${isActive ? "app-nav-item-active" : ""}">
              <span class="app-nav-icon">${item.icon}</span>
              <span class="app-nav-label">${item.label}</span>
            </a>
          `;
          })
          .join("")}
      </div>
    </nav>
  `;
}
