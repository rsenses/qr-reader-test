import { renderButton } from "../components/button";
import { renderEmptyState } from "../components/empty-state";
import { renderSectionHeader } from "../components/section-header";
import { escapeAttribute, escapeHtml } from "../lib/html-utils";
import {
  imagePlaceholderClass,
  interactiveCardClass,
} from "./page-helpers";

export function renderCampaignsPage({ campaigns, buildSiteStorageUrl }) {
  if (!campaigns.length) {
    return renderEmptyState("No hay campañas disponibles.");
  }

  return `
    <section>
      <div class="mb-4">${renderSectionHeader({ title: "Campañas activas", className: "" })}</div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${campaigns
          .map(
            (campaign) => `
          <article class="${interactiveCardClass} h-full overflow-hidden">
            <a href="#/campaigns/${campaign.id}" class="flex h-full flex-col">
               ${campaign.image ? `<img src="${escapeAttribute(buildSiteStorageUrl(campaign.image))}" alt="${escapeHtml(campaign.name)}" class="h-48 w-full object-cover" />` : `<div class="${imagePlaceholderClass}">Sin imagen</div>`}
               <div class="flex flex-1 flex-col p-4">
                 <h3 class="font-heading text-xl text-slate-900">${escapeHtml(campaign.name)}</h3>
                 ${renderButton("Abrir campaña", { tag: "span", variant: "outline", className: "mt-4 inline-flex" })}
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
