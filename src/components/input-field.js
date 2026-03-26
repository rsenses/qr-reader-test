import { escapeAttribute, escapeHtml } from "../lib/html-utils";

const INPUT_LABEL_CLASS =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-[color:var(--text-base)]";

const INPUT_CLASS =
  "w-full min-h-[3.2rem] rounded-[1.3rem] border border-[color:var(--control-border)] bg-[color-mix(in_srgb,var(--control-bg)_86%,var(--surface-raised))] px-4 py-[0.95rem] text-[color:var(--text-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(15,23,42,0.02)] outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-[color:var(--control-border-strong)] focus:bg-[color-mix(in_srgb,var(--control-bg)_70%,var(--surface-raised))] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_14%,transparent)]";

export function renderInputField({
  name,
  label,
  type = "text",
  value = "",
  required = true,
  autoComplete = "off",
  id,
} = {}) {
  const fieldId = id || `field-${name}`;

  return `
    <label class="block">
      <span class="${INPUT_LABEL_CLASS}">${escapeHtml(label)}</span>
      <input id="${fieldId}" name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" value="${escapeAttribute(value)}" autocomplete="${escapeAttribute(autoComplete)}" ${required ? "required" : ""} class="${INPUT_CLASS}" />
    </label>
  `;
}
