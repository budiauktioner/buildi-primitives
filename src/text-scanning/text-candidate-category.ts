/**
 * Broad classification of a {@link TextCandidate} for filtering and selective
 * masking.
 */
export const TextCandidateCategory = {
  PersonalIdentifier: "PersonalIdentifier",
  OrganizationIdentifier: "OrganizationIdentifier",
  Financial: "Financial",
  Contact: "Contact",
  Vehicle: "Vehicle",
  Property: "Property",
  Product: "Product",
  Geography: "Geography",
  Measurement: "Measurement",
} as const;

export type TextCandidateCategory =
  (typeof TextCandidateCategory)[keyof typeof TextCandidateCategory];
