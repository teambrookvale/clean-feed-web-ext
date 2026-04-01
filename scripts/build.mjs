import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const firefoxDir = path.join(distDir, "firefox");
const chromiumDir = path.join(distDir, "chromium");

const copyTargets = [
  "src"
];

build();

function build() {
  resetDir(distDir);
  mkdirSync(firefoxDir, { recursive: true });
  mkdirSync(chromiumDir, { recursive: true });

  for (const target of copyTargets) {
    copyTarget(target, firefoxDir);
    copyTarget(target, chromiumDir);
  }

  const baseManifest = JSON.parse(readFileSync(path.join(rootDir, "manifest.json"), "utf8"));

  const firefoxManifest = {
    ...baseManifest
  };

  const chromiumManifest = {
    ...baseManifest
  };

  delete chromiumManifest.browser_specific_settings;

  writeManifest(path.join(firefoxDir, "manifest.json"), firefoxManifest);
  writeManifest(path.join(chromiumDir, "manifest.json"), chromiumManifest);

  console.log(`Built Firefox bundle: ${relative(firefoxDir)}`);
  console.log(`Built Chromium bundle: ${relative(chromiumDir)}`);
}

function resetDir(dirPath) {
  rmSync(dirPath, { recursive: true, force: true });
  mkdirSync(dirPath, { recursive: true });
}

function copyTarget(target, outDir) {
  const sourcePath = path.join(rootDir, target);
  const destinationPath = path.join(outDir, target);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing build input: ${target}`);
  }

  cpSync(sourcePath, destinationPath, { recursive: true });
}

function writeManifest(filePath, manifest) {
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function relative(targetPath) {
  return path.relative(rootDir, targetPath) || ".";
}
