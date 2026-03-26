import { renderButton } from "../components/button";
import { renderCard } from "../components/card";
import { renderInlineError } from "../components/inline-alert";
import { renderInputField } from "../components/input-field";
import { renderIcon } from "./page-helpers";

export function renderLoginPage({ loginError, email = "" }) {
  const content = `
    <div class="inline-flex items-center gap-[0.55rem] rounded-full bg-[color:var(--accent-faint)] px-[0.8rem] py-[0.55rem] text-[0.76rem] font-extrabold uppercase tracking-[0.04em] text-[color:var(--accent-strong)] dark:bg-[rgba(228,79,58,0.18)] dark:text-[#ffb0a2] max-[390px]:px-[0.72rem] max-[390px]:py-[0.5rem] max-[390px]:text-[0.68rem]">
      <span class="inline-flex h-[0.95rem] w-[0.95rem] items-center justify-center [&_svg]:h-full [&_svg]:w-full">${renderIcon("shield")}</span>
      <span>Acceso seguro</span>
    </div>
    <p class="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">Trackit</p>
    <h2 class="mt-2 font-heading text-3xl leading-[1.08] text-slate-900 max-[390px]:text-[1.9rem] max-[390px]:leading-[1.05] max-[360px]:text-[1.72rem]">Control de acceso claro, agil y moderno.</h2>
    ${renderInlineError(loginError)}
    <form id="loginForm" class="mt-5 space-y-[1.125rem]">
      ${renderInputField({
        id: "login-email",
        name: "email",
        label: "Email",
        type: "email",
        value: email,
        autoComplete: "username email",
      })}
      ${renderInputField({
        id: "login-password",
        name: "password",
        label: "Password",
        type: "password",
        autoComplete: "current-password",
      })}
      ${renderButton("Entrar", { type: "submit", variant: "primary", block: true })}
    </form>
  `;

  return `
    <section class="flex flex-1 items-center">
      ${renderCard(content, { className: "w-full p-5 sm:p-6" })}
    </section>
  `;
}
