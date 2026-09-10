/**
 * Unified Date and Time Utilities for KWI Unleashed.
 * Strictly uses 12-hour time system with AM and PM.
 */

/**
 * Safely parse any date input (ISO string, SQLite string, timestamp, or Date)
 * into a valid JavaScript Date object. Returns null if invalid.
 */
export function parseDateSafe(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  let s = String(input).trim();
  if (!s) return null;

  // Handle SQLite timestamp format like "2026-09-10 17:41:22.038286"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    s = s.replace(" ", "T");
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a timestamp into 12-hour time with AM/PM (e.g., "07:25 PM", "11:42 AM").
 */
export function formatTime12Hour(input) {
  const d = parseDateSafe(input);
  if (!d) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a timestamp into a standard human-readable date (e.g., "Sep 10, 2026").
 */
export function formatDate(input) {
  const d = parseDateSafe(input);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a timestamp into date and 12-hour time with AM/PM
 * (e.g., "Sep 10, 2026 at 07:25 PM").
 */
export function formatDateTime12Hour(input) {
  const d = parseDateSafe(input);
  if (!d) return "—";
  const dateStr = formatDate(d);
  const timeStr = formatTime12Hour(d);
  return `${dateStr} at ${timeStr}`;
}

/**
 * Compact date and 12-hour time with AM/PM
 * (e.g., "Sep 10, 2026, 07:25 PM").
 */
export function formatDateTimeCompact(input) {
  const d = parseDateSafe(input);
  if (!d) return "—";
  const dateStr = formatDate(d);
  const timeStr = formatTime12Hour(d);
  return `${dateStr}, ${timeStr}`;
}

/**
 * Returns a 12-hour time greeting string based on current local hour.
 */
export function getTimeGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good morning,";
  if (hr < 17) return "Good afternoon,";
  return "Good evening,";
}
