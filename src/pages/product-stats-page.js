import { escapeHtml, getProductStats } from "../lib/domain-utils";
import {
  emptyState,
  metricCardBaseClass,
  metricCardLabelClass,
  progressBarClass,
  progressTrackClass,
  renderInlineNote,
  renderProductSectionHeader,
  simpleCardClass,
} from "./page-helpers";

export function renderProductStatsPage({ product, productCampaign }) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  const stats = getProductStats(product.attendees);

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[28px] p-4 sm:p-5">
        <h2 class="font-heading text-2xl text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">Estadisticas</h2>

        <div class="mt-4 grid grid-cols-2 gap-3 max-[390px]:grid-cols-1">
          <div class="${metricCardBaseClass} bg-[color:var(--surface-soft)]">
            <p class="${metricCardLabelClass} text-[color:var(--text-muted)]">Inscritos</p>
            <p class="mt-2 text-3xl font-bold text-slate-900 max-[390px]:text-[2rem] max-[390px]:leading-none">${stats.totalPaidOrVerified}</p>
          </div>
          <div class="${metricCardBaseClass} bg-[color:color-mix(in_srgb,var(--accent-faint)_78%,var(--surface-raised))]">
            <p class="${metricCardLabelClass} text-[color:var(--accent-strong)]">Verificados</p>
            <p class="mt-2 text-3xl font-bold text-[color:var(--accent-strong)] max-[390px]:text-[2rem] max-[390px]:leading-none">${stats.totalVerified}</p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          ${
            stats.byType.length
              ? stats.byType
                  .map(
                    (entry) => `
            <article class="${simpleCardClass}">
               <div class="flex items-center justify-between gap-3">
                 <div>
                   <h3 class="font-semibold text-slate-900">${escapeHtml(entry.label)}</h3>
                   <p class="mt-1 text-sm text-slate-500">${entry.verified} verificados de ${entry.total} inscritos</p>
                 </div>
                 <p class="text-sm font-semibold text-slate-700">${entry.percentage}%</p>
               </div>
               <div class="${progressTrackClass}">
                 <div class="${progressBarClass}" style="width: ${entry.percentage}%"></div>
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
