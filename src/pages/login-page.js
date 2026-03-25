import { showInfoNotification } from "../notifications/notifications-service";
import { renderIcon } from "./page-helpers";

export function renderLoginPage({ loginError }) {
  return `
    <section class="flex flex-1 items-center">
      <article class="app-card w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="hero-badge">
          <span class="hero-badge__icon">${renderIcon("shield")}</span>
          <span>Acceso seguro</span>
        </div>
        <p class="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">Trackit</p>
        <h2 class="login-title mt-2 font-heading text-3xl text-slate-900">Control de acceso claro, agil y moderno.</h2>
        <p class="mt-3 max-w-md text-sm text-slate-500">Inicia sesion para acceder a las campanas y seguir usando la navegacion actual de la app.</p>
        ${showInfoNotification({ channel: "login-error-inline", message: loginError })}
        <form id="loginForm" class="mt-6 space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Email</span>
            <input id="login-email" type="email" name="email" autocomplete="username email" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <input id="login-password" type="password" name="password" autocomplete="current-password" required class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900" />
          </label>
          <button class="w-full rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(228,79,58,0.28)]">Entrar</button>
        </form>
      </article>
    </section>
  `;
}
