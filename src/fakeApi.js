const API_PREFIX = "/api/v1";
const API_TOKEN = String(import.meta.env.API_TOKEN || "").trim();

function svgDataUrl(title, palette) {
  const [bgFrom, bgTo, accent] = palette;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgFrom}" />
          <stop offset="100%" stop-color="${bgTo}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)" rx="36" />
      <circle cx="980" cy="170" r="130" fill="${accent}" fill-opacity="0.18" />
      <circle cx="180" cy="560" r="180" fill="#ffffff" fill-opacity="0.08" />
      <rect x="90" y="90" width="250" height="16" rx="8" fill="#ffffff" fill-opacity="0.3" />
      <rect x="90" y="130" width="140" height="16" rx="8" fill="#ffffff" fill-opacity="0.16" />
      <text x="90" y="340" fill="#ffffff" font-family="Arial, sans-serif" font-size="74" font-weight="700">${title}</text>
      <text x="90" y="408" fill="#ffffff" fill-opacity="0.82" font-family="Arial, sans-serif" font-size="30">Campana activa para validacion QR</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const database = {
  users: [],
  campaigns: [
    {
      id: "cmp-retail-2026",
      name: "Retail Leaders Summit",
      image: svgDataUrl("Retail Leaders", ["#12343b", "#1f6b75", "#f7c873"]),
      active: true,
      products: [
        {
          id: "prd-retail-vip",
          name: "Pase VIP",
          attendees: [
            {
              id: "att-001",
              qrCode: "vip-marta-001",
              name: "Marta Roman",
              email: "marta.roman@example.com",
              phone: "+34 600 100 100",
              company: "Nova Retail",
              position: "CMO",
              registrationType: "vip",
              status: "paid",
              metadata: [
                { key: "mesa", value: "A12" },
                { key: "idioma", value: "ES" },
                { key: "sala", value: "Auditorio Norte" },
              ],
            },
            {
              id: "att-002",
              qrCode: "vip-lucas-002",
              name: "Lucas Vera",
              email: "lucas.vera@example.com",
              phone: "+34 600 100 200",
              company: "Market Nest",
              position: "Head of Growth",
              registrationType: "vip",
              status: "paid",
              metadata: [
                { key: "acompanante", value: "Si" },
                { key: "dieta", value: "Vegetariana" },
              ],
            },
          ],
        },
        {
          id: "prd-retail-general",
          name: "Entrada General",
          attendees: [
            {
              id: "att-003",
              qrCode: "gen-paula-003",
              name: "Paula Saez",
              email: "paula.saez@example.com",
              phone: "+34 600 100 300",
              company: "Lighthouse Commerce",
              position: "Store Director",
              registrationType: "asistente",
              status: "paid",
              metadata: [{ key: "turno", value: "Manana" }],
            },
            {
              id: "att-004",
              qrCode: "error-javier-004",
              name: "Javier Pardo",
              email: "javier.pardo@example.com",
              phone: "+34 600 100 400",
              company: "Urban Stock",
              position: "Buyer",
              registrationType: "invitado",
              status: "pending",
              metadata: [{ key: "motivo", value: "Pago pendiente" }],
            },
          ],
        },
      ],
    },
    {
      id: "cmp-tech-2026",
      name: "Future Commerce Forum",
      image: svgDataUrl("Future Commerce", ["#371b58", "#7858a6", "#ffd56f"]),
      active: true,
      products: [
        {
          id: "prd-tech-networking",
          name: "Networking Pass",
          attendees: [
            {
              id: "att-005",
              qrCode: "net-sara-005",
              name: "Sara Mena",
              email: "sara.mena@example.com",
              phone: "+34 600 100 500",
              company: "PayFlow",
              position: "Partnership Manager",
              registrationType: "ponente",
              status: "paid",
              metadata: [
                { key: "interes", value: "Pagos" },
                { key: "ciudad", value: "Madrid" },
              ],
            },
            {
              id: "att-006",
              qrCode: "net-david-006",
              name: "David Costa",
              email: "david.costa@example.com",
              phone: "+34 600 100 600",
              company: "Omni Hub",
              position: "Product Lead",
              registrationType: "asistente",
              status: "paid",
              metadata: [],
            },
          ],
        },
      ],
    },
  ],
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function unauthorized() {
  return jsonResponse({ ok: false, message: "No autorizado" }, 401);
}

function normalizeHeaders(headers) {
  if (headers instanceof Headers) return headers;
  return new Headers(headers || {});
}

function ensureAuthorized(requestHeaders) {
  const headers = normalizeHeaders(requestHeaders);
  const auth = headers.get("Authorization") || headers.get("authorization");
  return Boolean(API_TOKEN && auth === `Bearer ${API_TOKEN}`);
}

function findProduct(productId) {
  for (const campaign of database.campaigns) {
    const product = campaign.products.find((entry) => entry.id === productId);
    if (product) return { campaign, product };
  }

  return null;
}

function findAttendeeByQr(qrCode) {
  for (const campaign of database.campaigns) {
    for (const product of campaign.products) {
      const attendee = product.attendees.find(
        (entry) => entry.qrCode === qrCode,
      );
      if (attendee) return { campaign, product, attendee };
    }
  }

  return null;
}

function getAllAttendeeEntries() {
  const entries = [];

  for (const campaign of database.campaigns) {
    for (const product of campaign.products) {
      for (const attendee of product.attendees) {
        entries.push({ campaign, product, attendee });
      }
    }
  }

  return entries;
}

async function parseBody(init) {
  if (!init?.body) return {};

  if (typeof init.body === "string") {
    return JSON.parse(init.body);
  }

  return {};
}

function publicCampaign(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    image: campaign.image,
    active: campaign.active,
    productCount: campaign.products.length,
  };
}

