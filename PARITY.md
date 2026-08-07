# .NET parity

`@budiauktioner/buildi-primitives` is a port of the .NET package
[`Buildi.Primitives`](https://github.com/BudiAuktioner/Buildi.Primitives), which
is the behavioural specification for both languages. This document records
exactly how much of that surface is implemented here.

|                   |                            |
| ----------------- | -------------------------- |
| .NET baseline     | `Buildi.Primitives` 0.21.0 |
| This package      | `0.1.1`                    |
| Namespaces ported | 10 of 13                   |
| Types ported      | 111 of 200                 |

Type counts follow the catalog in the .NET README — the value-object types a
consumer works with directly, excluding extension-method containers and internal
helpers.

Parity is enforced by [`test/parity/dotnet-parity.test.ts`](test/parity/dotnet-parity.test.ts),
which asserts that every .NET public type, masking function, `validate()`
implementation, `findCandidatesInText()` implementation, and `TextScanResult`
accessor in the ported namespaces exists here. Update that test in the same
commit that changes the .NET baseline.

## Namespace coverage

| .NET namespace    | Status          | Notes                                                    |
| ----------------- | --------------- | -------------------------------------------------------- |
| `Organization`    | Complete        | 10 types                                                 |
| `Banking`         | Complete        | 10 types                                                 |
| `Person`          | Complete        | 6 types                                                  |
| `Geography`       | Complete        | 7 types                                                  |
| `Finance`         | Complete        | 3 types, plus `ExchangeRates`                            |
| `Contact`         | Complete        | Including all 31 country address / zip-code pairs        |
| `Web`             | Complete        | 2 types                                                  |
| `Property`        | Complete        | 2 types                                                  |
| `Validation`      | Complete        | Shared `ValidationResult` infrastructure                 |
| `TextScanning`    | Complete        | Scanner, candidates, overlap resolution, typed accessors |
| **`Measurement`** | **In progress** | `Length` and `LengthUnit`; 23 quantity types to go       |
| **`Vehicle`**     | **Not ported**  | 29 types                                                 |
| **`Product`**     | **Not ported**  | 36 types                                                 |

## Cross-cutting features

| Feature                                                                    | Status                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| `tryParse` / `parse` / `isValid` / `format` / `normalize` / `isNormalized` | Complete for every ported type                      |
| `typeInfo` metadata (English + Swedish name, emoji, sources)               | Complete                                            |
| `validate()` structured validation                                         | Complete — all 12 ported types that have it in .NET |
| `findCandidatesInText()` text scanning                                     | Complete — all 24 ported types that have it in .NET |
| `TextScanResult` typed accessors                                           | Complete for the 24 ported scannable types          |
| Masking (`toMaskedString` → `mask*` functions)                             | Complete for ported namespaces                      |
| Lookup and external-link helpers                                           | Complete for ported namespaces                      |
| `PrimitivesDefaults` (culture, UI culture, country, calling code)          | Complete                                            |
| Sample data                                                                | Partial — see below                                 |
| **`toNaturalString()` natural unit display**                               | **Not ported** — belongs to `Measurement`           |

## Known gaps within ported namespaces

- **`SampleOrganizations` / `SampleOrganization`.** The .NET package ships a
  composite record joining ~22 publicly known Swedish organizations across
  organization number, VAT, address, banking, and geography. This port has
  per-type sample data for the same organizations, but not the composite record.

## Intentional API divergences

These differ from .NET on purpose and are not tracked as gaps.

| .NET                                      | This package                                   | Reason                                               |
| ----------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `static bool TryParse(s, out T)`          | `static tryParse(s): T \| null`                | No `out` parameters in TypeScript                    |
| Extension method `value.ToMaskedString()` | `maskXxx(value)` module function               | No extension methods; keeps masking tree-shakeable   |
| `IReadOnlyList<T>`                        | `readonly T[]`                                 | Idiomatic TypeScript                                 |
| `Uri` interop via `ToUri()` / `FromUri()` | `toUrl()` / `fromUrl()` using `URL`            | `URL` is the web-platform equivalent of `System.Uri` |
| `GeoCoordinate.DistanceTo(other)`         | `distanceKilometersTo(other)`                  | Names the unit at the call site                      |
| `CultureInfo`                             | BCP-47 strings on `PrimitivesDefaults.culture` | Standard `Intl` has no `CultureInfo` equivalent      |
| `IBudiTimeProvider`                       | `Clock` interface in `internal/clock.ts`       | Minimal injectable clock for date-dependent types    |

`Address.asCountryAddress()` additionally depends on the country-specific
address modules having been loaded. Every package entry point re-exports them,
so this is transparent to consumers; see
[`src/contact/country-address-registry.ts`](src/contact/country-address-registry.ts).

## Porting `Measurement`

The namespace divides into 19 quantity types, each paired with a unit class, and
six standalone types (`Count`, `Percentage`, `SoundLevel`, `TemperatureDelta`,
`Year`, `YearMonth`). There are 133 units in total.

`Length` is ported as the reference implementation. The remaining 18 quantities
share its shape, so the work is mostly supplying unit tables and the named
accessors that make each dimension readable.

Two things do not follow the pattern:

- **`Temperature` is affine.** `TemperatureUnit` has no `ToBaseUnitFactor`
  because Celsius, Fahrenheit and kelvin differ by offset as well as scale, so
  it cannot use the shared multiplicative conversion.
- **Arithmetic has no operators.** C# overloads `+ - * /` and the comparison
  operators on every quantity; those become `plus`, `minus`, `times`,
  `dividedBy`, `negated`, `isLessThan` and `isGreaterThan`.

Values are held internally as an exact base-10 decimal
([`internal/decimal.ts`](src/internal/decimal.ts)) rather than `number`.
Binary floating point turns `3 ft` into `0.9144000000000001 m` on the
`normalize()` path, which would break the `isNormalized` contract and diverge
from .NET. Consumer-facing accessors such as `length.meters` still return
`number`; the conversion happens only at the boundary.

## Porting the remaining namespaces

`Measurement` is the prerequisite for the other two: `Vehicle` wraps it for
`EngineDisplacement`, `EnginePower`, and `OdometerReading`, and `Product` wraps
it for `StorageCapacity`, `RamCapacity`, `ProcessorSpeed`, and
`BatteryCapacity`. `Product` and `Vehicle` are independent of each other.

```
Measurement (24 types)
  ├── Vehicle (29 types)
  └── Product (36 types)
```

Each namespace additionally needs its `TextCandidateCategory` scanners
registered in [`src/register-default-text-scanners.ts`](src/register-default-text-scanners.ts)
and typed accessors added to
[`src/text-scanning/text-scan-result.ts`](src/text-scanning/text-scan-result.ts).
The .NET `TextScanResult` has 67 typed accessors in total; the 24 belonging to
ported namespaces are implemented, and the remaining 43 arrive with their
namespaces.
