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

| .NET namespace | Status         | Notes                                                    |
| -------------- | -------------- | -------------------------------------------------------- |
| `Organization` | Complete       | 10 types                                                 |
| `Banking`      | Complete       | 10 types                                                 |
| `Person`       | Complete       | 6 types                                                  |
| `Geography`    | Complete       | 7 types                                                  |
| `Finance`      | Complete       | 3 types, plus `ExchangeRates`                            |
| `Contact`      | Complete       | Including all 31 country address / zip-code pairs        |
| `Web`          | Complete       | 2 types                                                  |
| `Property`     | Complete       | 2 types                                                  |
| `Validation`   | Complete       | Shared `ValidationResult` infrastructure                 |
| `TextScanning` | Complete       | Scanner, candidates, overlap resolution, typed accessors |
| `Measurement`  | Full parity    | 19 dimensions, 136 units, 5 standalone types             |
| **`Vehicle`**  | **Not ported** | 29 types                                                 |
| **`Product`**  | **Not ported** | 36 types                                                 |

## Cross-cutting features

| Feature                                                                    | Status                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| `tryParse` / `parse` / `isValid` / `format` / `normalize` / `isNormalized` | Complete for every ported type                      |
| `typeInfo` metadata (English + Swedish name, emoji, sources)               | Complete                                            |
| `validate()` structured validation                                         | Complete — all 12 ported types that have it in .NET |
| `findCandidatesInText()` text scanning                                     | Complete — all 45 ported types that have it in .NET |
| `TextScanResult` typed accessors                                           | Complete for the 45 ported scannable types          |
| Masking (`toMaskedString` → `mask*` functions)                             | Complete for ported namespaces                      |
| Lookup and external-link helpers                                           | Complete for ported namespaces                      |
| `PrimitivesDefaults` (culture, UI culture, country, calling code)          | Complete                                            |
| Sample data                                                                | Partial — see below                                 |
| `toNaturalString()` natural unit display                                   | Complete                                            |

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

The namespace is fully ported: nineteen dimensions covering 136 units, plus the
five standalone types `Count`, `Percentage`, `SoundLevel`, `Year` and
`YearMonth`, which have no unit table and no conversion.

Four things do not follow the common pattern:

- **`Temperature` is affine.** `TemperatureUnit` has no `ToBaseUnitFactor`
  because Celsius, Fahrenheit and kelvin differ by offset as well as scale, so
  it neither uses the shared multiplicative conversion nor extends the common
  base classes. Subtracting two temperatures yields a `TemperatureDelta`, where
  a kelvin and a Celsius degree are the same interval and Fahrenheit scales by
  9/5. Round-tripping through Fahrenheit drifts in the last digits — 0 °F comes
  back as -4e-27 °F — and the port reproduces that rather than hiding it,
  because .NET lands on the same value.
- **Some factors are repeating decimals.** 1/60 for rpm, 1/3600 for coulomb,
  1000/3600 for km/h. Multiplying by the rounded factor and dividing by it are
  not inverses, so those five units carry an exact numerator/denominator pair
  instead. .NET special-cases exactly the same units.
- **`mW` against `MW`, `mV` against `MV`.** Unit lookup is otherwise
  case-insensitive, but these two pairs differ by a factor of a billion, so
  `PowerUnit` and `VoltageUnit` resolve them case-sensitively first. For the
  same reason `Power`'s scan pattern is split in two: .NET writes it as one
  regex with a scoped `(?i:...)` group, which JavaScript has no equivalent for.
- **Arithmetic has no operators.** C# overloads `+ - * /` and the comparison
  operators on every quantity; those become `plus`, `minus`, `times`,
  `dividedBy`, `negated`, `isLessThan` and `isGreaterThan`.

Unit lookup case-folds by upper-casing rather than lower-casing, matching
.NET's `StringComparer.OrdinalIgnoreCase`. Lower-casing would break `ΜW`: the
micro sign `µ` and the Greek capital mu `Μ` fold together going up but not
going down.

Two dimensions accept a bare number and assume a unit, as .NET does:
`Luminance` reads it as candela per square metre and rejects negatives, and
`RotationalSpeed` reads it as rpm.

`Speed`, `Torque` and `RotationalSpeed` have no curated display scale in .NET,
so `naturalUnit` falls back to the base unit for them.

The unit tables are static class fields, which bundlers keep whether or not the
class is referenced, so the `measurement` subpath does not shrink to the single
dimension a consumer imports. Splitting it into per-dimension subpaths would
fix that if it becomes a problem.

Values are held internally as an exact base-10 decimal
([`internal/decimal.ts`](src/internal/decimal.ts)) rather than `number`.
Binary floating point turns `3 ft` into `0.9144000000000001 m` on the
`normalize()` path, which would break the `isNormalized` contract and diverge
from .NET. Consumer-facing accessors such as `length.meters` still return
`number`; the conversion happens only at the boundary.

## Porting the remaining namespaces

`Vehicle` and `Product` both build on `Measurement`, which is now in place:
`Vehicle` wraps it for `EngineDisplacement`, `EnginePower` and
`OdometerReading`, and `Product` wraps it for `StorageCapacity`,
`RamCapacity`, `ProcessorSpeed` and `BatteryCapacity`. The two are independent
of each other, so they can be ported in either order.

```
Measurement (ported)
  ├── Vehicle (29 types)
  └── Product (36 types)
```

Each namespace additionally needs its `TextCandidateCategory` scanners
registered in [`src/register-default-text-scanners.ts`](src/register-default-text-scanners.ts)
and typed accessors added to
[`src/text-scanning/text-scan-result.ts`](src/text-scanning/text-scan-result.ts).
The .NET `TextScanResult` has 67 typed accessors in total; the 45 belonging to
ported namespaces are implemented, and the remaining 22 arrive with their
namespaces.
