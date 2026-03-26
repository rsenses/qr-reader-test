import { escapeHtml, getProductStats } from "../lib/domain-utils";
import { emptyState, renderInlineNote, renderProductSectionHeader } from "./page-helpers";

export function renderProductStatsPage({ product, productCampaign }) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  const stats = getProductStats(product.attendees);

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm sm:p-5">
        <h2 class="section-title font-heading text-2xl text-slate-900">Estadisticas</h2>

        <div class="stats-grid mt-4 grid grid-cols-2 gap-3">
          <div class="ui-metric-card ui-metric-card--neutral">
            <p class="ui-metric-card__label">Inscritos</p>
            <p class="stats-number mt-2 text-3xl font-bold text-slate-900">${stats.totalPaidOrVerified}</p>
          </div>
          <div class="ui-metric-card ui-metric-card--accent">
            <p class="ui-metric-card__label">Verificados</p>
            <p class="stats-number mt-2 text-3xl font-bold text-[color:var(--accent-strong)]">${stats.totalVerified}</p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          ${
            stats.byType.length
              ? stats.byType
                  .map(
                    (entry) => `
            <article class="ui-list-card">
               <div class="flex items-center justify-between gap-3">
                 <div>
                   <h3 class="font-semibold text-slate-900">${escapeHtml(entry.label)}</h3>
                   <p class="mt-1 text-sm text-slate-500">${entry.verified} verificados de ${entry.total} inscritos</p>
                 </div>
                 <p class="text-sm font-semibold text-slate-700">${entry.percentage}%</p>
               </div>
               <div class="ui-progress mt-3 h-3 overflow-hidden rounded-full">
                 <div class="ui-progress__bar h-full rounded-full" style="width: ${entry.percentage}%"></div>
               </div>
             </article>
           `,
                  )
                  .join("")
              : renderInlineNote("No hay inscritos paid o verified para mostrar.")
           }
        </div>
      </article>
    </section>
  `;
}
