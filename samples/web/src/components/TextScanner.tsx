import { useMemo, useState } from "react";
import {
  TextCandidateCategory,
  TextMatchConfidence,
  defaultTextScanner,
} from "@budiauktioner/buildi-primitives";
import type { TextCandidate, TextScanResult } from "@budiauktioner/buildi-primitives";
import { SAMPLE_TEXTS } from "../sample-texts";

type DisplayMode = "label" | "mask" | "redact";

const MODE_LABELS: Record<DisplayMode, string> = {
  label: "Label",
  mask: "Mask",
  redact: "Redact",
};

const CONFIDENCE_LABELS: Record<TextMatchConfidence, string> = {
  [TextMatchConfidence.Low]: "Low",
  [TextMatchConfidence.Medium]: "Medium",
  [TextMatchConfidence.High]: "High",
};

const CATEGORY_BADGE: Record<TextCandidateCategory, string> = {
  [TextCandidateCategory.PersonalIdentifier]: "bg-danger-subtle text-danger-emphasis",
  [TextCandidateCategory.OrganizationIdentifier]: "bg-primary-subtle text-primary-emphasis",
  [TextCandidateCategory.Financial]: "bg-success-subtle text-success-emphasis",
  [TextCandidateCategory.Contact]: "bg-info-subtle text-info-emphasis",
  [TextCandidateCategory.Vehicle]: "bg-warning-subtle text-warning-emphasis",
  [TextCandidateCategory.Property]: "bg-secondary-subtle text-secondary-emphasis",
  [TextCandidateCategory.Product]: "bg-secondary-subtle text-secondary-emphasis",
  [TextCandidateCategory.Geography]: "bg-success-subtle text-success-emphasis",
  [TextCandidateCategory.Measurement]: "bg-warning-subtle text-warning-emphasis",
};

const CATEGORY_HIGHLIGHT: Record<TextCandidateCategory, string> = {
  [TextCandidateCategory.PersonalIdentifier]: "cat-personalidentifier",
  [TextCandidateCategory.OrganizationIdentifier]: "cat-organizationidentifier",
  [TextCandidateCategory.Financial]: "cat-financial",
  [TextCandidateCategory.Contact]: "cat-contact",
  [TextCandidateCategory.Vehicle]: "cat-vehicle",
  [TextCandidateCategory.Property]: "cat-property",
  [TextCandidateCategory.Product]: "cat-product",
  [TextCandidateCategory.Geography]: "cat-geography",
  [TextCandidateCategory.Measurement]: "cat-measurement",
};

export function TextScanner() {
  const [text, setText] = useState<string>(SAMPLE_TEXTS[0]!.text);
  const [mode, setMode] = useState<DisplayMode>("label");
  const [minConfidence, setMinConfidence] = useState<TextMatchConfidence>(TextMatchConfidence.Low);

  const result = useMemo<TextScanResult>(
    () => defaultTextScanner.scan(text, { minimumConfidence: minConfidence }),
    [text, minConfidence],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<TextCandidateCategory, number>();
    for (const c of result.resolvedCandidates) {
      counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return counts;
  }, [result]);

  return (
    <div className="card mb-4">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="mb-0">Text Scanner</h5>
        <small className="text-body-secondary">
          {result.resolvedCandidates.length} resolved · {result.totalCount} raw
        </small>
      </div>
      <div className="card-body">
        <p className="text-body-secondary small mb-2">
          Paste text containing Swedish identifiers — the scanner detects organization numbers,
          personal identity numbers, phone numbers, IBANs, addresses, and more.
        </p>

        <div className="row g-2 mb-2">
          <div className="col">
            <textarea
              className="form-control font-monospace"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type text here..."
            />
          </div>
          <div className="col-auto d-flex flex-column gap-2">
            <span className="text-body-secondary small">Load example:</span>
            {SAMPLE_TEXTS.map((s) => (
              <button
                key={s.name}
                type="button"
                className="btn btn-outline-secondary btn-sm text-start"
                onClick={() => setText(s.text)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
          <div className="btn-group" role="group">
            {(Object.keys(MODE_LABELS) as DisplayMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setMode(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <select
            className="form-select form-select-sm w-auto"
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value) as TextMatchConfidence)}
          >
            {(Object.values(TextMatchConfidence) as TextMatchConfidence[]).map((c) => (
              <option key={c} value={c}>
                Min: {CONFIDENCE_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        {result.resolvedCandidates.length > 0 ? (
          <div className="mb-2 d-flex flex-wrap gap-1 align-items-center">
            {[...categoryCounts.entries()].map(([cat, count]) => (
              <span key={cat} className={`badge ${CATEGORY_BADGE[cat]}`}>
                {cat} ({count})
              </span>
            ))}
          </div>
        ) : (
          <div className="alert alert-info small py-2 mb-2">No candidates found.</div>
        )}

        <div className="p-3 bg-body-tertiary rounded border scan-output">
          {mode === "label" ? renderLabeled(text, result.resolvedCandidates) : null}
          {mode === "mask" ? result.maskAll(text) : null}
          {mode === "redact" ? result.redactAll(text) : null}
        </div>

        {result.resolvedCandidates.length > 0 && (
          <details className="mt-3">
            <summary className="btn btn-link btn-sm p-0 text-decoration-none">
              Show all {result.resolvedCandidates.length} candidates
            </summary>
            <div className="table-responsive mt-2">
              <table className="table table-sm table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Original</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Confidence</th>
                    <th>Formatted</th>
                    <th>Normalized</th>
                    <th>Masked</th>
                  </tr>
                </thead>
                <tbody>
                  {result.resolvedCandidates.map((c, i) => (
                    <tr key={`${c.startIndex}-${i}`}>
                      <td>
                        <code>{c.originalText}</code>
                      </td>
                      <td className="small">{c.typeName}</td>
                      <td>
                        <span className={`badge ${CATEGORY_BADGE[c.category]}`}>{c.category}</span>
                      </td>
                      <td>{CONFIDENCE_LABELS[c.confidence]}</td>
                      <td>
                        <code>{c.formattedForm}</code>
                      </td>
                      <td>
                        <code>{c.normalizedForm}</code>
                      </td>
                      <td>
                        <code>{c.maskedForm}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function renderLabeled(text: string, candidates: readonly TextCandidate[]) {
  if (candidates.length === 0) return text;
  const sorted = [...candidates].sort((a, b) => a.startIndex - b.startIndex);
  const fragments: React.ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((c, i) => {
    if (c.startIndex > cursor) fragments.push(text.slice(cursor, c.startIndex));
    fragments.push(
      <mark
        key={`m-${i}`}
        className={`scan-match ${CATEGORY_HIGHLIGHT[c.category]}`}
        title={`${c.typeName} (${c.category}, ${CONFIDENCE_LABELS[c.confidence]})\nFormatted: ${c.formattedForm}\nNormalized: ${c.normalizedForm}\nMasked: ${c.maskedForm}`}
      >
        {text.slice(c.startIndex, c.startIndex + c.length)}
      </mark>,
    );
    cursor = c.startIndex + c.length;
  });
  if (cursor < text.length) fragments.push(text.slice(cursor));
  return fragments;
}
