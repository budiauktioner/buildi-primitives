import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { Country } from "../geography/country.js";
import { ValidationErrorReason, ValidationResult } from "../validation/index.js";
import { invalidResult, validResult } from "../validation/validation-result.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

/**
 * Identifies the email service behind a domain when it belongs to a well-known
 * public (consumer/free) email provider.
 */
export const PublicEmailProvider = {
  Unknown: "Unknown",

  Gmail: "Gmail",
  Outlook: "Outlook",
  Yahoo: "Yahoo",
  ICloud: "ICloud",
  ProtonMail: "ProtonMail",
  Aol: "Aol",
  Gmx: "Gmx",
  MailCom: "MailCom",
  Yandex: "Yandex",
  Zoho: "Zoho",
  Tuta: "Tuta",
  Hey: "Hey",
  DuckDuckGoEmail: "DuckDuckGoEmail",
  SimpleLogin: "SimpleLogin",

  WebDe: "WebDe",
  MailRu: "MailRu",
  WirtualnaPolska: "WirtualnaPolska",
  Onet: "Onet",
  Interia: "Interia",
  Tlen: "Tlen",
  Seznam: "Seznam",
  Libero: "Libero",
  FreemailHu: "FreemailHu",
  Abv: "Abv",
  InboxLv: "InboxLv",
  UkrNet: "UkrNet",
  Naver: "Naver",

  Telia: "Telia",
  Tele2: "Tele2",
  Comhem: "Comhem",
  Bredbandsbolaget: "Bredbandsbolaget",
  Bredband2: "Bredband2",
  Ownit: "Ownit",
  Spray: "Spray",
  Passagen: "Passagen",
  Bahnhof: "Bahnhof",
  Glocalnet: "Glocalnet",

  OnlineNo: "OnlineNo",
  Kolumbus: "Kolumbus",
  Aland: "Aland",
} as const;

export type PublicEmailProvider = (typeof PublicEmailProvider)[keyof typeof PublicEmailProvider];

const MAX_INPUT_LENGTH = 320;

