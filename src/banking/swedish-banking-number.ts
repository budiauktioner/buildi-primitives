import { sanitizeInput } from "../internal/input-sanitization.js";
import { Iban } from "./iban.js";
import { Bic } from "./bic.js";
import { SwedishBankgiroNumber } from "./swedish-bankgiro-number.js";
import { SwedishPostgiroNumber } from "./swedish-postgiro-number.js";
import { SwedishOcrReferenceNumber } from "./swedish-ocr-reference-number.js";
import { SwedishBankAccount } from "./swedish-bank-account.js";

export const SwedishBankingNumberType = {
  Unknown: "Unknown",
  SwedishBankgiroNumber: "SwedishBankgiroNumber",
  SwedishPostgiroNumber: "SwedishPostgiroNumber",
  SwedishOcrReferenceNumber: "SwedishOcrReferenceNumber",
  Iban: "Iban",
  SwedishBankAccount: "SwedishBankAccount",
  Bic: "Bic",
} as const;
export type SwedishBankingNumberType =
  (typeof SwedishBankingNumberType)[keyof typeof SwedishBankingNumberType];

/**
 * Parsed banking identifier result from the unified banking parser.
 * The type field indicates which typed value (if any) was successfully parsed.
 */
export class SwedishBankingNumber {
  readonly type: SwedishBankingNumberType;
  readonly normalizedValue: string;

  readonly swedishBankgiroNumber: SwedishBankgiroNumber | null;
  readonly swedishPostgiroNumber: SwedishPostgiroNumber | null;
  readonly swedishOcrReferenceNumber: SwedishOcrReferenceNumber | null;
  readonly iban: Iban | null;
  readonly swedishBankAccount: SwedishBankAccount | null;
  readonly bic: Bic | null;

  /** @internal */
  constructor(init: {
    type: SwedishBankingNumberType;
    normalizedValue: string;
    swedishBankgiroNumber?: SwedishBankgiroNumber | null;
    swedishPostgiroNumber?: SwedishPostgiroNumber | null;
    swedishOcrReferenceNumber?: SwedishOcrReferenceNumber | null;
    iban?: Iban | null;
    swedishBankAccount?: SwedishBankAccount | null;
    bic?: Bic | null;
  }) {
    this.type = init.type;
    this.normalizedValue = init.normalizedValue;
    this.swedishBankgiroNumber = init.swedishBankgiroNumber ?? null;
    this.swedishPostgiroNumber = init.swedishPostgiroNumber ?? null;
    this.swedishOcrReferenceNumber = init.swedishOcrReferenceNumber ?? null;
    this.iban = init.iban ?? null;
    this.swedishBankAccount = init.swedishBankAccount ?? null;
    this.bic = init.bic ?? null;
  }

  static unknown(): SwedishBankingNumber {
    return new SwedishBankingNumber({
      type: SwedishBankingNumberType.Unknown,
      normalizedValue: "",
    });
  }
}

const MAX_INPUT_LENGTH = 50;
const BANKGIRO_PATTERN = /^\s*\d{3,4}\s*-\s*\d{4}\s*$/;
const PLUSGIRO_PATTERN = /^\s*\d{1,7}\s*-\s*\d\s*$/;

const TYPE_PREFIXES: readonly [string, SwedishBankingNumberType][] = [
  ["Bankgiro ", SwedishBankingNumberType.SwedishBankgiroNumber],
  ["Plusgiro ", SwedishBankingNumberType.SwedishPostgiroNumber],
  ["Postgiro ", SwedishBankingNumberType.SwedishPostgiroNumber],
  ["BG ", SwedishBankingNumberType.SwedishBankgiroNumber],
  ["PG ", SwedishBankingNumberType.SwedishPostgiroNumber],
];

/**
 * A unified parser for common banking identifiers used in Swedish payment flows.
 * Attempts to classify input as Bankgiro, Plusgiro, OCR reference, BIC, IBAN,
 * or Swedish bank account.
 */
export class SwedishBankingNumberParser {
  static tryParse(input: string | null | undefined): SwedishBankingNumber | null {
    if (input == null || input.trim() === "") return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length > MAX_INPUT_LENGTH) return null;

