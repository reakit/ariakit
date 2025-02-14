// run this: `bun deps [component/subcomponent]`
// options:
// --resolved (-r): print resolved deps

import { parseArgs } from "node:util";
// @ts-expect-error No Bun types for now.
import Bun from "bun";
import {
  getDeps,
  getGroupedDeps,
  getGroupedResolvedDeps,
  getResolvedDeps,
} from "./lib/deps.ts";
import { log, space } from "./lib/log.ts";
import { getFlatStatusTree, getGroupedFlatStatusTree } from "./lib/status.ts";

async function printDeps(component: string, resolved = false, grouped = false) {
  const flatStatusTree = grouped
    ? await getGroupedFlatStatusTree()
    : await getFlatStatusTree();
  const deps = grouped
    ? resolved
      ? await getGroupedResolvedDeps(component)
      : await getGroupedDeps(component)
    : resolved
      ? await getResolvedDeps(component)
      : await getDeps(component);

  const totalDeps = deps.length;
  const portedDepCount = deps.filter(
    (dep) => flatStatusTree[dep] === "both",
  ).length;
  if (portedDepCount === totalDeps) {
    log(`all ported! (${portedDepCount}/${totalDeps})`, "green", 1);
  } else if (portedDepCount) {
    log(`some ported (${portedDepCount}/${totalDeps})`, "yellow", 1);
  } else {
    log(`none ported (${totalDeps})`, "red", 1);
  }

  space();

  for (const dep of deps.sort()) {
    const status = flatStatusTree[dep];
    log(dep, status === "both" ? "green" : "red", 1);
  }
}

async function print() {
  const {
    values: { resolved },
    positionals,
  } = parseArgs({
    args: Bun.argv,
    options: { resolved: { type: "boolean", short: "r", default: false } },
    strict: true,
    allowPositionals: true,
  });
  const component = positionals[2];
  if (!component) throw new Error("Component is required");

  const grouped = !component.includes("/");
  const labels = Object.entries({ resolved })
    .filter(([, value]) => value)
    .map(([key]) => key);
  const hasLabels = labels.length > 0;

  space();
  log(`> ${component} deps${hasLabels ? ` (${labels.join(", ")})` : ""}`);
  space();
  await printDeps(component, resolved, grouped);
}

await print();
