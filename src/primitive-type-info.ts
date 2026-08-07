/**
 * Metadata describing a primitive value-object type — its human-readable
 * names, representative emoji, and reference source URLs.
 *
 * The .NET equivalent is `Buildi.Primitives.PrimitiveTypeInfo` (a `record`).
 */
export interface PrimitiveTypeInfo {
  readonly englishName: string;
  readonly localizedName: string;
  readonly emoji: string;
  readonly sources: readonly string[];
}
