import { describe, expect, it } from "vitest";
import { Area } from "../../src/measurement/area.js";
import { DataSize } from "../../src/measurement/data-size.js";
import { ElectricCharge } from "../../src/measurement/electric-charge.js";
import { ElectricCurrent } from "../../src/measurement/electric-current.js";
import { Energy } from "../../src/measurement/energy.js";
import { FlowRate } from "../../src/measurement/flow-rate.js";
import { Frequency } from "../../src/measurement/frequency.js";
import { Length } from "../../src/measurement/length.js";
import { Luminance } from "../../src/measurement/luminance.js";
import { LuminousFlux } from "../../src/measurement/luminous-flux.js";
import { Percentage } from "../../src/measurement/percentage.js";
import { Power } from "../../src/measurement/power.js";
import { Pressure } from "../../src/measurement/pressure.js";
import { RotationalSpeed } from "../../src/measurement/rotational-speed.js";
import { SoundLevel } from "../../src/measurement/sound-level.js";
import { Speed } from "../../src/measurement/speed.js";
import { Temperature } from "../../src/measurement/temperature.js";
import { Torque } from "../../src/measurement/torque.js";
import { Voltage } from "../../src/measurement/voltage.js";
import { Volume } from "../../src/measurement/volume.js";
import { Weight } from "../../src/measurement/weight.js";

type Scan = (text: string) => readonly unknown[];

const BOUNDARIES = [
  ["Unicode letter", "å"],
  ["Unicode number", "٣"],
  ["underscore", "_"],
] as const;

/**
 * Every scannable dimension with a sample that ends in a letter, so both the
 * leading and the trailing boundary are exercised.
 */
const SCANNERS: readonly (readonly [string, string, Scan])[] = [
  ["area", "5 ha", Area.findCandidatesInText.bind(Area)],
  ["data size", "512 GB", DataSize.findCandidatesInText.bind(DataSize)],
  ["electric charge", "3000 mAh", ElectricCharge.findCandidatesInText.bind(ElectricCharge)],
  ["electric current", "16 A", ElectricCurrent.findCandidatesInText.bind(ElectricCurrent)],
  ["energy", "75 kWh", Energy.findCandidatesInText.bind(Energy)],
  ["flow rate", "12 l/min", FlowRate.findCandidatesInText.bind(FlowRate)],
  ["frequency", "3 GHz", Frequency.findCandidatesInText.bind(Frequency)],
  ["length", "24 m", Length.findCandidatesInText.bind(Length)],
  ["luminance", "400 nits", Luminance.findCandidatesInText.bind(Luminance)],
  ["luminous flux", "800 lm", LuminousFlux.findCandidatesInText.bind(LuminousFlux)],
  ["power", "150 kW", Power.findCandidatesInText.bind(Power)],
  ["pressure", "2 bar", Pressure.findCandidatesInText.bind(Pressure)],
  ["rotational speed", "3000 rpm", RotationalSpeed.findCandidatesInText.bind(RotationalSpeed)],
  ["sound level", "85 dB", SoundLevel.findCandidatesInText.bind(SoundLevel)],
  ["speed", "90 km/h", Speed.findCandidatesInText.bind(Speed)],
  ["temperature", "20 °C", Temperature.findCandidatesInText.bind(Temperature)],
  ["torque", "400 Nm", Torque.findCandidatesInText.bind(Torque)],
  ["voltage", "230 V", Voltage.findCandidatesInText.bind(Voltage)],
  ["volume", "5 l", Volume.findCandidatesInText.bind(Volume)],
  ["weight", "1500 kg", Weight.findCandidatesInText.bind(Weight)],
];

// Percentage ends in `%`, which terminates the match on its own, so only its
// leading boundary is under test.
const LEADING_ONLY: readonly (readonly [string, string, Scan])[] = [
  ["percentage", "45 %", Percentage.findCandidatesInText.bind(Percentage)],
];

describe("measurement scanner Unicode boundaries", () => {
  it.each(
    [...SCANNERS, ...LEADING_ONLY].map(([name, sample, scan]) => [name, sample, scan] as const),
  )("still finds a clean %s", (_name, sample, scan) => {
    expect(scan(`Uppgiften anger ${sample} i annonsen.`)).toHaveLength(1);
  });

  it.each(
    [...SCANNERS, ...LEADING_ONLY].flatMap(([name, sample, scan]) =>
      BOUNDARIES.map(
        ([boundaryName, boundary]) =>
          [`${name} after a ${boundaryName}`, () => scan(`(${boundary}${sample})`)] as const,
      ),
    ),
  )("does not find %s", (_name, scan) => {
    expect(scan()).toEqual([]);
  });

  it.each(
    SCANNERS.flatMap(([name, sample, scan]) =>
      BOUNDARIES.map(
        ([boundaryName, boundary]) =>
          [`${name} before a ${boundaryName}`, () => scan(`(${sample}${boundary})`)] as const,
      ),
    ),
  )("does not find %s", (_name, scan) => {
    expect(scan()).toEqual([]);
  });
});

describe("sound level word-boundary transition", () => {
  it("stops at dB when the weighting is followed by a non-word character", () => {
    const found = SoundLevel.findCandidatesInText("Ljudnivå 69 dB(A) vid drift.");

    expect(found).toHaveLength(1);
    expect(found[0]!.originalText).toBe("69 dB");
  });

  it("keeps the weighting when a word character follows", () => {
    const found = SoundLevel.findCandidatesInText("Ljudnivå 69 dBA vid drift.");

    expect(found).toHaveLength(1);
    expect(found[0]!.originalText).toBe("69 dBA");
  });
});

describe("measurement scanners in Swedish prose", () => {
  it.each([
    ["Garantin gäller i 24 månader.", Length.findCandidatesInText.bind(Length)],
    ["Paketet innehåller 5 mätare.", Length.findCandidatesInText.bind(Length)],
    ["Bilen väger 123 väldigt mycket.", Voltage.findCandidatesInText.bind(Voltage)],
    ["Det tog 3 tågresor.", Weight.findCandidatesInText.bind(Weight)],
    ["Vi har 10 knappar kvar.", Speed.findCandidatesInText.bind(Speed)],
    ["Hyllan rymmer 4 böcker.", DataSize.findCandidatesInText.bind(DataSize)],
  ] as const)("reads no measurement out of %j", (text, scan) => {
    expect(scan(text)).toEqual([]);
  });
});
