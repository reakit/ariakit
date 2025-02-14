// run this: `bun dependents-count`
// options:
// --resolved (-r): print resolved dependent counts
// --ascending (-a): sort by dependent count in ascending order
// --descending (-d): sort by dependent count in descending order
// --unlocked (-u): show only unlocked components

import { parseArgs } from "node:util";
// @ts-expect-error No Bun types for now.
import Bun from "bun";
import {
  getDependentCounts,
  getDeps,
  getResolvedDependentCounts,
  getResolvedDeps,
  getUnlockedComponents,
} from "./lib/deps.ts";
import { c, log, space } from "./lib/log.ts";
import { getFlatStatusTree } from "./lib/status.ts";

async function printDependentCounts(
  resolved = false,
  ascending = false,
  descending = false,
  unlocked = false,
) {
  const flatStatusTree = await getFlatStatusTree();
  const dependentCounts = resolved
    ? await getResolvedDependentCounts()
    : await getDependentCounts();
  const allDeps = resolved ? await getResolvedDeps() : await getDeps();

  let components = Object.keys(dependentCounts);
  if (unlocked) {
    const unlockedComponents = await getUnlockedComponents();
    components = components.filter((component) =>
      unlockedComponents.includes(component),
    );
  }

  const sortedComponents = components.sort((a, b) => {
    if (ascending) return dependentCounts[a]! - dependentCounts[b]!;
    if (descending) return dependentCounts[b]! - dependentCounts[a]!;
    return a.localeCompare(b);
  });

  const maxDependentCount = Math.max(...Object.values(dependentCounts));
  const maxDependentCountLength = String(maxDependentCount).length;
  const maxComponentLength = Math.max(
    ...sortedComponents.map((component) => component.length),
  );

  for (const component of sortedComponents) {
    const count = dependentCounts[component];
    const deps = allDeps[component.split("/")[0]!]![component.split("/")[1]!]!;
    const portedDependentCount = deps.filter(
      (dep: any) => flatStatusTree[dep] === "both",
    ).length;
    const status = flatStatusTree[component];
    const paddedComponent = component.padEnd(maxComponentLength, " ");
    if (count === 0) {
      log(
        `${c(paddedComponent, status === "both" ? "green" : "red")}     no dependents`,
      );
    } else {
      const portedDependentCountPadded = String(portedDependentCount).padStart(
        maxDependentCountLength,
        " ",
      );
      const countPadded = String(count).padStart(maxDependentCountLength, " ");
      const portedColor =
        portedDependentCount === count
          ? "green"
          : portedDependentCount === 0
            ? "red"
            : "yellow";
      log(
        `${c(paddedComponent, status === "both" ? "green" : "red")}     ${c(portedDependentCountPadded, portedColor)} / ${countPadded}`,
      );
    }
  }
}

async function print() {
  const {
    values: { resolved, ascending, descending, unlocked },
  } = parseArgs({
    args: Bun.argv,
    options: {
      resolved: { type: "boolean", short: "r", default: false },
      ascending: { type: "boolean", short: "a", default: false },
      descending: { type: "boolean", short: "d", default: false },
      unlocked: { type: "boolean", short: "u", default: false },
    },
    strict: true,
    allowPositionals: true,
  });

  space();
  log(
    `> Dependent counts (ported/total${resolved ? ", resolved" : ""}${unlocked ? ", unlocked" : ""})`,
  );
  space();
  await printDependentCounts(resolved, ascending, descending, unlocked);
}

await print();
