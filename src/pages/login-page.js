import { escapeAttribute } from "../lib/domain-utils";
import { showInfoNotification } from "../notifications/notifications-service";
import { renderIcon } from "./page-helpers";

export function renderLoginPage({ loginError, email = "" }) {
  return `
    <section class="flex flex-1 items-center">
      <article class="app-card w-full rounded-[28px] p-5 sm:p-6">
        <div class="hero-badge">
          <span class="hero-badge__icon">${renderIcon("shield")}</span>
          <span>Acceso seguro</span>
        </div>
        <p class="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">Trackit</p>
        <h2 class="mt-2 font-heading text-3xl leading-[1.08] text-slate-900 max-[390px]:text-[1.9rem] max-[390px]:leading-[1.05] max-[360px]:text-[1.72rem]">Control de acceso claro, agil y moderno.</h2>
        ${showInfoNotification({ channel: "login-error-inline", message: loginError })}
        <form id="loginForm" class="mt-5 space-y-[1.125rem]">
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
