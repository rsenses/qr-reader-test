import {
  showInfoNotification,
  showResultNotification,
} from "../notifications/notifications-service";
import { renderLastValidationCard } from "./product-detail-page";
import { emptyState, renderField, renderProductSectionHeader } from "./page-helpers";

export function renderRegisterPage({ product, productCampaign, registerError, lastValidation }) {
  if (!product) {
    return emptyState("No encontramos el producto solicitado.");
  }

  return `
    <section class="space-y-4">
      ${renderProductSectionHeader({ product, productCampaign })}

      <article class="app-card rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="register-header flex items-center justify-between gap-3">
          <div>
            <h2 class="section-title font-heading text-2xl text-slate-900">Nuevo registro</h2>
          </div>
        </div>

        ${showInfoNotification({ channel: "register-error-inline", message: registerError })}
        ${showResultNotification(
          { channel: "inline-last-validation", lastValidation },
          { renderLastValidationCard },
        )}

        <form id="registerForm" class="mt-6 grid gap-4">
          ${renderField("name", "Nombre")}
          ${renderField("last_name", "Apellidos")}
          ${renderField("email", "Email", "email")}
          <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input name="advertising" type="checkbox" value="1" checked class="h-4 w-4 rounded border-slate-300" />
            <span class="text-sm font-medium text-slate-700">Acepta comunicaciones comerciales</span>
          </label>
          <button class="rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white">Registrar</button>
        </form>
      </article>
    </section>
  `;
}
