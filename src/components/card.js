export const baseCardClass =
  "relative overflow-hidden rounded-[28px] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.02)_100%),var(--surface-raised)] shadow-[0_16px_34px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[18px]";

export function renderCard(content, { tag = "article", className = "" } = {}) {
  const classes = [baseCardClass, className].filter(Boolean).join(" ");
  return `<${tag} class="${classes}">${content}</${tag}>`;
}
