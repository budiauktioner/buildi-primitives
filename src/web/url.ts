import { PrimitiveTypeInfo } from "../primitive-type-info.js";
import { sanitizeInput } from "../internal/input-sanitization.js";
import { Country } from "../geography/country.js";
import { TextCandidateCategory } from "../text-scanning/text-candidate-category.js";
import { TextCandidate } from "../text-scanning/text-candidate.js";
import { TextMatchConfidence } from "../text-scanning/text-match-confidence.js";

const MAX_INPUT_LENGTH = 2048;

const RESERVED_TLDS = new Set(["test", "example", "invalid", "localhost"]);
const RESERVED_DOMAINS = new Set(["example.com", "example.org", "example.net"]);

const DEFAULT_PORTS: Record<string, number> = {
  http: 80,
  https: 443,
  ftp: 21,
  ws: 80,
  wss: 443,
  gopher: 70,
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

const SCAN_PATTERN =
  /(?:[a-zA-Z][\w+.-]*:\/\/[^\s<>"']+|(?:mailto|tel|sms|callto):[^\s<>"']+|\bwww\.[^\s<>"']+)/gi;

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const ABSOLUTE_URI = /^([a-zA-Z][a-zA-Z0-9+\-.]*):/;
const HIERARCHICAL_RE = /^([a-zA-Z][a-zA-Z0-9+\-.]*):\/\//;

interface UrlParts {
  value: string;
  scheme: string;
  host: string;
  port: number | null;
  path: string;
  query: string | null;
  fragment: string | null;
  tld: string;
  country: Country | null;
  isExample: boolean;
  isIp: boolean;
}

/**
 * A URL or URI (`webbadress`). Accepts any valid URI scheme — `http`, `https`,
 * `mailto`, `tel`, `ssh`, custom schemes, etc. Bare domains like `example.com`
 * are auto-prefixed with `https://`. Reserved example/test domains per
 * RFC 2606 / RFC 6761 are flagged via `isExampleDomain`.
 */
export class Url {
  static readonly typeInfo: PrimitiveTypeInfo = Object.freeze({
    englishName: "URL",
    localizedName: "Webbadress",
    emoji: "\u{1F517}",
    sources: Object.freeze([
      "https://datatracker.ietf.org/doc/html/rfc3986",
      "https://datatracker.ietf.org/doc/html/rfc2606",
      "https://datatracker.ietf.org/doc/html/rfc6761",
    ]),
  });

  /** The normalized URL string, e.g. `https://www.example.com/path`. */
  readonly value: string;
  /** The URI scheme without `://`, e.g. `https`. */
  readonly scheme: string;
  /** The full hostname, e.g. `www.example.com`. Empty for non-hierarchical URIs. */
  readonly host: string;
  /** Explicit port, or `null` when the default port for the scheme is used. */
  readonly port: number | null;
  /** The path component, e.g. `/path/to/page`. Root paths are `/`. */
  readonly path: string;
  /** Query string without `?`, or `null` when absent. */
  readonly query: string | null;
  /** Fragment without `#`, or `null` when absent. */
  readonly fragment: string | null;
  /** Top-level domain without the dot, e.g. `com`, `se`. */
  readonly topLevelDomain: string;
  /** Country associated with a country-code TLD, or `null` for generic TLDs. */
  readonly country: Country | null;
  /** True when the scheme is `https`. */
  readonly isSecure: boolean;
  /** True when the host is a reserved example/test domain (RFC 2606 / RFC 6761). */
  readonly isExampleDomain: boolean;
  /** True when the host is an IP address. */
  readonly isIpAddress: boolean;

  private constructor(p: UrlParts) {
    this.value = p.value;
    this.scheme = p.scheme;
    this.host = p.host;
    this.port = p.port;
    this.path = p.path;
    this.query = p.query;
    this.fragment = p.fragment;
    this.topLevelDomain = p.tld;
    this.country = p.country;
    this.isSecure = p.scheme === "https";
    this.isExampleDomain = p.isExample;
    this.isIpAddress = p.isIp;
  }

  static tryParse(input: string | null | undefined): Url | null {
    if (input == null || input.trim() === "") return null;

    const trimmed = sanitizeInput(input).trim();
    if (trimmed.length === 0 || trimmed.length > MAX_INPUT_LENGTH) return null;

    let parsed = Url.#tryParseAbsolute(trimmed);
    if (parsed == null) {
      if (!trimmed.includes(".")) return null;
      parsed = Url.#tryParseAbsolute("https://" + trimmed);
      if (parsed == null) return null;
    }

    return parsed;
  }

  static parse(input: string): Url {
    const r = Url.tryParse(input);
    if (r === null) throw new Error("Invalid URL.");
    return r;
  }

  /**
   * The standard `URL` view of this value, for interop with `fetch` and other
   * web APIs. The .NET port exposes the same thing as `ToUri()`.
   */
  toUrl(): URL {
    return new URL(this.value);
  }

  /** Creates a {@link Url} from a standard `URL`. Throws when it cannot be represented. */
  static fromUrl(url: URL): Url {
    const r = Url.tryParse(url.href);
    if (r === null) throw new Error("Invalid URL.");
    return r;
  }

  static isValid(input: string | null | undefined): boolean {
    return Url.tryParse(input) !== null;
  }

  static format(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    const r = Url.tryParse(input);
    if (r) return r.value;
    if (options?.fallbackToTrimmedInputWhenInvalid && input != null && input.trim() !== "") {
      return input.trim();
    }
    return null;
  }

  static normalize(
    input: string | null | undefined,
    options?: { fallbackToTrimmedInputWhenInvalid?: boolean },
  ): string | null {
    return Url.format(input, options);
  }

  static isNormalized(input: string | null | undefined): boolean {
    return input != null && Url.normalize(input) === input;
  }

  /** Returns the normalized URL, e.g. `https://www.example.com/path`. */
  toNormalizedString(): string {
    return this.value;
  }

  /** Returns the normalized URL, e.g. `https://www.example.com/path`. */
  toString(): string {
    return this.value;
  }

  /**
   * Scans unstructured text for potential URLs. Heuristic — may include false positives.
   */
  static findCandidatesInText(text: string): readonly TextCandidate<Url>[] {
    if (!text) return [];
    const out: TextCandidate<Url>[] = [];
    SCAN_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = SCAN_PATTERN.exec(text)) !== null) {
      const candidate = trimTrailingPunctuation(m[0]);
      const url = Url.tryParse(candidate);
      if (!url) continue;
      out.push(
        new TextCandidate<Url>({
          startIndex: m.index,
          length: candidate.length,
          originalText: candidate,
          typeName: "Url",
          category: TextCandidateCategory.Contact,
          normalizedForm: url.toNormalizedString(),
          formattedForm: url.toString(),
          maskedForm: maskUrl(url),
          confidence: TextMatchConfidence.High,
          value: url,
        }),
      );
    }
    return out;
  }

  equals(other: Url | null | undefined): boolean {
    return other != null && this.value === other.value;
  }

  compareTo(other: Url | null | undefined): number {
    if (other == null) return 1;
    return this.value < other.value ? -1 : this.value > other.value ? 1 : 0;
  }

  static #tryParseAbsolute(input: string): Url | null {
    const m = input.match(ABSOLUTE_URI);
    if (!m) return null;
    const scheme = m[1]!.toLowerCase();
    if (scheme.includes(".")) return null;

    const isHierarchical = HIERARCHICAL_RE.test(input);
    if (isHierarchical) {
      return Url.#parseHierarchical(input, scheme);
    }
    return Url.#parseNonHierarchical(input, scheme);
  }

  static #parseHierarchical(input: string, scheme: string): Url | null {
    let u: URL;
    try {
      u = new URL(input);
    } catch {
      return null;
    }

    const rawHost = u.hostname;
    const isIp = rawHost.length > 0 && (IPV4.test(rawHost) || rawHost.startsWith("["));
    let tld = "";
    if (!isIp && rawHost.length > 0) {
      const lastDot = rawHost.lastIndexOf(".");
      tld = lastDot >= 0 ? rawHost.slice(lastDot + 1) : "";
    }

    let country: Country | null = null;
    if (!isIp && tld.length > 0) {
      country = getTldCountryMap().get("." + tld) ?? null;
    }

    const isExample =
      !isIp &&
      rawHost.length > 0 &&
      (RESERVED_TLDS.has(tld.toLowerCase()) ||
        RESERVED_DOMAINS.has(rawHost.toLowerCase()) ||
        rawHost.toLowerCase().endsWith(".example.com") ||
        rawHost.toLowerCase().endsWith(".example.org") ||
        rawHost.toLowerCase().endsWith(".example.net"));

    let port: number | null = null;
    if (u.port !== "") port = parseInt(u.port, 10);
    if (port != null && DEFAULT_PORTS[scheme] === port) port = null;

    const normalized = u.href;
    const path = u.pathname;
    const query = u.search.length > 0 ? u.search.slice(1) : null;
    const fragment = u.hash.length > 0 ? u.hash.slice(1) : null;

    return new Url({
      value: normalized,
      scheme,
      host: rawHost,
      port,
      path: path.length === 0 ? "/" : path,
      query,
      fragment,
      tld,
      country,
      isExample,
      isIp,
    });
  }

  static #parseNonHierarchical(input: string, scheme: string): Url | null {
    const colonIdx = input.indexOf(":");
    if (colonIdx < 0) return null;
    const rest = input.slice(colonIdx + 1);
    if (rest.length === 0) return null;

    let host = "";
    let tld = "";
    let country: Country | null = null;
    let isExample = false;
    let path = rest;
    let query: string | null = null;
    let fragment: string | null = null;

    if (scheme === "mailto") {
      const qIdx = rest.indexOf("?");
      let mainPart = rest;
      if (qIdx >= 0) {
        mainPart = rest.slice(0, qIdx);
        const fragIdx = rest.indexOf("#", qIdx);
        if (fragIdx >= 0) {
          query = rest.slice(qIdx + 1, fragIdx);
          fragment = rest.slice(fragIdx + 1);
        } else {
          query = rest.slice(qIdx + 1);
        }
      } else {
        const fragIdx = rest.indexOf("#");
        if (fragIdx >= 0) {
          mainPart = rest.slice(0, fragIdx);
          fragment = rest.slice(fragIdx + 1);
        }
      }

      const atIdx = mainPart.lastIndexOf("@");
      if (atIdx >= 0) {
        host = mainPart.slice(atIdx + 1).toLowerCase();
        const lastDot = host.lastIndexOf(".");
        tld = lastDot >= 0 ? host.slice(lastDot + 1) : "";
        if (tld.length > 0) {
          country = getTldCountryMap().get("." + tld) ?? null;
        }
        isExample =
          RESERVED_TLDS.has(tld.toLowerCase()) ||
          RESERVED_DOMAINS.has(host) ||
          host.endsWith(".example.com") ||
          host.endsWith(".example.org") ||
          host.endsWith(".example.net");
      }
      path = mainPart;
    } else {
      const qIdx = rest.indexOf("?");
      if (qIdx >= 0) {
        path = rest.slice(0, qIdx);
        const fragIdx = rest.indexOf("#", qIdx);
        if (fragIdx >= 0) {
          query = rest.slice(qIdx + 1, fragIdx);
          fragment = rest.slice(fragIdx + 1);
        } else {
          query = rest.slice(qIdx + 1);
        }
      } else {
        const fragIdx = rest.indexOf("#");
        if (fragIdx >= 0) {
          path = rest.slice(0, fragIdx);
          fragment = rest.slice(fragIdx + 1);
        }
      }
    }

    const normalized = `${scheme}:${rest}`;
    return new Url({
      value: normalized,
      scheme,
      host,
      port: null,
      path,
      query,
      fragment,
      tld,
      country,
      isExample,
      isIp: false,
    });
  }
}

