export function getProductStats(attendees) {
  const relevant = attendees.filter(
    (attendee) => attendee.status === "paid" || attendee.status === "verified",
  );
  const grouped = new Map();

  for (const attendee of relevant) {
    const key = attendee.registrationType || "sin tipo";
    const current = grouped.get(key) || { label: key, total: 0, verified: 0 };
    current.total += 1;
    if (attendee.status === "verified") {
      current.verified += 1;
    }
    grouped.set(key, current);
  }

  const byType = [...grouped.values()]
    .sort((a, b) => a.label.localeCompare(b.label, "es"))
    .map((entry) => ({
      ...entry,
      percentage: entry.total
        ? Math.round((entry.verified / entry.total) * 100)
        : 0,
    }));

  return {
    totalPaidOrVerified: relevant.length,
    totalVerified: relevant.filter((attendee) => attendee.status === "verified")
      .length,
    byType,
  };
}
