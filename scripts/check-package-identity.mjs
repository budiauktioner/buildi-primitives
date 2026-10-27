import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const rootDirectory = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(rootDirectory, "dist");
const require = createRequire(import.meta.url);

const expectedRegisteredTypeNames = [
  "Address",
  "AddressZipCode",
  "Area",
  "Bic",
  "BoltPattern",
  "Color",
  "Country",
  "DataSize",
  "DunsNumber",
  "ElectricCharge",
  "ElectricCurrent",
  "ElectricalPhase",
  "EmailAddress",
  "EmissionRate",
  "Energy",
  "EnginePower",
  "EuTypeApprovalNumber",
  "EuVatNumber",
  "EuroEmissionClass",
  "FlowRate",
  "Frequency",
  "FuelConsumption",
  "Gtin12",
  "Gtin13",
  "Gtin14",
  "Gtin8",
  "Iban",
  "IpRating",
  "Isin",
  "LeiCode",
  "Length",
  "Luminance",
  "LuminousFlux",
  "OperatingHours",
  "Percentage",
  "PhoneNumber",
  "Power",
  "Pressure",
  "Refrigerant",
  "RotationalSpeed",
  "ScreenResolution",
  "ScreenSize",
  "SoundLevel",
  "Speed",
  "SwedishAddress",
  "SwedishBankAccount",
  "SwedishBankgiroNumber",
  "SwedishCoordinationNumber",
  "SwedishCounty",
  "SwedishDrivingLicenseCategory",
  "SwedishEcoVehicleClassification",
  "SwedishMunicipality",
  "SwedishOcrReferenceNumber",
  "SwedishOrganizationNumber",
  "SwedishPersonalIdentityNumber",
  "SwedishPostgiroNumber",
  "SwedishPropertyDesignation",
  "SwedishSwishNumber",
  "SwedishVehicleRegistrationNumber",
  "Temperature",
  "TireDimension",
  "Torque",
  "Url",
  "VehicleIdentificationNumber",
  "Voltage",
  "Volume",
  "WatercraftIdentificationNumber",
  "Weight",
  "WheelRimDimension",
].sort();

async function loadPublic(format, specifier) {
  return format === "esm" ? import(specifier) : require(specifier);
}

async function loadDirect(format, relativePath) {
  const filePath = path.join(distDirectory, format, relativePath);
  return format === "esm" ? import(pathToFileURL(filePath).href) : require(filePath);
}

function assertRegisteredTypes(scanner, label) {
  const names = scanner.registered.map(({ typeName }) => typeName);
  assert.equal(new Set(names).size, names.length, `${label} has no duplicate registrations`);
  assert.deepEqual(names.toSorted(), expectedRegisteredTypeNames, `${label} registered type set`);
}

