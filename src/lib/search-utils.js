export function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ñ", "n");
}

export function filterAttendees(attendees, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return attendees;

  return attendees.filter((attendee) => {
    const haystack = normalizeSearch(
      [
        attendee.name,
        attendee.email,
        attendee.phone,
        attendee.company,
        attendee.position,
        attendee.registrationType,
        attendee.qrCode,
        ...attendee.metadata.flatMap((item) => [item.key, item.value]),
      ].join(" "),
    );

    return haystack.includes(normalized);
  });
}

export function getSearchResults(attendees, query, minChars = 2) {
  const normalized = normalizeSearch(query);
  const results = normalized.length >= minChars ? filterAttendees(attendees, query) : [];

  return {
    normalizedQuery: normalized,
    hasEnoughChars: normalized.length >= minChars,
    results,
  };
}
