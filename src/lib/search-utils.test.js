import { describe, expect, it } from "vitest";

import { filterAttendees, getSearchResults, normalizeSearch } from "./search-utils";

const attendees = [
  {
    name: "Ana López",
    email: "ana@example.com",
    phone: "111",
    company: "Acme",
    position: "CEO",
    registrationType: "VIP",
    qrCode: "QR-ANA",
    metadata: [{ key: "mesa", value: "4" }],
  },
  {
    name: "Iñigo Pérez",
    email: "inigo@example.com",
    phone: "222",
    company: "Globex",
    position: "CTO",
    registrationType: "Asistente",
    qrCode: "QR-INIGO",
    metadata: [{ key: "ciudad", value: "Sevilla" }],
  },
];

describe("search-utils", () => {
  it("normalizes case, whitespace, accents and enye", () => {
    expect(normalizeSearch("  ÁRBoL Ñandú ")).toBe("arbol nandu");
  });

  it("returns empty string for nullish values", () => {
    expect(normalizeSearch(null)).toBe("");
    expect(normalizeSearch(undefined)).toBe("");
  });

  it("filters attendees across normalized fields and metadata", () => {
    expect(filterAttendees(attendees, "lopez")).toEqual([attendees[0]]);
    expect(filterAttendees(attendees, "iñigo")).toEqual([attendees[1]]);
    expect(filterAttendees(attendees, "mesa 4")).toEqual([attendees[0]]);
    expect(filterAttendees(attendees, "qr-inigo")).toEqual([attendees[1]]);
  });

  it("returns all attendees when the normalized query is empty", () => {
    expect(filterAttendees(attendees, "   ")).toEqual(attendees);
  });

  it("returns search metadata and respects minimum chars", () => {
    expect(getSearchResults(attendees, "a")).toEqual({
      normalizedQuery: "a",
      hasEnoughChars: false,
      results: [],
    });

    expect(getSearchResults(attendees, "sev")).toEqual({
      normalizedQuery: "sev",
      hasEnoughChars: true,
      results: [attendees[1]],
    });
  });
});
