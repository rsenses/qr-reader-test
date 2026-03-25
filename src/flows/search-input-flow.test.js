import { afterEach, describe, expect, it, vi } from "vitest";

import { applySearchInputFlow, buildSearchInputState } from "./search-input-flow";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("search-input-flow", () => {
  it("builds next search state from search service results", () => {
    const getSearchResults = vi.fn().mockReturnValue({
      hasEnoughChars: true,
      results: [{ qrCode: "qr-1" }],
    });

    expect(buildSearchInputState([{ id: 1 }], "ana", getSearchResults)).toEqual({
      searchQuery: "ana",
      searchValidation: null,
      searchResults: [{ qrCode: "qr-1" }],
      hasEnoughChars: true,
    });
    expect(getSearchResults).toHaveBeenCalledWith([{ id: 1 }], "ana");
  });

  it("applies search input updates and syncs derived UI", () => {
    const resultsNode = { innerHTML: "" };
    vi.stubGlobal("document", {
      getElementById(id) {
        return id === "manualSearchResults" ? resultsNode : null;
      },
    });

    const state = {
      product: { attendees: [{ id: 1 }] },
      searchQuery: "",
      searchValidation: { ok: false },
      searchResults: [],
    };
    const getSearchResults = vi.fn().mockReturnValue({
      hasEnoughChars: true,
      results: [{ qrCode: "qr-2" }],
    });
    const renderSearchResults = vi.fn().mockReturnValue("<p>ok</p>");
    const renderSearchValidationCard = vi.fn();
    const syncSearchValidationUI = vi.fn();
    const syncSearchClearButton = vi.fn();

    const nextState = applySearchInputFlow(state, "luis", {
      getSearchResults,
      renderSearchResults,
      renderSearchValidationCard,
      syncSearchValidationUI,
      syncSearchClearButton,
    });

    expect(nextState).toEqual({
      searchQuery: "luis",
      searchValidation: null,
      searchResults: [{ qrCode: "qr-2" }],
      hasEnoughChars: true,
    });
    expect(state.searchQuery).toBe("luis");
    expect(state.searchValidation).toBeNull();
    expect(state.searchResults).toEqual([{ qrCode: "qr-2" }]);
    expect(renderSearchResults).toHaveBeenCalledWith({
      searchQuery: "luis",
      searchResults: [{ qrCode: "qr-2" }],
      hasEnoughChars: true,
    });
    expect(resultsNode.innerHTML).toBe("<p>ok</p>");
    expect(syncSearchValidationUI).toHaveBeenCalledWith(
      null,
      renderSearchValidationCard,
    );
    expect(syncSearchClearButton).toHaveBeenCalledWith("luis");
  });
});