const PROVIDER_DOMAINS: Record<string, PublicEmailProvider> = {
  // International
  "gmail.com": PublicEmailProvider.Gmail,
  "googlemail.com": PublicEmailProvider.Gmail,

  "outlook.com": PublicEmailProvider.Outlook,
  "outlook.se": PublicEmailProvider.Outlook,
  "outlook.fr": PublicEmailProvider.Outlook,
  "outlook.co": PublicEmailProvider.Outlook,
  "hotmail.com": PublicEmailProvider.Outlook,
  "hotmail.se": PublicEmailProvider.Outlook,
  "hotmail.co.uk": PublicEmailProvider.Outlook,
  "hotmail.fr": PublicEmailProvider.Outlook,
  "hotmail.de": PublicEmailProvider.Outlook,
  "hotmail.no": PublicEmailProvider.Outlook,
  "hotmail.dk": PublicEmailProvider.Outlook,
  "hotmail.fi": PublicEmailProvider.Outlook,
  "hotmail.it": PublicEmailProvider.Outlook,
  "hotmail.es": PublicEmailProvider.Outlook,
  "live.com": PublicEmailProvider.Outlook,
  "live.se": PublicEmailProvider.Outlook,
  "live.fr": PublicEmailProvider.Outlook,
  "live.dk": PublicEmailProvider.Outlook,
  "live.co.uk": PublicEmailProvider.Outlook,
  "live.it": PublicEmailProvider.Outlook,
  "live.no": PublicEmailProvider.Outlook,
  "msn.com": PublicEmailProvider.Outlook,
  "windowslive.com": PublicEmailProvider.Outlook,

  "yahoo.com": PublicEmailProvider.Yahoo,
  "yahoo.se": PublicEmailProvider.Yahoo,
  "yahoo.co.uk": PublicEmailProvider.Yahoo,
  "yahoo.fr": PublicEmailProvider.Yahoo,
  "yahoo.de": PublicEmailProvider.Yahoo,
  "yahoo.it": PublicEmailProvider.Yahoo,
  "yahoo.es": PublicEmailProvider.Yahoo,
  "yahoo.gr": PublicEmailProvider.Yahoo,
  "yahoo.ro": PublicEmailProvider.Yahoo,
  "yahoo.co": PublicEmailProvider.Yahoo,
  "yahoo.no": PublicEmailProvider.Yahoo,
  "ymail.com": PublicEmailProvider.Yahoo,
  "rocketmail.com": PublicEmailProvider.Yahoo,

  "icloud.com": PublicEmailProvider.ICloud,
  "me.com": PublicEmailProvider.ICloud,
  "mac.com": PublicEmailProvider.ICloud,

  "protonmail.com": PublicEmailProvider.ProtonMail,
  "protonmail.ch": PublicEmailProvider.ProtonMail,
  "proton.me": PublicEmailProvider.ProtonMail,
  "pm.me": PublicEmailProvider.ProtonMail,

  "aol.com": PublicEmailProvider.Aol,
  "aol.se": PublicEmailProvider.Aol,

  "gmx.com": PublicEmailProvider.Gmx,
  "gmx.de": PublicEmailProvider.Gmx,
  "gmx.net": PublicEmailProvider.Gmx,
  "gmx.at": PublicEmailProvider.Gmx,

  "mail.com": PublicEmailProvider.MailCom,
  "email.com": PublicEmailProvider.MailCom,
  "post.com": PublicEmailProvider.MailCom,
  "europe.com": PublicEmailProvider.MailCom,
  "iname.com": PublicEmailProvider.MailCom,

  "yandex.com": PublicEmailProvider.Yandex,
  "yandex.ru": PublicEmailProvider.Yandex,

  "zoho.com": PublicEmailProvider.Zoho,

  "tuta.io": PublicEmailProvider.Tuta,
  "tutanota.com": PublicEmailProvider.Tuta,

  "hey.com": PublicEmailProvider.Hey,
  "duck.com": PublicEmailProvider.DuckDuckGoEmail,
  "simplelogin.com": PublicEmailProvider.SimpleLogin,

  // Regional (Europe)
  "web.de": PublicEmailProvider.WebDe,
  "mail.ru": PublicEmailProvider.MailRu,

  "wp.pl": PublicEmailProvider.WirtualnaPolska,
  "vp.pl": PublicEmailProvider.WirtualnaPolska,

  "onet.pl": PublicEmailProvider.Onet,
  "onet.eu": PublicEmailProvider.Onet,
  "op.pl": PublicEmailProvider.Onet,
  "o2.pl": PublicEmailProvider.Onet,
  "poczta.onet.pl": PublicEmailProvider.Onet,

  "interia.pl": PublicEmailProvider.Interia,
  "interia.eu": PublicEmailProvider.Interia,

  "tlen.pl": PublicEmailProvider.Tlen,

  "seznam.cz": PublicEmailProvider.Seznam,
  "libero.it": PublicEmailProvider.Libero,
  "freemail.hu": PublicEmailProvider.FreemailHu,
  "abv.bg": PublicEmailProvider.Abv,
  "inbox.lv": PublicEmailProvider.InboxLv,
  "ukr.net": PublicEmailProvider.UkrNet,
  "naver.com": PublicEmailProvider.Naver,

  // Swedish ISP / portal email
  "telia.com": PublicEmailProvider.Telia,
  "telia.se": PublicEmailProvider.Telia,
  "home.se": PublicEmailProvider.Telia,
  "swipnet.se": PublicEmailProvider.Telia,

  "tele2.se": PublicEmailProvider.Tele2,
  "comhem.se": PublicEmailProvider.Comhem,

  "bredband.net": PublicEmailProvider.Bredbandsbolaget,
  "bredbandsbolaget.se": PublicEmailProvider.Bredbandsbolaget,

  "bredband2.com": PublicEmailProvider.Bredband2,
  "ownit.nu": PublicEmailProvider.Ownit,
  "mail.se": PublicEmailProvider.Spray,
  "spray.se": PublicEmailProvider.Spray,
  "passagen.se": PublicEmailProvider.Passagen,
  "bahnhof.se": PublicEmailProvider.Bahnhof,
  "glocalnet.net": PublicEmailProvider.Glocalnet,

  // Nordic ISP
  "online.no": PublicEmailProvider.OnlineNo,
  "kolumbus.fi": PublicEmailProvider.Kolumbus,
  "aland.net": PublicEmailProvider.Aland,
};

