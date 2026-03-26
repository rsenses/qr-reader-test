import { renderCard } from "../components/card";
import { renderEmptyState } from "../components/empty-state";
import { renderSectionHeader } from "../components/section-header";
import { escapeAttribute, escapeHtml } from "../lib/html-utils";
import { interactiveCardClass } from "./page-helpers";

export function renderCampaignProductsPage({ campaign, products }) {
  if (!campaign) {
    return renderEmptyState("No encontramos la campaña solicitada.");
  }

  const content = `
     <h2 class="font-heading text-2xl text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">${escapeHtml(campaign.name)}</h2>
    <div class="mt-4 grid gap-3">
      ${products
        .map(
          (product) => `
        <a href="#/products/${escapeAttribute(product.id)}" class="${interactiveCardClass} block">
           <h3 class="font-heading text-xl text-slate-900">${escapeHtml(product.name)}</h3>
           <p class="mt-1 text-sm text-slate-500">Ir al escaner</p>
         </a>
       `,
        )
        .join("")}
    </div>
  `;

  return `
    <section>
      ${renderSectionHeader({ backHref: "#/campaigns", backLabel: "← Campañas", className: "" })}
      ${renderCard(content, { className: "mt-4 rounded-2xl p-5 sm:p-6" })}
    </section>
  `;
}
