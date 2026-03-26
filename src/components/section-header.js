import { renderBadge } from "./badge";
import { escapeHtml } from "../lib/html-utils";

const BACK_LINK_CLASS =
  "inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-base)] transition-[color,transform] duration-150 active:-translate-x-px active:text-[color:var(--text-strong)] focus-visible:text-[color:var(--text-strong)] focus-visible:-translate-x-px";

export function renderSectionHeader({
  backHref,
  backLabel,
  title,
  titleClassName = "font-heading text-2xl leading-[1.1] text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]",
  badgeLabel,
  badgeTone = "chip",
  badgeClassName = "w-[75%] max-w-[75%] justify-end truncate text-right",
  className = "",
} = {}) {
  const classes = ["space-y-4", className].filter(Boolean).join(" ");
  const topRow = backHref || badgeLabel
    ? `
      <div class="flex items-center justify-between gap-3 px-1">
        ${backHref ? `<a href="${backHref}" class="${BACK_LINK_CLASS} shrink-0">${escapeHtml(backLabel || "Volver")}</a>` : ""}
        ${badgeLabel ? renderBadge(badgeLabel, { tone: badgeTone, className: badgeClassName }) : ""}
      </div>
    `
    : "";

  return `
    <div class="${classes}">
      ${topRow}
      ${title ? `<div><h2 class="${titleClassName}">${escapeHtml(title)}</h2></div>` : ""}
    </div>
  `;
}

export function renderProductSectionHeader({ product, productCampaign }) {
  const backHref = productCampaign?.id ? `#/campaigns/${productCampaign.id}` : "#/campaigns";
  return renderSectionHeader({
    backHref,
    backLabel: "← Productos",
    badgeLabel: product?.name || "Producto",
    className: "",
  });
}
