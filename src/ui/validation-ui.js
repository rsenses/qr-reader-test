export function syncLastValidationUI(lastValidation, renderLastValidationCard) {
  const region = document.getElementById("lastValidationRegion");
  if (!region) return;
  region.innerHTML = renderLastValidationCard(lastValidation);

  const card = region.firstElementChild;
  if (card instanceof HTMLElement) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

export function syncSearchValidationUI(
  searchValidation,
  renderSearchValidationCard,
) {
  const region = document.getElementById("searchValidationRegion");
  if (!region) return;
  region.innerHTML = renderSearchValidationCard(searchValidation);

  const card = region.firstElementChild;
  if (card instanceof HTMLElement) {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

export function syncSearchClearButton(searchQuery) {
  const button = document.querySelector('[data-action="clear-search"]');
  if (!(button instanceof HTMLElement)) return;
  button.classList.toggle("invisible", !searchQuery);
}
