/** Normalize a to-one PostgREST relation without choosing an arbitrary recipient. */
export function oneRelatedRow<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return value;
  if (value.length > 1) throw new Error('Unexpected multiple rows in a to-one relation');
  return value[0] ?? null;
}
