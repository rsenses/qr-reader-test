import { escapeAttribute, escapeHtml } from "../lib/html-utils";

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
    <div class="floating-input">
      <input 
        id="${fieldId}" 
        name="${escapeAttribute(name)}" 
        type="${escapeAttribute(type)}" 
        value="${escapeAttribute(value)}" 
        autocomplete="${escapeAttribute(autoComplete)}" 
        ${required ? "required" : ""} 
        placeholder=" "
      />
      <label for="${fieldId}">${escapeHtml(label)}${required ? ' <span class="text-[color:var(--accent)]">*</span>' : ''}</label>
    </div>
  `;
}