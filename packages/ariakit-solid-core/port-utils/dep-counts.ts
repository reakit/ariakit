// run this: `bun dep-counts`
// options:
// --resolved (-r): print resolved dep counts
// --ascending (-a): sort by dep count in ascending order
// --descending (-d): sort by dep count in descending order
// --unlocked (-u): show only unlocked components
// --grouped (-g): show grouped dependency counts

import { parseArgs } from "node:util";
// @ts-expect-error No Bun types for now.
import Bun from "bun";
import {
  getDepCounts,
  getDeps,
  getGroupedDeps,
  getGroupedResolvedDeps,
  getResolvedDepCounts,
  getResolvedDeps,
  getUnlockedComponents,
} from "./lib/deps.ts";
import { c, log, space } from "./lib/log.ts";
import { getFlatStatusTree, getGroupedFlatStatusTree } from "./lib/status.ts";

async function printDepCounts(
  resolved = false,
  ascending = false,
  descending = false,
  unlocked = false,
  grouped = false,
) {
  const flatStatusTree = await getFlatStatusTree();
  const groupedFlatStatusTree = await getGroupedFlatStatusTree();
  const depCounts = resolved
    ? await getResolvedDepCounts(grouped)
    : await getDepCounts(grouped);
  const allDeps = resolved
    ? grouped
      ? await getGroupedResolvedDeps()
      : await getResolvedDeps()
    : grouped
      ? await getGroupedDeps()
      : await getDeps();

  let components = Object.keys(depCounts);
  if (unlocked) {
    const unlockedComponents = await getUnlockedComponents(grouped);
    components = components.filter((component) =>
      unlockedComponents.includes(component),
    );
  }

  if (components.length === 0) {
    log("no matching components", "yellow");
    return;
  }

  const sortedComponents = components.sort((a, b) => {
    if (ascending) return depCounts[a]! - depCounts[b]!;
    if (descending) return depCounts[b]! - depCounts[a]!;
    return a.localeCompare(b);
  });

  const maxDepCount = Math.max(...Object.values(depCounts));
  const maxDepCountLength = String(maxDepCount).length;
  const maxComponentLength = Math.max(
    ...sortedComponents.map((component) => component.length),
  );
  const maxPortedTotalLength = `${maxDepCountLength}/${maxDepCountLength}`
    .length;

  for (const component of sortedComponents) {
    const count = depCounts[component];
    const deps = grouped
      ? allDeps[component]!
      : (allDeps[component.split("/")[0]!]! as any)[component.split("/")[1]!]!;
    const portedDepCount = deps.filter((dep: any) =>
      grouped
        ? groupedFlatStatusTree[dep] === "both"
        : flatStatusTree[dep] === "both",
    ).length;
    const status = grouped
      ? groupedFlatStatusTree[component]
      : flatStatusTree[component];
    const paddedComponent = component.padEnd(maxComponentLength, " ");
    if (count === 0) {
      log(
        `${c(paddedComponent, status === "both" ? "green" : "red")}     no deps`,
      );
    } else {
      const portedTotal = `${portedDepCount}/${count}`.padStart(
        maxPortedTotalLength + 1,
        " ",
      );
      const portedColor =
        portedDepCount === count
          ? "green"
          : portedDepCount === 0
            ? "red"
            : "yellow";
      log(
        `${c(paddedComponent, status === "both" ? "green" : "red")}     ${c(portedTotal, portedColor)}`,
      );
    }
  }
}

async function print() {
  const {
    values: { resolved, ascending, descending, unlocked, grouped },
  } = parseArgs({
    args: Bun.argv,
    options: {
      resolved: { type: "boolean", short: "r", default: false },
      ascending: { type: "boolean", short: "a", default: false },
      descending: { type: "boolean", short: "d", default: false },
      unlocked: { type: "boolean", short: "u", default: false },
      grouped: { type: "boolean", short: "g", default: false },
    },
    strict: true,
    allowPositionals: true,
  });

  space();
  log(
    `> Dependency counts (ported/total${resolved ? ", resolved" : ""}${unlocked ? ", unlocked" : ""}${grouped ? ", grouped" : ""})`,
  );
  space();
  await printDepCounts(resolved, ascending, descending, unlocked, grouped);
}

await print();
