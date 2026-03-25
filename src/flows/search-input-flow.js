export function buildSearchInputState(attendees, value, getSearchResults) {
  const searchState = getSearchResults(attendees, value);

  return {
    searchQuery: value,
    searchValidation: null,
    searchResults: searchState.results,
    hasEnoughChars: searchState.hasEnoughChars,
  };
}

export function applySearchInputFlow(
  state,
  value,
  {
    getSearchResults,
    renderSearchResults,
    renderSearchValidationCard,
    syncSearchClearButton,
    syncSearchValidationUI,
  },
) {
  const nextState = buildSearchInputState(
    state.product?.attendees || [],
    value,
    getSearchResults,
  );

  state.searchQuery = nextState.searchQuery;
  state.searchValidation = nextState.searchValidation;
  state.searchResults = nextState.searchResults;

  const resultsEl = document.getElementById("manualSearchResults");
  if (resultsEl) {
    resultsEl.innerHTML = renderSearchResults({
      searchQuery: state.searchQuery,
      searchResults: state.searchResults,
      hasEnoughChars: nextState.hasEnoughChars,
    });
  }

  syncSearchValidationUI(state.searchValidation, renderSearchValidationCard);
  syncSearchClearButton(state.searchQuery);

  return nextState;
}