const DOMAIN_CORRECTIONS: Record<string, string> = {
  // Gmail misspellings
  "gnail.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmsil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamail.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.vom": "gmail.com",
  "gmail.cim": "gmail.com",
  "gmail.comi": "gmail.com",
  "gmail.se": "gmail.com",
  "gmail.co": "gmail.com",

  // Hotmail / Outlook misspellings
  "hotmai.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotmsil.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "hotnail.com": "hotmail.com",
  "hitmail.com": "hotmail.com",
  "hptmail.com": "hotmail.com",
  "hmail.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.cpm": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.vom": "hotmail.com",
  "hotmail.cim": "hotmail.com",
  "hotmail.comm": "hotmail.com",
  "outlook.con": "outlook.com",
  "putlook.com": "outlook.com",

  // iCloud misspellings
  "icloude.com": "icloud.com",
  "icloud.se": "icloud.com",
  "icloud.co": "icloud.com",

  // Onet misspellings
  "02.pl": "o2.pl",
};

let tldCountryMapCache: Map<string, Country> | null = null;
function getTldCountryMap(): Map<string, Country> {
  if (tldCountryMapCache) return tldCountryMapCache;
  const m = new Map<string, Country>();
  for (const c of Country.all) {
    if (c.topLevelDomain) m.set(c.topLevelDomain.toLowerCase(), c);
  }
  tldCountryMapCache = m;
  return m;
}

const EMAIL_PATTERN =
  /^(?!\.)[a-zA-Z0-9_](?!.*\.\.)(?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9_%+-])?@(?!-)[a-zA-Z0-9-]+(?<!-)(?:\.(?!-)[a-zA-Z0-9-]+(?<!-))*\.[a-zA-Z]{2,}$/;

