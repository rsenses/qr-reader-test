import { escapeHtml } from "../lib/domain-utils";
import { emptyState, interactiveCardClass } from "./page-helpers";

const BACK_LINK_CLASS =
  "inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-base)] transition-[color,transform] duration-150 active:-translate-x-px active:text-[color:var(--text-strong)] focus-visible:text-[color:var(--text-strong)] focus-visible:-translate-x-px";

export function renderCampaignProductsPage({ campaign, products }) {
  if (!campaign) {
    return emptyState("No encontramos la campaña solicitada.");
  }

  return `
    <section>
      <a href="#/campaigns" class="${BACK_LINK_CLASS}">← Campañas</a>
        <div class="app-card mt-4 rounded-[24px] p-5 sm:p-6">
         <h2 class="font-heading text-2xl text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">${escapeHtml(campaign.name)}</h2>
        <div class="mt-4 grid gap-3">
          ${products
            .map(
              (product) => `
            <a href="#/products/${product.id}" class="${interactiveCardClass} block">
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
