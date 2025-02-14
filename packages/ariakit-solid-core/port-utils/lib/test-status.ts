import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
// @ts-expect-error No Bun types for now.
import { $ } from "bun";

const ROOT_PATH = (await $`git rev-parse --show-toplevel`.text()).trim();
const EXAMPLES_PATH = resolve(ROOT_PATH, "examples");

async function getDirs(dir: string) {
  const dirs = await readdir(dir);
  return dirs.filter((dir) => !dir.includes("."));
}

export type TestStatusMatch = "react" | "solid" | "both";
export type TestStatusTree = Record<string, TestStatusMatch>;

type AllowedTestLoader = "react" | "solid";

function parseFixture(filename?: string) {
  if (!filename) return false;
  const match = filename.match(
    // @ts-expect-error Test runner is not limited by ES2017 target.
    /examples\/(?<dir>.*)\/index\.((?<loader>react|solid)\.)?tsx$/,
  );
  if (!match?.groups) return false;
  const { dir, loader } = match.groups;
  if (!dir) return false;
  return { loader: (loader ?? "react") as AllowedTestLoader };
}

let CACHED_TREE: TestStatusTree | undefined = undefined;

export async function getTestStatusTree() {
  if (CACHED_TREE) return CACHED_TREE;
  const examplesDirs = await getDirs(EXAMPLES_PATH);
  const tree: TestStatusTree = {};
  for (const dir of examplesDirs) {
    const files = await readdir(resolve(EXAMPLES_PATH, dir));
    for (const file of files) {
      const fullPath = resolve(EXAMPLES_PATH, dir, file);
      const result = parseFixture(fullPath);
      if (!result) continue;
      const { loader } = result;
      if (!tree[dir]) {
        tree[dir] = loader;
        continue;
      }
      if (tree[dir] === "both") continue;
      tree[dir] = tree[dir] !== loader ? "both" : tree[dir];
    }
  }
  CACHED_TREE = tree;
  return tree;
}
