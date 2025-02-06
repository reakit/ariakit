import { join } from "node:path";
import { watch } from "chokidar";
import { globSync } from "glob";
import { writePackageJson } from "./utils.js";

/** @param {string} path */
function processDevPackage(path) {
  if (path.includes("ariakit-tailwind")) return;
  const match = path.match(/packages\/(.*)\/src/);
  if (!match) return;
  const [, pkg] = match;
  if (!pkg) return;
  const pkgPath = join(process.cwd(), "packages", pkg);
  writePackageJson(pkgPath);
}

const packages = globSync("packages/*/src");

for (const path of packages) {
  processDevPackage(path);
}

watch(["packages/*/src/**"], { ignoreInitial: true })
  .on("add", processDevPackage)
  .on("unlink", processDevPackage)
  .on("unlinkDir", processDevPackage);
