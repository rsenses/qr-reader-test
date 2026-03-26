import { escapeAttribute } from "../lib/domain-utils";
import { showInfoNotification } from "../notifications/notifications-service";
import { renderIcon } from "./page-helpers";

export function renderLoginPage({ loginError, email = "" }) {
  return `
    <section class="flex flex-1 items-center">
      <article class="app-card w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="hero-badge">
          <span class="hero-badge__icon">${renderIcon("shield")}</span>
          <span>Acceso seguro</span>
        </div>
        <p class="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-(--accent)">Trackit</p>
        <h2 class="login-title mt-2 font-heading text-3xl text-slate-900">Control de acceso claro, agil y moderno.</h2>
        ${showInfoNotification({ channel: "login-error-inline", message: loginError })}
        <form id="loginForm" class="mt-6 space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input id="login-email" type="email" name="email" value="${escapeAttribute(email)}" autocomplete="username email" required class="ui-input w-full" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input id="login-password" type="password" name="password" autocomplete="current-password" required class="ui-input w-full" />
          </label>
          <button class="ui-button ui-button--primary ui-button--block">Entrar</button>
        </form>
      </article>
    </section>
  `;
}
