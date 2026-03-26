export const baseCardClass =
  "relative overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-raised)] shadow-[var(--shadow-soft)]";

export function renderCard(content, { tag = "article", className = "" } = {}) {
  const classes = [baseCardClass, className].filter(Boolean).join(" ");
  return `<${tag} class="${classes}">${content}</${tag}>`;
}
