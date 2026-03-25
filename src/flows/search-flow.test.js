import { describe, expect, it } from "vitest";

import { findAttemptedAttendee } from "./search-flow";

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
});
