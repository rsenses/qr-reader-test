import { escapeHtml } from "../lib/domain-utils";
import { emptyState } from "./page-helpers";

export function renderCampaignProductsPage({ campaign, products }) {
  if (!campaign) {
    return emptyState("No encontramos la campaña solicitada.");
  }

  return `
    <section>
      <a href="#/campaigns" class="ui-back-link inline-flex items-center gap-2 text-sm font-semibold">← Campañas</a>
        <div class="app-card mt-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
         <h2 class="section-title font-heading text-2xl text-slate-900">${escapeHtml(campaign.name)}</h2>
        <div class="mt-4 grid gap-3">
          ${products
            .map(
              (product) => `
            <a href="#/products/${product.id}" class="ui-list-card ui-list-card--interactive block">
               <h3 class="font-heading text-xl text-slate-900">${escapeHtml(product.name)}</h3>
               <p class="mt-1 text-sm text-slate-500">Ir al escaner</p>
             </a>
           `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
