import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applySearchInput,
  buildSearchInputState,
  clearSearch,
  findAttemptedAttendee,
} from "./search-flow";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("search-flow", () => {
  it("prefers search results before product attendees", () => {
    const attendeeFromResults = { qrCode: "qr-1", name: "Ana" };
    const attendeeFromProduct = { qrCode: "qr-1", name: "Otra Ana" };

    expect(
      findAttemptedAttendee(
        {
          searchResults: [attendeeFromResults],
          product: { attendees: [attendeeFromProduct] },
        },
        "qr-1",
      ),
    ).toBe(attendeeFromResults);
  });

  it("falls back to product attendees or null", () => {
    const attendee = { qrCode: "qr-2", name: "Luis" };

    expect(
      findAttemptedAttendee(
        {
          searchResults: [],
          product: { attendees: [attendee] },
        },
        "qr-2",
      ),
    ).toBe(attendee);

    expect(
      findAttemptedAttendee(
        {
          searchResults: [],
          product: { attendees: [] },
        },
        "missing",
      ),
    ).toBeNull();
  });

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
    const validationNode = { innerHTML: "", firstElementChild: null };
    const clearButton = { classList: { toggle: vi.fn() } };

    vi.stubGlobal("document", {
      getElementById(id) {
        if (id === "manualSearchResults") return resultsNode;
        if (id === "searchValidationRegion") return validationNode;
        return null;
      },
      querySelector() {
        return clearButton;
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
    const renderSearchValidationCard = vi.fn().mockReturnValue("");

    const nextState = applySearchInput(state, "luis", {
      getSearchResults,
      renderSearchResults,
      renderSearchValidationCard,
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
    expect(renderSearchValidationCard).toHaveBeenCalledWith(null);
    expect(clearButton.classList.toggle).toHaveBeenCalledWith("invisible", false);
  });

  it("clears search state, regions and focuses input", () => {
    const input = { value: "ana", focus: vi.fn() };
    const resultsNode = { innerHTML: "" };
    const validationNode = { innerHTML: "", firstElementChild: null };
    const clearButton = { classList: { toggle: vi.fn() } };

    vi.stubGlobal("document", {
      getElementById(id) {
        if (id === "manualSearchInput") return input;
        if (id === "manualSearchResults") return resultsNode;
        if (id === "searchValidationRegion") return validationNode;
        return null;
      },
      querySelector() {
        return clearButton;
      },
    });

    const state = {
      searchQuery: "ana",
      searchResults: [{ qrCode: "qr-1" }],
      searchValidation: { ok: true },
    };
    const renderSearchResults = vi.fn().mockReturnValue("<p>empty</p>");
    const renderSearchValidationCard = vi.fn().mockReturnValue("");

    clearSearch(state, { renderSearchResults, renderSearchValidationCard });

    expect(state).toEqual({
      searchQuery: "",
      searchResults: [],
      searchValidation: null,
    });
    expect(input.value).toBe("");
    expect(input.focus).toHaveBeenCalled();
    expect(resultsNode.innerHTML).toBe("<p>empty</p>");
    expect(renderSearchValidationCard).toHaveBeenCalledWith(null);
    expect(clearButton.classList.toggle).toHaveBeenCalledWith("invisible", true);
  });
});
