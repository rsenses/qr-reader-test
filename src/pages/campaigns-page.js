import { escapeAttribute, escapeHtml } from "../lib/domain-utils";
import { emptyState } from "./page-helpers";

export function renderCampaignsPage({ campaigns, buildSiteStorageUrl }) {
  if (!campaigns.length) {
    return emptyState("No hay campañas disponibles.");
  }

  return `
    <section>
      <div class="mb-4">
        <div>
          <h2 class="section-title font-heading text-2xl text-slate-900">Campañas activas</h2>
          <p class="mt-1 text-sm text-slate-500">Selecciona una campaña.</p>
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${campaigns
          .map(
            (campaign) => `
          <article class="h-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <a href="#/campaigns/${campaign.id}" class="flex h-full flex-col">
              ${campaign.image ? `<img src="${escapeAttribute(buildSiteStorageUrl(campaign.image))}" alt="${escapeHtml(campaign.name)}" class="h-48 w-full object-cover" />` : `<div class="flex h-48 items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">Sin imagen</div>`}
              <div class="flex flex-1 flex-col p-4">
                <h3 class="font-heading text-xl text-slate-900">${escapeHtml(campaign.name)}</h3>
                <span class="mt-4 inline-flex rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Abrir campaña</span>
              </div>
            </a>
          </article>
        `,
          )
          .join("")}
      </div>
    </section>
  `;
}