function trimTrailingPunctuation(value: string): string {
  let end = value.length;
  while (end > 0) {
    const ch = value[end - 1];
    if (
      ch === "." ||
      ch === "," ||
      ch === ";" ||
      ch === "!" ||
      ch === "?" ||
      ch === ")" ||
      ch === "]" ||
      ch === ">" ||
      ch === "'" ||
      ch === '"'
    ) {
      if (ch === ")" && value.includes("(")) break;
      if (ch === "]" && value.includes("[")) break;
      end--;
    } else {
      break;
    }
  }
  return end < value.length ? value.slice(0, end) : value;
}

/**
 * Returns a masked URL showing the scheme and host but obscuring the path,
 * query, and fragment, e.g.
 * `https://www.example.com/my/secret/page?key=val` →
 * `https://www.example.com/***?***`.
 * For non-hierarchical URIs (mailto:, tel:), returns `scheme:***`.
 */
export function maskUrl(url: Url): string {
  const schemePrefix = url.scheme + "://";
  if (!url.value.toLowerCase().startsWith(schemePrefix)) {
    return `${url.scheme}:***`;
  }

  let s = url.scheme + "://" + url.host;
  if (url.port != null) s += ":" + url.port;

  if (url.path === "/" || url.path === "") {
    s += "/";
  } else {
    s += "/***";
  }

  if (url.query != null) s += "?***";
  if (url.fragment != null) s += "#***";
  return s;
}