async function runScenario(format, scenario) {
  const directScannerModule = await loadDirect(format, "text-scanning/text-scanner.js");
  assert.equal(
    directScannerModule.defaultTextScanner.registered.length,
    0,
    `${format}/${scenario} starts unregistered`,
  );

  let publicRoot;
  let directRoot;
  let publicMeasurement;
  let directMeasurement;
  let publicProduct;
  let directProduct;
  let publicScanning;
  let directScanning;

  if (scenario === "value-first") {
    publicMeasurement = await loadPublic(format, "@budiauktioner/buildi-primitives/measurement");
    publicProduct = await loadPublic(format, "@budiauktioner/buildi-primitives/product");
    directMeasurement = await loadDirect(format, "measurement/index.js");
    directProduct = await loadDirect(format, "product/index.js");

    assert.equal(
      directScannerModule.defaultTextScanner.registered.length,
      0,
      `${format} value-object subpaths do not register scanners`,
    );
    assert.strictEqual(
      directMeasurement.Length,
      publicMeasurement.Length,
      `${format} direct/public Measurement identity before root`,
    );
    assert.strictEqual(
      directProduct.BatteryChemistry,
      publicProduct.BatteryChemistry,
      `${format} direct/public Product identity before root`,
    );

    publicRoot = await loadPublic(format, "@budiauktioner/buildi-primitives");
    directRoot = await loadDirect(format, "index.js");
    publicScanning = await loadPublic(format, "@budiauktioner/buildi-primitives/text-scanning");
    directScanning = await loadDirect(format, "text-scanning/index.js");
  } else if (scenario === "root-first") {
    publicRoot = await loadPublic(format, "@budiauktioner/buildi-primitives");
    directRoot = await loadDirect(format, "index.js");
    publicMeasurement = await loadPublic(format, "@budiauktioner/buildi-primitives/measurement");
    directMeasurement = await loadDirect(format, "measurement/index.js");
    publicProduct = await loadPublic(format, "@budiauktioner/buildi-primitives/product");
    directProduct = await loadDirect(format, "product/index.js");
    publicScanning = await loadPublic(format, "@budiauktioner/buildi-primitives/text-scanning");
    directScanning = await loadDirect(format, "text-scanning/index.js");
  } else {
    assert.equal(scenario, "text-scanning-first");
    publicScanning = await loadPublic(format, "@budiauktioner/buildi-primitives/text-scanning");
    directScanning = await loadDirect(format, "text-scanning/index.js");
    publicRoot = await loadPublic(format, "@budiauktioner/buildi-primitives");
    directRoot = await loadDirect(format, "index.js");
    publicMeasurement = await loadPublic(format, "@budiauktioner/buildi-primitives/measurement");
    directMeasurement = await loadDirect(format, "measurement/index.js");
    publicProduct = await loadPublic(format, "@budiauktioner/buildi-primitives/product");
    directProduct = await loadDirect(format, "product/index.js");
  }

  assert.strictEqual(directRoot.Length, directMeasurement.Length, `${format} direct Length`);
  assert.strictEqual(publicRoot.Length, publicMeasurement.Length, `${format} public Length`);
  assert.strictEqual(directRoot.Length, publicRoot.Length, `${format} root export identity`);
  assert.strictEqual(
    directRoot.BatteryChemistry,
    directProduct.BatteryChemistry,
    `${format} direct BatteryChemistry`,
  );
  assert.strictEqual(
    publicRoot.BatteryChemistry,
    publicProduct.BatteryChemistry,
    `${format} public BatteryChemistry`,
  );
  assert.strictEqual(
    directProduct.BatteryChemistry,
    publicProduct.BatteryChemistry,
    `${format} Product export identity`,
  );
  assert.strictEqual(
    directScannerModule.defaultTextScanner,
    directScanning.defaultTextScanner,
    `${format} direct scanner identity`,
  );
  assert.strictEqual(
    directScanning.defaultTextScanner,
    publicScanning.defaultTextScanner,
    `${format} scanner export identity`,
  );
  assert.strictEqual(
    directRoot.defaultTextScanner,
    publicRoot.defaultTextScanner,
    `${format} root scanner identity`,
  );
  assert.strictEqual(
    directRoot.PrimitivesDefaults,
    publicRoot.PrimitivesDefaults,
    `${format} PrimitivesDefaults identity`,
  );

  assertRegisteredTypes(directScannerModule.defaultTextScanner, `${format}/${scenario}`);
  const registrationsBeforeRepeat = [...directScannerModule.defaultTextScanner.registered];
  publicScanning.registerDefaultTextScanners();
  publicScanning.registerDefaultTextScanners();
  directScanning.registerDefaultTextScanners();
  assert.deepEqual(
    directScannerModule.defaultTextScanner.registered,
    registrationsBeforeRepeat,
    `${format}/${scenario} repeated registration is idempotent`,
  );

  publicRoot.PrimitivesDefaults.uiCulture = "en-US";
  assert.equal(directProduct.BatteryChemistry.LithiumIon.toString(), "Lithium-ion");
  directRoot.PrimitivesDefaults.reset();
}

const requestedScenario = process.argv[2];
const requestedFormat = process.argv[3];

if (requestedScenario === undefined) {
  for (const format of ["esm", "cjs"]) {
    for (const scenario of ["value-first", "root-first", "text-scanning-first"]) {
      const child = spawnSync(process.execPath, [scriptPath, scenario, format], {
        stdio: "inherit",
      });
      if (child.error !== undefined) throw child.error;
      assert.equal(child.status, 0, `${format}/${scenario} subprocess passed`);
    }
  }
} else {
  assert.ok(requestedFormat === "esm" || requestedFormat === "cjs");
  await runScenario(requestedFormat, requestedScenario);
}
