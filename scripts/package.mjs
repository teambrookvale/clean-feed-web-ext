import { existsSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const targets = [
  { name: "firefox", dir: path.join(distDir, "firefox"), zip: path.join(distDir, "linkedin-ai-feed-filter-firefox.zip") },
  { name: "chromium", dir: path.join(distDir, "chromium"), zip: path.join(distDir, "linkedin-ai-feed-filter-chromium.zip") }
];

packageBuilds();

function packageBuilds() {
  if (!existsSync(distDir)) {
    throw new Error("Missing dist directory. Run `npm run build` first.");
  }

  for (const target of targets) {
    if (!existsSync(target.dir)) {
      throw new Error(`Missing build target: ${target.name}. Run \`npm run build\` first.`);
    }

    rmSync(target.zip, { force: true });
    const entries = readdirSync(target.dir);

    if (entries.length === 0) {
      throw new Error(`Build target is empty: ${target.name}`);
    }

    execFileSync("zip", ["-rq", target.zip, ...entries], {
      cwd: target.dir,
      stdio: "inherit"
    });

    console.log(`Packaged ${target.name}: ${path.relative(rootDir, target.zip)}`);
  }
}
