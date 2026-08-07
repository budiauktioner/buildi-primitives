import { TextCandidate } from "./text-candidate.js";
import { TextCandidateCategory } from "./text-candidate-category.js";
import { TextMatchConfidence } from "./text-match-confidence.js";
import { TextScanResult } from "./text-scan-result.js";
import { TextScannerOptions, shouldScan } from "./text-scanner-options.js";

/**
 * A scan function returns all candidates found in `text` for one type.
 */
export type TextScanFunction<T = unknown> = (text: string) => readonly TextCandidate<T>[];

/**
 * A registration that wires one type's `findCandidatesInText` function into a
 * scanner.
 */
export interface RegisteredScanner<T = unknown> {
  readonly typeName: string;
  readonly category: TextCandidateCategory;
  readonly scan: TextScanFunction<T>;
}

/**
 * Aggregate scanner that runs every registered type's `findCandidatesInText`
 * and merges the results.
 *
 * In contrast to the .NET `TextScanner` (which hard-codes a fixed list of
 * types in its constructor), the JS port uses a registry. Type modules call
 * {@link TextScanner.register} (or push to {@link defaultTextScanner}) so the
 * scanner is extensible without editing this file.
 */
export class TextScanner {
  private readonly registrations: RegisteredScanner[] = [];

  /**
   * Registers a type's scan function. Called once per type, normally at
   * module load time.
   */
  register<T>(reg: RegisteredScanner<T>): void {
    this.registrations.push(reg as unknown as RegisteredScanner);
  }

  /** Currently registered scanners. Mainly useful for tests. */
  get registered(): readonly RegisteredScanner[] {
    return this.registrations;
  }

  /**
   * Scans `text` for all registered types matching the given `options`.
   * Returns an aggregate result with overlap resolution.
   */
  scan(text: string, options: TextScannerOptions = {}): TextScanResult {
    const minConfidence = options.minimumConfidence ?? TextMatchConfidence.Low;
    const candidates: TextCandidate[] = [];
    for (const reg of this.registrations) {
      if (!shouldScan(options, reg.category)) continue;
      const found = reg.scan(text);
      for (const c of found) {
        if (c.confidence < minConfidence) continue;
        candidates.push(c);
      }
    }
    return new TextScanResult(candidates);
  }
}

/**
 * The default scanner used by `@budiauktioner/buildi-primitives`. Type modules with
 * `findCandidatesInText` register themselves with this instance at module
 * load time. Applications that need an isolated scanner can construct their
 * own {@link TextScanner}.
 */
export const defaultTextScanner = new TextScanner();
