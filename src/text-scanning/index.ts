/**
 * Text scanning entry point.
 *
 * Importing this module registers every built-in `findCandidatesInText`
 * implementation on {@link defaultTextScanner}. The registration lives here
 * rather than in the package root so that consumers importing only a value
 * object (for example via `@budiauktioner/buildi-primitives/organization`) do
 * not pull the whole scannable-type graph into their bundle.
 */

import { registerDefaultTextScanners } from "../register-default-text-scanners.js";

registerDefaultTextScanners();

export { registerDefaultTextScanners } from "../register-default-text-scanners.js";
export { TextCandidate } from "./text-candidate.js";
export { TextCandidateCategory } from "./text-candidate-category.js";
export { TextMatchConfidence } from "./text-match-confidence.js";
export {
  TextScanner,
  defaultTextScanner,
  type TextScanFunction,
  type RegisteredScanner,
} from "./text-scanner.js";
export { type TextScannerOptions } from "./text-scanner-options.js";
export { TextScanResult } from "./text-scan-result.js";
