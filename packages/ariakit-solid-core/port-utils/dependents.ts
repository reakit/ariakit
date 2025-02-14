// run this: `bun dependents [component/subcomponent]`
// options:
// --resolved (-r): print resolved dependents

import { parseArgs } from "node:util";
// @ts-expect-error No Bun types for now.
import Bun from "bun";
import {
  getDependents,
  getGroupedDependents,
  getResolvedDependents,
  getResolvedGroupedDependents,
} from "./lib/deps.ts";
import { log, space } from "./lib/log.ts";
import { getFlatStatusTree, getGroupedFlatStatusTree } from "./lib/status.ts";

async function printDependents(
  component: string,
  resolved = false,
  grouped = false,
) {
  const flatStatusTree = grouped
    ? await getGroupedFlatStatusTree()
    : await getFlatStatusTree();
  const dependents = grouped
    ? resolved
      ? await getResolvedGroupedDependents(component)
      : await getGroupedDependents(component)
    : resolved
      ? await getResolvedDependents(component)
      : await getDependents(component);

  const totalDependents = dependents.length;
  const portedDependentCount = dependents.filter(
    (dep) => flatStatusTree[dep] === "both",
  ).length;
  if (portedDependentCount === totalDependents) {
    log(`all ported! (${portedDependentCount}/${totalDependents})`, "green", 1);
  } else if (portedDependentCount) {
    log(
      `some ported (${portedDependentCount}/${totalDependents})`,
      "yellow",
      1,
    );
  } else {
    log(`none ported (${totalDependents})`, "red", 1);
  }

  space();

  for (const dep of dependents.sort()) {
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
  log(`> ${component} dependents${hasLabels ? ` (${labels.join(", ")})` : ""}`);
  space();
  await printDependents(component, resolved, grouped);
}

await print();
