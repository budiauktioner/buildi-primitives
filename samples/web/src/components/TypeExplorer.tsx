import { useMemo, useState } from "react";
import { TYPE_REGISTRY, type Category, type TypeEntry } from "../type-registry";

export function TypeExplorer() {
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(TYPE_REGISTRY.map((t) => [t.name, t.sample])),
  );

  const grouped = useMemo(() => {
    const map = new Map<Category, TypeEntry[]>();
    for (const t of TYPE_REGISTRY) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="card mb-4">
      <div className="card-header d-flex align-items-center justify-content-between">
        <h5 className="mb-0">Type Explorer</h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() =>
            setInputs(Object.fromEntries(TYPE_REGISTRY.map((t) => [t.name, t.sample])))
          }
        >
          Reset to samples
        </button>
      </div>
      <div className="card-body">
        <p className="text-body-secondary small mb-3">
          All v1 types from <code>contact</code>, <code>person</code>, <code>organization</code>,
          and <code>geography</code>. Edit any input to see live validation results.
        </p>

        {grouped.map(([category, types]) => (
          <div key={category} className="mb-4">
            <h6 className="mt-2 mb-2 text-body-secondary border-bottom pb-1">{category}</h6>
            <div className="table-responsive">
              <table
                className="table table-sm align-middle mb-2 type-table"
                style={{ fontSize: "0.82rem" }}
              >
                <thead>
                  <tr className="text-body-secondary">
                    <th style={{ width: 230 }}>Type</th>
                    <th style={{ width: 280 }}>Input</th>
                    <th style={{ width: 60 }} className="text-center">
                      Valid
                    </th>
                    <th>Format()</th>
                    <th>Normalize()</th>
                    <th>Masked</th>
                    <th>Properties</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => {
                    const value = inputs[t.name] ?? "";
                    const has = value.length > 0;
                    const valid = has && t.isValid(value);
                    const formatted = has ? t.format(value) : null;
                    const normalized = has ? t.normalize(value) : null;
                    const masked = valid && t.mask ? t.mask(value) : null;
                    const properties = valid && t.properties ? t.properties(value) : null;
                    return (
                      <tr key={t.name}>
                        <td className="fw-medium text-nowrap">
                          <span title={t.name}>
                            {t.emoji} {t.name}
                          </span>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm font-monospace py-0"
                            style={{ fontSize: "0.78rem" }}
                            value={value}
                            onChange={(e) =>
                              setInputs((prev) => ({ ...prev, [t.name]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="text-center">
                          {!has ? (
                            <span className="text-body-tertiary">—</span>
                          ) : valid ? (
                            <span className="text-success fw-bold">✓</span>
                          ) : (
                            <span className="text-danger">✗</span>
                          )}
                        </td>
                        <td>
                          <code className="small">{formatted ?? "—"}</code>
                        </td>
                        <td>
                          <code className="small">{normalized ?? "—"}</code>
                        </td>
                        <td>
                          <code className="small">{masked ?? "—"}</code>
                        </td>
                        <td>
                          {properties ? (
                            <div className="d-flex flex-column gap-1">
                              {properties.map((p, i) => (
                                <code key={i} className="small">
                                  {p}
                                </code>
                              ))}
                            </div>
                          ) : (
                            <span className="text-body-tertiary">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
