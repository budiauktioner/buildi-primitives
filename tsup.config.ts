import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "contact/index": "src/contact/index.ts",
    "person/index": "src/person/index.ts",
    "organization/index": "src/organization/index.ts",
    "geography/index": "src/geography/index.ts",
    "validation/index": "src/validation/index.ts",
    "text-scanning/index": "src/text-scanning/index.ts",
    "sample-data/index": "src/sample-data/index.ts",
    "web/index": "src/web/index.ts",
    "finance/index": "src/finance/index.ts",
    "property/index": "src/property/index.ts",
    "banking/index": "src/banking/index.ts",
    "measurement/index": "src/measurement/index.ts",
    "vehicle/index": "src/vehicle/index.ts",
    "product/index": "src/product/index.ts",
  },
  format: ["esm", "cjs"],
  dts: { only: true },
  clean: false,
  splitting: false,
  treeshake: true,
  target: "es2022",
  outDir: "dist/types",
  tsconfig: "tsconfig.build.json",
});
