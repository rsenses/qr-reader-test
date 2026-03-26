import {
  showInfoNotification,
  showResultNotification,
} from "../notifications/notifications-service";
import { renderLastValidationCard } from "./product-detail-page";
import {
  emptyState,
  optionRowClass,
  renderField,
  renderProductSectionHeader,
} from "./page-helpers";

export function renderRegisterPage({ product, productCampaign, registerError, lastValidation }) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[24px] p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3 max-[390px]:flex-col max-[390px]:items-start">
          <div>
            <h2 class="font-heading text-2xl leading-[1.1] text-slate-900 max-[390px]:text-[1.55rem] max-[390px]:leading-[1.1] max-[360px]:text-[1.4rem]">Nuevo registro</h2>
          </div>
        </div>

        ${showInfoNotification({ channel: "register-error-inline", message: registerError })}
        ${showResultNotification(
          { channel: "inline-last-validation", lastValidation },
          { renderLastValidationCard },
        )}

        <form id="registerForm" class="mt-5 grid gap-[1.125rem]">
          ${renderField("name", "Nombre")}
          ${renderField("last_name", "Apellidos")}
          ${renderField("email", "Email", "email")}
          <label class="${optionRowClass}">
            <input name="advertising" type="checkbox" value="1" checked class="h-4 w-4 rounded border-slate-300" />
            <span class="text-sm font-medium text-slate-700">Acepta comunicaciones comerciales</span>
          </label>
          <button class="ui-button ui-button--primary">Registrar</button>
        </form>
      </article>
    </section>
  `;
}
