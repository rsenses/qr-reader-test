import { renderCard } from "../components/card";
import { renderEmptyState } from "../components/empty-state";
import { renderInlineNote } from "../components/inline-note";
import { renderProductSectionHeader } from "../components/section-header";
import { renderStatCard } from "../components/stat-card";
import { escapeHtml } from "../lib/html-utils";
import { getProductStats } from "../lib/stats-utils";
import {
  progressBarClass,
  progressTrackClass,
  simpleCardClass,
} from "./page-helpers";

export function renderProductStatsPage({ product, productCampaign }) {
  if (!product) {
    return renderEmptyState("No encontramos el producto solicitado.");
  }

  const stats = getProductStats(product.attendees);
  const content = `
    <h2 class="font-heading text-2xl leading-[1.1] text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">Estadisticas</h2>

    <div class="mt-5 grid grid-cols-2 gap-3.5 max-[390px]:grid-cols-1">
      ${renderStatCard({
        label: "Inscritos",
        value: stats.totalPaidOrVerified,
        toneClassName: "bg-[color:var(--surface-soft)] text-[color:var(--text-muted)]",
        valueClassName: "text-slate-900",
      })}
      ${renderStatCard({
        label: "Verificados",
        value: stats.totalVerified,
        toneClassName: "bg-[color:color-mix(in_srgb,var(--accent-faint)_78%,var(--surface-raised))] text-[color:var(--accent-strong)]",
        valueClassName: "text-[color:var(--accent-strong)]",
      })}
    </div>

    <div class="mt-5 space-y-3.5">
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
  `;

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}
      ${renderCard(content, { className: "p-4 sm:p-5" })}
    </section>
  `;
}
