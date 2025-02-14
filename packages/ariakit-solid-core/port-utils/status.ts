// run this: `bun status`

import { log, space } from "./lib/log.ts";
import {
  type DirStatusMatch,
  type FileStatusMatch,
  getDirStatusInfo,
  getStatusTree,
} from "./lib/status.ts";

const DIR_INFO = await getDirStatusInfo();

const COLOR_BY_MATCH: Record<DirStatusMatch, string> = {
  both: "green",
  partial: "yellow",
  react: "red",
  solid: "blue",
};

async function printPortSummary(depth = 0) {
  const tree = await getStatusTree();
  const dirs = Object.keys(tree).filter((dir) => DIR_INFO[dir] !== "solid");
  const totalDirs = dirs.length;
  const totalDirsPorted = dirs.filter((dir) => DIR_INFO[dir] === "both").length;
  const totalDirsPartial = dirs.filter(
    (dir) => DIR_INFO[dir] === "partial",
    0,
  ).length;
  const totalDirsNotPorted = dirs.filter(
    (dir) => DIR_INFO[dir] === "react",
    0,
  ).length;

  log(`ported components: ${totalDirsPorted}/${totalDirs}`, "green", depth);
  log(
    `(${((totalDirsPorted / totalDirs) * 100).toFixed(2)}%)`,
    "green",
    depth + 1,
  );
  if (totalDirsPartial) {
    log(
      `partially ported components: ${totalDirsPartial}/${totalDirs}`,
      "yellow",
      depth,
    );
    log(
      `(${((totalDirsPartial / totalDirs) * 100).toFixed(2)}%)`,
      "yellow",
      depth + 1,
    );
  }
  log(`remaining components: ${totalDirsNotPorted}/${totalDirs}`, "red", depth);
  log(
    `(${((totalDirsNotPorted / totalDirs) * 100).toFixed(2)}%)`,
    "red",
    depth + 1,
  );

  space();

  const fileMatches = Object.values(tree).reduce(
    (acc, dirValue) => {
      for (const file of Object.keys(dirValue)) {
        const fileMatch = dirValue[file]!;
        if (fileMatch === "solid") continue;
        acc[file] = fileMatch;
      }
      return acc;
    },
    {} as Record<string, FileStatusMatch>,
  );
  const files = Object.keys(fileMatches);
  const totalFiles = files.length;
  const totalFilesPorted = files.filter(
    (file) => fileMatches[file] === "both",
  ).length;
  const totalFilesNotPorted = files.filter(
    (file) => fileMatches[file] === "react",
    0,
  ).length;

  log(
    `ported sub-components: ${totalFilesPorted}/${totalFiles}`,
    "green",
    depth,
  );
  log(
    `(${((totalFilesPorted / totalFiles) * 100).toFixed(2)}%)`,
    "green",
    depth + 1,
  );
  log(
    `remaining sub-components: ${totalFilesNotPorted}/${totalFiles}`,
    "red",
    depth,
  );
  log(
    `(${((totalFilesNotPorted / totalFiles) * 100).toFixed(2)}%)`,
    "red",
    depth + 1,
  );
}

async function printTree(depth = 0) {
  const tree = await getStatusTree();
  for (const dir of Object.keys(tree).sort()) {
    const dirMatch = DIR_INFO[dir]!;
    const dirColor = COLOR_BY_MATCH[dirMatch];
    log(dir, dirColor, depth);
    if (dirMatch === "partial") {
      const dirValue = tree[dir]!;
      for (const file of Object.keys(dirValue).sort()) {
        const fileMatch = dirValue[file]!;
        const fileColor = COLOR_BY_MATCH[fileMatch];
        log(file, fileColor, depth + 1);
      }
    }
  }
}

function printLegend(depth = 0) {
  log("fully ported", COLOR_BY_MATCH.both, depth);
  log("partially ported", COLOR_BY_MATCH.partial, depth);
  log("not ported yet", COLOR_BY_MATCH.react, depth);
  log("new in Ariakit Solid", COLOR_BY_MATCH.solid, depth);
}

async function print() {
  space();
  log("> meaning of colors");
  space();
  printLegend(1);
  space();
  log("> port summary");
  space();
  await printPortSummary(1);
  space();
  log("> ported components");
  space();
  await printTree(1);
}

await print();
