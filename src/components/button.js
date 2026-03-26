import { escapeHtml } from "../lib/html-utils";

const BUTTON_BASE_CLASS =
  "ripple inline-flex min-h-[3.15rem] items-center justify-center rounded-[1.15rem] border-0 px-[1.2rem] py-[0.92rem] text-[0.93rem] font-bold tracking-[0.01em] transition-[box-shadow,background-color,color,border-color,filter] duration-200 cursor-pointer overflow-hidden relative [-webkit-tap-highlight-color:transparent]";

const BUTTON_VARIANT_CLASS = {
  primary:
    "bg-[linear-gradient(180deg,color-mix(in_srgb,white_14%,var(--accent)),var(--accent))] text-white shadow-[0_14px_26px_rgba(228,79,58,0.24)]",
  dark:
    "bg-[#0f172a] text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] dark:bg-[color-mix(in_srgb,var(--surface-soft)_82%,#000_18%)] dark:text-[color:var(--text-strong)] dark:border dark:border-[color:var(--border-soft)] dark:shadow-none",
  outline:
    "border border-[color:var(--control-border)] bg-[color-mix(in_srgb,var(--surface-raised)_72%,var(--surface-soft))] text-[color:var(--text-base)] shadow-none",
};

export function renderButton(
  label,
  {
    tag = "button",
    type = "button",
    variant = "primary",
    block = false,
    className = "",
    attributes = "",
  } = {},
) {
  const classes = [
    BUTTON_BASE_CLASS,
    BUTTON_VARIANT_CLASS[variant] || BUTTON_VARIANT_CLASS.primary,
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const typeAttr = tag === "button" ? ` type="${type}"` : "";

  return `<${tag}${typeAttr}${attributes ? ` ${attributes}` : ""} class="${classes}">${escapeHtml(label)}</${tag}>`;
}
