import { build } from "esbuild";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(rootDirectory, "src");
const distDirectory = path.join(rootDirectory, "dist");

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".ts") ? [entryPath] : [];
    }),
  );
  return files.flat();
}

const entryPoints = await collectTypeScriptFiles(sourceDirectory);

await rm(distDirectory, { recursive: true, force: true });

const sharedOptions = {
  absWorkingDir: rootDirectory,
  entryPoints,
  outbase: sourceDirectory,
  bundle: false,
  sourcemap: true,
  target: "es2022",
  platform: "neutral",
};

await Promise.all([
  build({
    ...sharedOptions,
    format: "esm",
    outdir: path.join(distDirectory, "esm"),
  }),
  build({
    ...sharedOptions,
    format: "cjs",
    outdir: path.join(distDirectory, "cjs"),
  }),
]);

await mkdir(path.join(distDirectory, "cjs"), { recursive: true });
await writeFile(
  path.join(distDirectory, "cjs", "package.json"),
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
);
