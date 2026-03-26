export function renderStatCard({
  label,
  value,
  toneClassName,
  valueClassName,
} = {}) {
  return `
    <div class="rounded-[22px] p-4 shadow-[var(--shadow-soft)] ${toneClassName}">
      <p class="text-[0.72rem] font-bold uppercase tracking-[0.2em]">${label}</p>
      <p class="mt-2 text-3xl font-bold max-[390px]:text-[2rem] max-[390px]:leading-none ${valueClassName}">${value}</p>
    </div>
  `;
}