    // 0. Explicit type prefix
    const { hintedType, payload } = detectTypePrefix(trimmed);
    if (hintedType === SwedishBankingNumberType.SwedishBankgiroNumber) {
      const bg = SwedishBankgiroNumber.tryParse(payload);
      if (bg !== null) {
        return new SwedishBankingNumber({
          type: SwedishBankingNumberType.SwedishBankgiroNumber,
          normalizedValue: bg.formatted,
          swedishBankgiroNumber: bg,
        });
      }
      return null;
    }
    if (hintedType === SwedishBankingNumberType.SwedishPostgiroNumber) {
      const pg = SwedishPostgiroNumber.tryParse(payload);
      if (pg !== null) {
        return new SwedishBankingNumber({
          type: SwedishBankingNumberType.SwedishPostgiroNumber,
          normalizedValue: pg.formatted,
          swedishPostgiroNumber: pg,
        });
      }
      return null;
    }

    // 1. IBAN — distinctive country letters + check digits
    if (containsLetters(trimmed)) {
      const iban = Iban.tryParse(trimmed);
      if (iban !== null) {
        return new SwedishBankingNumber({
          type: SwedishBankingNumberType.Iban,
          normalizedValue: iban.value,
          iban,
        });
      }
    }

    // 2. BIC/SWIFT — letter heavy
    if (containsLetters(trimmed)) {
      const bic = Bic.tryParse(trimmed);
      if (bic !== null) {
        return new SwedishBankingNumber({
          type: SwedishBankingNumberType.Bic,
          normalizedValue: bic.code,
          bic,
        });
      }
    }

    // 3. Explicit hyphenated formats
    if (BANKGIRO_PATTERN.test(trimmed)) {
      const bg = SwedishBankgiroNumber.tryParse(trimmed);
      if (bg !== null) {
        return new SwedishBankingNumber({
          type: SwedishBankingNumberType.SwedishBankgiroNumber,
          normalizedValue: bg.formatted,
          swedishBankgiroNumber: bg,
        });
      }
    }
    if (PLUSGIRO_PATTERN.test(trimmed)) {
      const pg = SwedishPostgiroNumber.tryParse(trimmed);
      if (pg !== null) {
        return new SwedishBankingNumber({
          type: SwedishBankingNumberType.SwedishPostgiroNumber,
          normalizedValue: pg.formatted,
          swedishPostgiroNumber: pg,
        });
      }
    }

    // 4. Longer Swedish bank account numbers (more specific than OCR)
    const account = SwedishBankAccount.tryParse(trimmed);
    if (account !== null) {
      return new SwedishBankingNumber({
        type: SwedishBankingNumberType.SwedishBankAccount,
        normalizedValue: account.toNormalizedString(),
        swedishBankAccount: account,
      });
    }

    // 5. Bankgiro before Plusgiro
    const bg = SwedishBankgiroNumber.tryParse(trimmed);
    if (bg !== null) {
      return new SwedishBankingNumber({
        type: SwedishBankingNumberType.SwedishBankgiroNumber,
        normalizedValue: bg.formatted,
        swedishBankgiroNumber: bg,
      });
    }
    const pg = SwedishPostgiroNumber.tryParse(trimmed);
    if (pg !== null) {
      return new SwedishBankingNumber({
        type: SwedishBankingNumberType.SwedishPostgiroNumber,
        normalizedValue: pg.formatted,
        swedishPostgiroNumber: pg,
      });
    }

    // 6. OCR last (high false-positive rate)
    const ocr = SwedishOcrReferenceNumber.tryParse(trimmed);
    if (ocr !== null) {
      return new SwedishBankingNumber({
        type: SwedishBankingNumberType.SwedishOcrReferenceNumber,
        normalizedValue: ocr.value,
        swedishOcrReferenceNumber: ocr,
      });
    }

    return null;
  }

  static parse(input: string): SwedishBankingNumber {
    const r = SwedishBankingNumberParser.tryParse(input);
    if (r === null) throw new Error("Could not parse input as a known banking number.");
    return r;
  }
}

function detectTypePrefix(input: string): {
  hintedType: SwedishBankingNumberType;
  payload: string;
} {
  const lower = input.toLowerCase();
  for (const [prefix, type] of TYPE_PREFIXES) {
    const lp = prefix.toLowerCase();
    if (lower.startsWith(lp)) {
      const payload = input.slice(prefix.length).trim();
      if (payload.length > 0) return { hintedType: type, payload };
    }
  }
  return { hintedType: SwedishBankingNumberType.Unknown, payload: input };
}

function containsLetters(input: string): boolean {
  return /\p{L}/u.test(input);
}
