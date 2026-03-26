export function syncLastValidationUI(lastValidation, renderLastValidationCard) {
  const region = document.getElementById("lastValidationRegion");
  if (!region) return;
  region.innerHTML = renderLastValidationCard(lastValidation);

  const card = region.firstElementChild;
  if (card && typeof card.scrollIntoView === "function") {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
