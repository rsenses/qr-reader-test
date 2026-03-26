import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applySearchInput,
  applySearchValidationSuccess,
  buildSearchInputState,
  clearSearch,
  findAttemptedAttendee,
} from "./product-search-page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("product-search-page feature helpers", () => {
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

  it("builds next search state from normalized search results", () => {
    expect(
      buildSearchInputState(
        [
          {
            name: "Ana Lopez",
            email: "ana@example.com",
            phone: "111",
            company: "Acme",
            position: "CEO",
            registrationType: "VIP",
            qrCode: "qr-1",
            metadata: [],
          },
        ],
        "ana",
      ),
    ).toEqual({
      searchQuery: "ana",
      searchValidation: null,
      searchResults: [
        {
          name: "Ana Lopez",
          email: "ana@example.com",
          phone: "111",
          company: "Acme",
          position: "CEO",
          registrationType: "VIP",
          qrCode: "qr-1",
          metadata: [],
        },
      ],
      hasEnoughChars: true,
    });
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
      product: {
        attendees: [
          {
            name: "Luis",
            email: "luis@example.com",
            phone: "123",
            company: "Acme",
            position: "CTO",
            registrationType: "VIP",
            qrCode: "qr-2",
            metadata: [],
          },
        ],
      },
      searchQuery: "",
      searchValidation: { ok: false },
      searchResults: [],
    };

    const nextState = applySearchInput(state, "luis");

    expect(nextState).toEqual({
      searchQuery: "luis",
      searchValidation: null,
      searchResults: [state.product.attendees[0]],
      hasEnoughChars: true,
    });
    expect(state.searchQuery).toBe("luis");
    expect(state.searchValidation).toBeNull();
    expect(state.searchResults).toEqual([state.product.attendees[0]]);
    expect(resultsNode.innerHTML).toContain("Luis");
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

    clearSearch(state);

    expect(state).toEqual({
      searchQuery: "",
      searchResults: [],
      searchValidation: null,
    });
    expect(input.value).toBe("");
    expect(input.focus).toHaveBeenCalled();
    expect(resultsNode.innerHTML).toContain("Todavia no has escrito nada.");
    expect(clearButton.classList.toggle).toHaveBeenCalledWith("invisible", true);
  });

  it("clears results and renders validation feedback after manual success", () => {
    const input = { value: "ana" };
    const resultsNode = { innerHTML: "" };
    const card = { scrollIntoView: vi.fn() };
    const validationNode = { innerHTML: "", firstElementChild: card };
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
      searchValidation: null,
    };

    applySearchValidationSuccess(state, {
      title: "Verificado correctamente",
      attendee: { name: "Ana", registrationType: "VIP", metadata: [] },
    });

    expect(state.searchQuery).toBe("");
    expect(state.searchResults).toEqual([]);
    expect(state.searchValidation).toEqual({
      ok: true,
      message: "Verificado correctamente",
      attendee: { name: "Ana", registrationType: "VIP", metadata: [] },
    });
    expect(input.value).toBe("");
    expect(card.scrollIntoView).toHaveBeenCalled();
  });
});