function publicProduct(product) {
  return {
    id: product.id,
    name: product.name,
    attendeeCount: product.attendees.length,
  };
}

function publicAttendee(attendee) {
  return {
    id: attendee.id,
    qrCode: attendee.qrCode,
    name: attendee.name,
    email: attendee.email,
    phone: attendee.phone,
    company: attendee.company,
    position: attendee.position,
    registrationType: attendee.registrationType,
    status: attendee.status,
    metadata: attendee.metadata,
  };
}

async function handleRegister(init) {
  const body = await parseBody(init);
  const payload = {
    id: `usr-${Date.now()}`,
    name: body.name,
    email: body.email,
    phone: body.phone,
    company: body.company,
    position: body.position,
    registrationType: body.registrationType,
  };

  database.users.push(payload);

  return jsonResponse(
    {
      ok: true,
      user: payload,
      message: "Usuario registrado correctamente",
    },
    201,
  );
}

async function handleAuthorizedGet(pathname) {
  if (pathname === `${API_PREFIX}/campaigns`) {
    return jsonResponse({
      ok: true,
      campaigns: database.campaigns
        .filter((campaign) => campaign.active)
        .map(publicCampaign),
    });
  }

  const campaignProductsMatch = pathname.match(
    /^\/api\/v1\/campaigns\/([^/]+)\/products$/,
  );
  if (campaignProductsMatch) {
    const campaign = database.campaigns.find(
      (entry) => entry.id === campaignProductsMatch[1],
    );

    if (!campaign) {
      return jsonResponse({ ok: false, message: "Campana no encontrada" }, 404);
    }

    return jsonResponse({
      ok: true,
      campaign: publicCampaign(campaign),
      products: campaign.products.map(publicProduct),
    });
  }

  const productMatch = pathname.match(/^\/api\/v1\/products\/([^/]+)$/);
  if (productMatch) {
    const productEntry = findProduct(productMatch[1]);

    if (!productEntry) {
      return jsonResponse(
        { ok: false, message: "Producto no encontrado" },
        404,
      );
    }

    return jsonResponse({
      ok: true,
      campaign: publicCampaign(productEntry.campaign),
      product: {
        ...publicProduct(productEntry.product),
        attendees: productEntry.product.attendees.map(publicAttendee),
      },
    });
  }

  return jsonResponse({ ok: false, message: "Endpoint no encontrado" }, 404);
}

async function handleValidate(pathname) {
  const validateMatch = pathname.match(/^\/api\/v1\/validate\/([^/]+)$/);

  if (!validateMatch) {
    return jsonResponse({ ok: false, message: "Endpoint no encontrado" }, 404);
  }

  const qrCode = decodeURIComponent(validateMatch[1]);
  if (qrCode.toLowerCase().includes("error")) {
    const attendeeEntry = findAttendeeByQr(qrCode);

    return jsonResponse(
      {
        ok: false,
        message: "El inscrito no esta listo para validacion",
        attendee: attendeeEntry
          ? publicAttendee(attendeeEntry.attendee)
          : undefined,
      },
      400,
    );
  }

  const candidates = getAllAttendeeEntries().filter(
    (entry) =>
      entry.attendee.status === "paid" || entry.attendee.status === "verified",
  );

  if (!candidates.length) {
    return jsonResponse(
      { ok: false, message: "No hay inscritos disponibles" },
      404,
    );
  }

  const attendeeEntry =
    candidates[Math.floor(Math.random() * candidates.length)];

  attendeeEntry.attendee.status = "verified";

  return jsonResponse({
    ok: true,
    attendee: publicAttendee(attendeeEntry.attendee),
    product: publicProduct(attendeeEntry.product),
    campaign: publicCampaign(attendeeEntry.campaign),
    title: "Verificado correctamente",
    subtitle: "QR leido y validado",
  });
}

export function installFakeApi() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url =
      typeof input === "string"
        ? new URL(input, window.location.origin)
        : new URL(input.url);

    if (!url.pathname.startsWith(API_PREFIX)) {
      return originalFetch(input, init);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 250 + Math.round(Math.random() * 500)),
    );

    const method = (
      init.method ||
      (typeof input !== "string" ? input.method : "GET") ||
      "GET"
    ).toUpperCase();

    if (url.pathname === `${API_PREFIX}/register/` && method === "POST") {
      return handleRegister(init);
    }

    const requestHeaders =
      init.headers || (typeof input !== "string" ? input.headers : undefined);
    if (!ensureAuthorized(requestHeaders)) {
      return unauthorized();
    }

    if (method === "GET") {
      return handleAuthorizedGet(url.pathname);
    }

    if (method === "POST") {
      return handleValidate(url.pathname);
    }

    return jsonResponse({ ok: false, message: "Metodo no soportado" }, 405);
  };
}
