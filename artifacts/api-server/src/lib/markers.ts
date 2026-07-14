/**
 * Generic helpers for reading and writing JSON marker lines embedded in event.description.
 *
 * Markers follow the pattern:  __MARKER_NAME__:<json>\n
 * Each marker occupies exactly one line. Multiple markers can coexist in the same description.
 */

/**
 * Read a JSON-encoded value from a marker line in an event description.
 * Returns null if the marker is absent or the JSON is unparseable.
 */
export function readMarker<T>(description: string | null | undefined, marker: string): T | null {
  if (!description) return null;
  const idx = description.indexOf(marker);
  if (idx === -1) return null;
  try {
    const raw = description.slice(idx + marker.length).split("\n")[0].trim();
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Read a plain string value from a marker line (no JSON parsing).
 * Returns null if absent or empty.
 */
export function readMarkerString(description: string | null | undefined, marker: string): string | null {
  if (!description) return null;
  const idx = description.indexOf(marker);
  if (idx === -1) return null;
  return description.slice(idx + marker.length).split("\n")[0].trim() || null;
}

/**
 * Write (or replace) a JSON marker line in an event description.
 * Preserves all other lines, including other markers that follow.
 */
export function writeMarker<T>(description: string | null | undefined, marker: string, value: T): string {
  const desc = description ?? "";
  const newLine = marker + JSON.stringify(value);
  const idx = desc.indexOf(marker);

  if (idx === -1) {
    // Not present yet — append after any existing content
    return (desc.trimEnd() ? desc.trimEnd() + "\n" : "") + newLine;
  }

  // Replace only this marker's line, preserving everything after it
  const lineEnd = desc.indexOf("\n", idx);
  if (lineEnd === -1) {
    // Marker is the last line
    return desc.slice(0, idx).trimEnd() + (desc.slice(0, idx).trimEnd() ? "\n" : "") + newLine;
  }
  return desc.slice(0, idx) + newLine + desc.slice(lineEnd);
}
