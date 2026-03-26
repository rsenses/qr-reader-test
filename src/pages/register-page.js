import { renderButton } from "../components/button";
import { renderCard } from "../components/card";
import { renderEmptyState } from "../components/empty-state";
import { renderInlineError } from "../components/inline-alert";
import { renderInputField } from "../components/input-field";
import { renderProductSectionHeader } from "../components/section-header";
import { renderLastValidationCard } from "./product-detail-page";
import { optionRowClass } from "./page-helpers";

export function renderRegisterPage({ product, productCampaign, registerError, lastValidation }) {
  if (!product) {
    return renderEmptyState("No encontramos el producto solicitado.");
  }

  const content = `
    <div class="flex items-center justify-between gap-3 max-[390px]:flex-col max-[390px]:items-start">
      <div>
        <h2 class="font-heading text-2xl leading-[1.1] text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">Nuevo registro</h2>
      </div>
    </div>

    ${renderInlineError(registerError)}
    ${renderLastValidationCard(lastValidation)}

    <form id="registerForm" class="mt-5 grid gap-[1.125rem]">
      ${renderInputField({ name: "name", label: "Nombre" })}
      ${renderInputField({ name: "last_name", label: "Apellidos" })}
      ${renderInputField({ name: "email", label: "Email", type: "email" })}
      <label class="${optionRowClass}">
        <input name="advertising" type="checkbox" value="1" checked class="h-4 w-4 rounded border-slate-300" />
        <span class="text-sm font-medium text-slate-700">Acepta comunicaciones comerciales</span>
      </label>
      ${renderButton("Registrar", { type: "submit" })}
    </form>
  `;

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}
      ${renderCard(content, { className: "rounded-2xl p-5 sm:p-6" })}
    </section>
  `;
}
