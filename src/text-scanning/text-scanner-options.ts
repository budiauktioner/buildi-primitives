import { TextCandidateCategory } from "./text-candidate-category.js";
import { TextMatchConfidence } from "./text-match-confidence.js";

/**
 * Configuration for the text scanner controlling which categories to scan and
 * the minimum confidence threshold.
 */
export interface TextScannerOptions {
  /**
   * When set, only categories in this set are scanned. Mutually exclusive
   * with {@link excludeCategories}.
   */
  includeCategories?: ReadonlySet<TextCandidateCategory>;
  /**
   * When set, categories in this set are skipped. Ignored if
   * {@link includeCategories} is set.
   */
  excludeCategories?: ReadonlySet<TextCandidateCategory>;
  /**
   * Candidates below this confidence level are discarded from results.
   * Defaults to {@link TextMatchConfidence.Low} (keep everything).
   */
  minimumConfidence?: TextMatchConfidence;
}

/** @internal */
export function shouldScan(options: TextScannerOptions, category: TextCandidateCategory): boolean {
  if (options.includeCategories) return options.includeCategories.has(category);
  if (options.excludeCategories) return !options.excludeCategories.has(category);
  return true;
}
