// run this: `bun test-status`

import { log, space } from "./lib/log.ts";
import { type TestStatusMatch, getTestStatusTree } from "./lib/test-status.ts";

const COLOR_BY_MATCH: Record<TestStatusMatch, string> = {
  both: "green",
  react: "red",
  solid: "blue",
};

async function printTestSummary(depth = 0) {
  const tree = await getTestStatusTree();
  const tests = Object.keys(tree).filter((status) => status !== "solid");
  const totalTests = tests.length;
  const totalTestsPorted = tests.filter((test) => tree[test] === "both").length;
  const totalDirsNotPorted = tests.filter(
    (test) => tree[test] === "react",
  ).length;

  log(`ported tests: ${totalTestsPorted}/${totalTests}`, "green", depth);
  log(
    `(${((totalTestsPorted / totalTests) * 100).toFixed(2)}%)`,
    "green",
    depth + 1,
  );
  log(`remaining tests: ${totalDirsNotPorted}/${totalTests}`, "red", depth);
  log(
    `(${((totalDirsNotPorted / totalTests) * 100).toFixed(2)}%)`,
    "red",
    depth + 1,
  );
}

async function printTree(depth = 0) {
  const tree = await getTestStatusTree();
  for (const test of Object.keys(tree).sort()) {
    const match = tree[test]!;
    const color = COLOR_BY_MATCH[match];
    log(test, color, depth);
  }
}

function printLegend(depth = 0) {
  log("ported", COLOR_BY_MATCH.both, depth);
  log("not ported yet", COLOR_BY_MATCH.react, depth);
}

async function print() {
  space();
  log("> meaning of colors");
  space();
  printLegend(1);
  space();
  log("> test port summary");
  space();
  await printTestSummary(1);
  space();
  log("> ported tests");
  space();
  await printTree(1);
}

await print();
