import { TextCandidateCategory } from "./text-candidate-category.js";
import { TextMatchConfidence } from "./text-match-confidence.js";

/**
 * A potential match of a structured type found in unstructured text.
 *
 * Text scanning is heuristic-based. Candidates may be false positives, and
 * valid occurrences may be missed. No guarantee is made that the matched text
 * actually represents the identified type in its original context.
 */
export class TextCandidate<T = unknown> {
  /** Zero-based start position in the scanned text. */
  readonly startIndex: number;
  /** Number of characters in the original matched span. */
  readonly length: number;
  /** The raw substring from the input text that was matched. */
  readonly originalText: string;
  /**
   * Short type name, e.g. `EmailAddress` or `SwedishPersonalIdentityNumber`.
   */
  readonly typeName: string;
  /** Broad category of the matched type. */
  readonly category: TextCandidateCategory;
  /** Machine-comparable canonical form of the matched value. */
  readonly normalizedForm: string;
  /** Human-readable display form of the matched value. */
  readonly formattedForm: string;
  /**
   * Display form with sensitive content masked (e.g. `990807-****`).
   * Produced by the type's `toMaskedString()` helper.
   */
  readonly maskedForm: string;
  /** Heuristic confidence level. */
  readonly confidence: TextMatchConfidence;
  /** The successfully parsed instance of the matched type. */
  readonly value: T;

  constructor(opts: {
    startIndex: number;
    length: number;
    originalText: string;
    typeName: string;
    category: TextCandidateCategory;
    normalizedForm: string;
    formattedForm: string;
    maskedForm: string;
    confidence: TextMatchConfidence;
    value: T;
  }) {
    this.startIndex = opts.startIndex;
    this.length = opts.length;
    this.originalText = opts.originalText;
    this.typeName = opts.typeName;
    this.category = opts.category;
    this.normalizedForm = opts.normalizedForm;
    this.formattedForm = opts.formattedForm;
    this.maskedForm = opts.maskedForm;
    this.confidence = opts.confidence;
    this.value = opts.value;
  }

  /** Exclusive end position (`startIndex + length`). */
  get endIndex(): number {
    return this.startIndex + this.length;
  }

  /** Returns `true` if this candidate's span overlaps with `other`. */
  overlaps(other: TextCandidate): boolean {
    return this.startIndex < other.endIndex && other.startIndex < this.endIndex;
  }

  /** Returns `true` if this candidate's span fully contains `other`. */
  contains(other: TextCandidate): boolean {
    return this.startIndex <= other.startIndex && this.endIndex >= other.endIndex;
  }
}