const SCAN_PATTERN =
  /(?<![\w.@])(?!\.)[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9_%+-])?@(?!-)[a-zA-Z0-9-]+(?:\.(?!-)[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(?![\w@])/gu;

/** Convert a Unicode domain to its ASCII (Punycode) form. Returns null if invalid. */
function domainToAscii(domain: string): string | null {
  try {
    const ascii = new URL("http://" + domain).hostname;
    return ascii;
  } catch {
    return null;
  }
}

/**
 * An email address (e-postadress). Normalization trims whitespace and lowercases the entire
 * address — including the local part — as a pragmatic interoperability and deduplication choice.
 */
export class EmailAddress {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "Email Address",
    localizedName: "E-postadress",
    emoji: "\u{1F4E7}",
    sources: Object.freeze([
      "https://datatracker.ietf.org/doc/html/rfc5321#section-2.3.11",
      "https://datatracker.ietf.org/doc/html/rfc5321",
    ]),
  });

  readonly value: string;
  readonly localPart: string;
  readonly domain: string;
  readonly domainAscii: string;
  readonly topLevelDomain: string;
  readonly country: Country | null;
  readonly provider: PublicEmailProvider | null;
  readonly originalDomain: string | null;

  get isPublicEmailProvider(): boolean {
    return this.provider != null;
  }

  get isInternationalizedDomain(): boolean {
    return this.domain !== this.domainAscii;
  }

  get wasCorrected(): boolean {
    return this.originalDomain != null;
  }

  private constructor(
    value: string,
    localPart: string,
    domain: string,
    domainAscii: string,
    tld: string,
    country: Country | null,
    provider: PublicEmailProvider | null,
    originalDomain: string | null,
  ) {
    this.value = value;
    this.localPart = localPart;
    this.domain = domain;
    this.domainAscii = domainAscii;
    this.topLevelDomain = tld;
    this.country = country;
    this.provider = provider;
    this.originalDomain = originalDomain;
  }

  /**
   * Attempts to parse and normalize an email address.
   *
   * When `tryCorrectTypos` is `true`, common domain misspellings such as
   * `gmail.con`, `gnail.com`, or `hotmil.com` are corrected automatically.
   * The original domain is preserved in `originalDomain`. Typo correction is
   * opt-in and should only be used when silent correction is acceptable.
   */
  static tryParse(
    input: string | null | undefined,
    options?: { tryCorrectTypos?: boolean },
  ): EmailAddress | null {
    if (input == null || input.trim() === "") return null;

    let sanitized = sanitizeInput(input);

    const ltIndex = sanitized.indexOf("<");
    if (ltIndex >= 0) {
      const gtIndex = sanitized.indexOf(">", ltIndex + 1);
      if (gtIndex > ltIndex) sanitized = sanitized.slice(ltIndex + 1, gtIndex);
    }

    sanitized = sanitized.trim();
    if (sanitized.toLowerCase().startsWith("mailto:")) {
      sanitized = sanitized.slice(7);
      const qIndex = sanitized.indexOf("?");
      if (qIndex >= 0) sanitized = sanitized.slice(0, qIndex);
    }

    let normalized = sanitized.replace(/ /g, "").toLowerCase();
    if (normalized.endsWith(".")) normalized = normalized.slice(0, -1);

    if (normalized.length === 0 || normalized.length > MAX_INPUT_LENGTH) return null;

    const atIndex = normalized.lastIndexOf("@");
    if (atIndex <= 0 || atIndex === normalized.length - 1) return null;

    const localPart = normalized.slice(0, atIndex);
    let domain = normalized.slice(atIndex + 1);

    let domainForValidation = domain;
    if (hasNonAscii(domain)) {
      // Reject if non-ASCII characters include non-letters
      for (const ch of domain) {
        const cp = ch.codePointAt(0)!;
        if (cp > 127 && !isUnicodeLetter(ch)) return null;
      }
      const ascii = domainToAscii(domain);
      if (ascii == null) return null;
      domainForValidation = ascii;
    }

    const emailForValidation = `${localPart}@${domainForValidation}`;
    if (!EMAIL_PATTERN.test(emailForValidation)) return null;

    let originalDomain: string | null = null;
    if (options?.tryCorrectTypos === true) {
      const corrected = DOMAIN_CORRECTIONS[domain];
      if (corrected != null) {
        originalDomain = domain;
        domain = corrected;
        normalized = `${localPart}@${domain}`;
        domainForValidation = domain;
      }
    }

    const lastDot = domain.lastIndexOf(".");
    const tld = lastDot >= 0 ? domain.slice(lastDot + 1) : "";

    const country = tld.length > 0 ? (getTldCountryMap().get("." + tld) ?? null) : null;
    const provider = PROVIDER_DOMAINS[domain] ?? null;

    return new EmailAddress(
      normalized,
      localPart,
      domain,
      domainForValidation,
      tld,
      country,
      provider,
      originalDomain,
    );
  }

  static parse(input: string, options?: { tryCorrectTypos?: boolean }): EmailAddress {
    const r = EmailAddress.tryParse(input, options);
    if (r === null) throw new Error("Invalid email address.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return EmailAddress.tryParse(input) !== null;
  }

  /**
   * Returns a `ValidationResult` describing why the input is invalid,
   * or a valid result when the input is well-formed.
   */
  static validate(input: string | null | undefined): ValidationResult {
    if (input == null || input.trim() === "") {
      return invalidResult(
        input,
        ValidationErrorReason.InputIsEmpty,
        "Input is empty or whitespace.",
        "Värdet är tomt.",
      );
    }

    let sanitized = sanitizeInput(input);

    const ltIndex = sanitized.indexOf("<");
    if (ltIndex >= 0) {
      const gtIndex = sanitized.indexOf(">", ltIndex + 1);
      if (gtIndex > ltIndex) sanitized = sanitized.slice(ltIndex + 1, gtIndex);
    }

    sanitized = sanitized.trim();
    if (sanitized.toLowerCase().startsWith("mailto:")) {
      sanitized = sanitized.slice(7);
      const qIndex = sanitized.indexOf("?");
      if (qIndex >= 0) sanitized = sanitized.slice(0, qIndex);
    }

    let normalized = sanitized.replace(/ /g, "").toLowerCase();
    if (normalized.endsWith(".")) normalized = normalized.slice(0, -1);

    if (normalized.length === 0 || normalized.length > MAX_INPUT_LENGTH) {
      return invalidResult(
        input,
        ValidationErrorReason.InputTooLong,
        "Email address is too long.",
        "E-postadressen är för lång.",
      );
    }

    const atIndex = normalized.lastIndexOf("@");
    if (atIndex <= 0 || atIndex === normalized.length - 1) {
      return invalidResult(
        input,
        ValidationErrorReason.MissingAtSign,
        "Email address must contain an @ sign with text before and after.",
        "E-postadressen måste innehålla ett @-tecken med text före och efter.",
      );
    }

    const localPart = normalized.slice(0, atIndex);
    const domain = normalized.slice(atIndex + 1);
    let domainForValidation = domain;

    if (hasNonAscii(domain)) {
      for (const ch of domain) {
        const cp = ch.codePointAt(0)!;
        if (cp > 127 && !isUnicodeLetter(ch)) {
          return invalidResult(
            input,
            ValidationErrorReason.InvalidDomain,
            "Email address has an invalid domain.",
            "E-postadressen har en ogiltig domän.",
          );
        }
      }
      const ascii = domainToAscii(domain);
      if (ascii == null) {
        return invalidResult(
          input,
          ValidationErrorReason.InvalidDomain,
          "Email address has an invalid domain.",
          "E-postadressen har en ogiltig domän.",
        );
      }
      domainForValidation = ascii;
    }

    const emailForValidation = `${localPart}@${domainForValidation}`;
    if (!EMAIL_PATTERN.test(emailForValidation)) {
      return invalidResult(
        input,
        ValidationErrorReason.InvalidFormat,
        "Invalid email address format.",
        "Ogiltigt format för e-postadress.",
      );
    }

    return validResult(input);
  }

  /**
   * Returns the normalized email in lowercase, e.g. `user@example.com`.
   * Returns `null` for invalid or empty input.
   */
  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean; tryCorrectTypos?: boolean },
  ): string | null {
    const r = EmailAddress.tryParse(
      input,
      options?.tryCorrectTypos != null ? { tryCorrectTypos: options.tryCorrectTypos } : undefined,
    );
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  /** Returns the normalized email, e.g. `user@example.com`, or `null` if invalid. */
  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean; tryCorrectTypos?: boolean },
  ): string | null {
    return EmailAddress.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && EmailAddress.normalize(input) === input;
  }

  /** Returns the normalized email address, e.g. `user@example.com`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the normalized email address, e.g. `user@example.com`. */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the email with the domain in ASCII (Punycode) form, e.g.
   * `user@xn--rneholm-b1a.com`. Same as `toString()` for ASCII domains.
   */
  toAsciiString(): string {
    return this.isInternationalizedDomain ? `${this.localPart}@${this.domainAscii}` : this.value;
  }

  /**
   * Scans unstructured text for potential email addresses. Heuristic; may include false positives.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<EmailAddress>[] {
    if (!text) return [];
    const out: TextCandidate<EmailAddress>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const r = EmailAddress.tryParse(m[0]);
      if (!r) continue;
      out.push(
        new TextCandidate<EmailAddress>({
          startIndex: m.index,
          length: m[0].length,
          originalText: m[0],
          typeName: "EmailAddress",
          category: TextCandidateCategory.Contact,
          normalizedForm: r.toNormalizedString(),
          formattedForm: r.toString(),
          maskedForm: maskEmailAddressInternal(r, false),
          confidence: TextMatchConfidence.High,
          value: r,
        }),
      );
    }
    return out;
  }

  equals(other: EmailAddress | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: EmailAddress | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }
}

function hasNonAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 127) return true;
  }
  return false;
}

const UNICODE_LETTER = /\p{L}/u;
function isUnicodeLetter(ch: string): boolean {
  return UNICODE_LETTER.test(ch);
}

/**
 * Returns a masked email showing the first character of the local part and the full domain,
 * e.g. `peter@example.com` → `p***@example.com`.
 * Set `maskDomain` to `true` to also mask the domain label: `p***@e***.com`.
 */
export function maskEmailAddress(email: EmailAddress, options?: { maskDomain?: boolean }): string {
  return maskEmailAddressInternal(email, options?.maskDomain === true);
}

function maskEmailAddressInternal(email: EmailAddress, maskDomain: boolean): string {
  const local = email.localPart;
  const maskedLocal =
    local.length <= 1 ? local : local[0] + "*".repeat(Math.min(local.length - 1, 3));

  if (maskDomain) {
    const domain = email.domain;
    const firstDot = domain.indexOf(".");
    if (firstDot > 0) {
      const label = domain.slice(0, firstDot);
      const suffix = domain.slice(firstDot);
      const maskedDomain =
        label.length <= 1 ? label : label[0] + "*".repeat(Math.min(label.length - 1, 3));
      return `${maskedLocal}@${maskedDomain}${suffix}`;
    }
  }

  return `${maskedLocal}@${email.domain}`;
}

/** Returns a `mailto:` URI, e.g. `mailto:info@example.com`. */
export function toMailtoUri(email: EmailAddress): string {
  return `mailto:${email.toNormalizedString()}`;
}
