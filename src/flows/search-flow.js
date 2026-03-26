function getSearchResultsRegion() {
  return document.getElementById("manualSearchResults");
}

function getSearchValidationRegion() {
  return document.getElementById("searchValidationRegion");
}

function getSearchInput() {
  return document.getElementById("manualSearchInput");
}

function getClearSearchButton() {
  return document.querySelector('[data-action="clear-search"]');
}

function scrollCardIntoView(region) {
  const card = region?.firstElementChild;
  if (card && typeof card.scrollIntoView === "function") {
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function renderValidationRegion(searchValidation, renderSearchValidationCard) {
  const region = getSearchValidationRegion();
  if (!region) return;

  region.innerHTML = renderSearchValidationCard(searchValidation);
  scrollCardIntoView(region);
}

function renderResultsRegion(
  { searchQuery, searchResults, hasEnoughChars },
  renderSearchResults,
) {
  const resultsRegion = getSearchResultsRegion();
  if (!resultsRegion) return;

  resultsRegion.innerHTML = renderSearchResults({
    searchQuery,
    searchResults,
    hasEnoughChars,
  });
}

function syncClearSearchButton(searchQuery) {
  const button = getClearSearchButton();
  if (!button?.classList?.toggle) return;
  button.classList.toggle("invisible", !searchQuery);
}

function setSearchInputValue(value) {
  const input = getSearchInput();
  if (input && "value" in input) {
    input.value = value;
  }
}

export function findAttemptedAttendee({ searchResults, product }, qrCode) {
  return (
    searchResults.find((entry) => entry.qrCode === qrCode) ||
    product?.attendees?.find((entry) => entry.qrCode === qrCode) ||
    null
  );
}

export function buildSearchInputState(attendees, value, getSearchResults) {
  const searchState = getSearchResults(attendees, value);

  return {
    searchQuery: value,
    searchValidation: null,
    searchResults: searchState.results,
    hasEnoughChars: searchState.hasEnoughChars,
  };
}

export function applySearchInput(
  state,
  value,
  { getSearchResults, renderSearchResults, renderSearchValidationCard },
) {
  const nextState = buildSearchInputState(
    state.product?.attendees || [],
    value,
    getSearchResults,
  );

  state.searchQuery = nextState.searchQuery;
  state.searchValidation = nextState.searchValidation;
  state.searchResults = nextState.searchResults;

  renderResultsRegion(nextState, renderSearchResults);
  renderValidationRegion(state.searchValidation, renderSearchValidationCard);
  syncClearSearchButton(state.searchQuery);

  return nextState;
}

export function applySearchValidationSuccess(
  state,
  validation,
  { renderSearchValidationCard },
) {
  state.searchValidation = {
    ok: true,
    message: validation.title,
    attendee: validation.attendee,
  };
  state.searchQuery = "";
  state.searchResults = [];

  setSearchInputValue("");
  renderResultsRegion(
    { searchQuery: state.searchQuery, searchResults: state.searchResults, hasEnoughChars: false },
    () => "",
  );
  renderValidationRegion(state.searchValidation, renderSearchValidationCard);
  syncClearSearchButton(state.searchQuery);
}

export function applySearchValidationError(
  state,
  errorMessage,
  attemptedAttendee,
  { renderSearchResults, renderSearchValidationCard },
) {
  state.searchValidation = {
    ok: false,
    message: errorMessage,
    attendee: attemptedAttendee,
  };
  state.searchResults = attemptedAttendee ? [attemptedAttendee] : [];

  renderResultsRegion(
    {
      searchQuery: state.searchQuery,
      searchResults: state.searchResults,
      hasEnoughChars: Boolean(attemptedAttendee),
    },
    attemptedAttendee ? renderSearchResults : () => "",
  );
  renderValidationRegion(state.searchValidation, renderSearchValidationCard);
}

export function clearSearch(state, { renderSearchResults, renderSearchValidationCard }) {
  state.searchQuery = "";
  state.searchResults = [];
  state.searchValidation = null;

  setSearchInputValue("");
  const input = getSearchInput();
  if (input && typeof input.focus === "function") {
    input.focus();
  }

  renderResultsRegion(
    { searchQuery: state.searchQuery, searchResults: state.searchResults, hasEnoughChars: false },
    renderSearchResults,
  );
  renderValidationRegion(state.searchValidation, renderSearchValidationCard);
  syncClearSearchButton(state.searchQuery);
}

export function refreshSearchResults(
  state,
  { getSearchResults, renderSearchResults },
) {
  const searchState = getSearchResults(state.product?.attendees || [], state.searchQuery);
  state.searchResults = searchState.results;

  renderResultsRegion(
    {
      searchQuery: state.searchQuery,
      searchResults: state.searchResults,
      hasEnoughChars: searchState.hasEnoughChars,
    },
    renderSearchResults,
  );
}
