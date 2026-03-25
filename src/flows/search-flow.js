export function findAttemptedAttendee({ searchResults, product }, qrCode) {
  return (
    searchResults.find((entry) => entry.qrCode === qrCode) ||
    product?.attendees?.find((entry) => entry.qrCode === qrCode) ||
    null
  );
}

export function applySearchValidationSuccess(
  state,
  validation,
  { syncSearchValidationUI, renderSearchValidationCard },
) {
  state.searchValidation = {
    ok: true,
    message: validation.title,
    attendee: validation.attendee,
  };
  state.searchQuery = "";
  state.searchResults = [];

  const input = document.getElementById("manualSearchInput");
  if (input instanceof HTMLInputElement) {
    input.value = "";
  }

  const resultsEl = document.getElementById("manualSearchResults");
  if (resultsEl) {
    resultsEl.innerHTML = "";
  }

  syncSearchValidationUI(state.searchValidation, renderSearchValidationCard);
}

export function applySearchValidationError(
  state,
  errorMessage,
  attemptedAttendee,
  { renderSearchResults, renderSearchValidationCard, syncSearchValidationUI },
) {
  state.searchValidation = {
    ok: false,
    message: errorMessage,
    attendee: attemptedAttendee,
  };
  state.searchResults = attemptedAttendee ? [attemptedAttendee] : [];

  const resultsEl = document.getElementById("manualSearchResults");
  if (resultsEl) {
    resultsEl.innerHTML = attemptedAttendee
      ? renderSearchResults({
          searchQuery: state.searchQuery,
          searchResults: state.searchResults,
          hasEnoughChars: true,
        })
      : "";
  }

  syncSearchValidationUI(state.searchValidation, renderSearchValidationCard);
}

export function clearSearchFlow(
  state,
  {
    render,
    renderSearchResults,
    renderSearchValidationCard,
    syncSearchClearButton,
    syncSearchValidationUI,
  },
) {
  state.searchQuery = "";
  state.searchResults = [];
  state.searchValidation = null;

  const input = document.getElementById("manualSearchInput");
  const resultsEl = document.getElementById("manualSearchResults");
  if (input instanceof HTMLInputElement) {
    input.value = "";
    input.focus();
  }

  if (resultsEl) {
    resultsEl.innerHTML = renderSearchResults({
      searchQuery: state.searchQuery,
      searchResults: state.searchResults,
      hasEnoughChars: false,
    });
  }

  syncSearchValidationUI(state.searchValidation, renderSearchValidationCard);
  syncSearchClearButton(state.searchQuery);
  render();
}
